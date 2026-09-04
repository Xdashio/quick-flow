// Register-side ESC/POS Printer Abstraction — mirrors backend/src/hardware/printer.service.ts
// Used offline: generates REAL byte stream from REAL transaction data, writes to virtual printer file,
// optionally sends to network printer via Node net socket.

const fs = require("fs");
const path = require("path");

const ESC = 0x1b;
const GS = 0x1d;

class RegisterPrinter {
  constructor(options = {}) {
    this.virtualDir = options.virtualDir || path.join(__dirname, "../data/virtual-printer");
    this.printerHost = options.printerHost || process.env.POS_PRINTER_HOST;
    this.printerPort = parseInt(options.printerPort || process.env.POS_PRINTER_PORT || "9100", 10);
    fs.mkdirSync(this.virtualDir, { recursive: true });
    this.lastBytes = null;
    this.lastPath = null;
  }

  // Primary interface printReceipt(transaction) — identical contract to backend
  async printReceipt(tx) {
    const bytes = this.generateEscPosBytes(tx);
    this.lastBytes = bytes;
    const hexPreview = bytes.toString("hex").substring(0, 600);
    const textPreview = this.parseEscPosToText(bytes);

    const filename = `receipt-${tx.id}-${Date.now()}.bin`;
    const outputPath = path.join(this.virtualDir, filename);
    fs.writeFileSync(outputPath, bytes);
    fs.writeFileSync(outputPath + ".txt", textPreview, "utf-8");
    this.lastPath = outputPath;

    if (this.printerHost) {
      try {
        const ok = await this.sendToNetworkPrinter(bytes);
        if (ok) {
          console.log(`[RegisterPrinter] Receipt ${tx.id} → network ${this.printerHost}:${this.printerPort}`);
          return { success: true, bytesLength: bytes.length, hexPreview, textPreview, outputPath, virtualParsed: textPreview, printerType: "network" };
        }
      } catch (e) {
        console.warn(`[RegisterPrinter] Network failed, virtual fallback: ${e.message}`);
      }
    }

    console.log(`[RegisterPrinter] Receipt ${tx.id} → virtual (${bytes.length} bytes) → ${outputPath}`);
    return { success: true, bytesLength: bytes.length, hexPreview, textPreview, outputPath, virtualParsed: textPreview, printerType: "virtual" };
  }

  generateDrawerKickBytes(pin = 0) {
    return Buffer.from([ESC, 0x70, pin, 60, 255]);
  }

  async kickDrawer(pin = 0) {
    const kickBytes = this.generateDrawerKickBytes(pin);
    const hex = kickBytes.toString("hex");
    if (this.printerHost) {
      try {
        await this.sendToNetworkPrinter(kickBytes);
        return { success: true, bytesHex: hex, printerType: "network" };
      } catch (e) {
        console.warn(`[RegisterPrinter] Drawer kick network failed: ${e.message}`);
      }
    }
    const p = path.join(this.virtualDir, `drawer-kick-${Date.now()}.bin`);
    fs.writeFileSync(p, kickBytes);
    return { success: true, bytesHex: hex, printerType: "virtual", outputPath: p };
  }

  generateEscPosBytes(tx) {
    const chunks = [];
    const push = (...b) => chunks.push(Buffer.from(b));
    const pushText = (t) => chunks.push(Buffer.from(t, "utf-8"));
    const pushLine = (t) => { chunks.push(Buffer.from(t, "utf-8")); chunks.push(Buffer.from([0x0a])); };
    const formatKES = (cents) => `KES ${(cents / 100).toFixed(2)}`;

    push(ESC, 0x40);
    push(ESC, 0x61, 0x01);
    push(ESC, 0x45, 0x01);
    pushText("================================\n");
    pushText("     KENYA RETAIL — POS        \n");
    push(ESC, 0x45, 0x00);
    pushText("   Moi Avenue, Nairobi, Kenya  \n");
    pushText("   Tel: 0712345678 | KRA PIN   \n");
    pushText("================================\n");
    push(ESC, 0x61, 0x00);
    pushLine("");
    pushLine(`Receipt: ${tx.id.substring(0, 8).toUpperCase()}  ${new Date(tx.createdAt).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}`);
    if (tx.cashierId) pushLine(`Cashier: ${tx.cashierId.substring(0, 8)}`);
    pushLine("--------------------------------");
    pushLine("Item             Qty   Price    Total");
    pushLine("--------------------------------");
    for (const li of tx.lineItems) {
      const name = li.name.length > 16 ? li.name.substring(0, 16) : li.name.padEnd(16);
      const qty = Number(li.quantity).toFixed(Number(li.quantity) % 1 === 0 ? 0 : 2).padStart(4);
      const unit = formatKES(li.unitPriceCents).padStart(8);
      const total = formatKES(li.lineTotalCents).padStart(8);
      pushLine(`${name} ${qty} ${unit} ${total}`);
    }
    pushLine("--------------------------------");
    const labelW = 20, valW = 12;
    const line = (label, cents) => {
      const v = formatKES(cents);
      return `${label.padEnd(labelW)}${v.padStart(valW)}`;
    };
    pushLine(line("Subtotal:", tx.subtotalCents));
    pushLine(line("VAT:", tx.taxCents));
    push(GS, 0x21, 0x11);
    pushLine(line("TOTAL:", tx.totalCents));
    push(GS, 0x21, 0x00);
    pushLine("--------------------------------");
    if (tx.payment) {
      pushLine(line(`Paid (${tx.payment.method}):`, tx.payment.amountCents));
      if (typeof tx.changeDueCents === "number") {
        push(ESC, 0x45, 0x01);
        pushLine(line("Change Due:", tx.changeDueCents));
        push(ESC, 0x45, 0x00);
      }
      if (typeof tx.amountTenderedCents === "number") {
        pushLine(line("Tendered:", tx.amountTenderedCents));
      }
    }
    pushLine("");
    push(ESC, 0x61, 0x01);
    pushLine("Thank you for shopping with us!");
    pushLine("Goods once sold not returnable");
    pushLine("KRA eTIMS invoice available on sync");
    pushLine(`Ref: ${tx.id}`);
    pushLine("--------------------------------");
    pushLine("[QR: eTIMS pending online sync]");
    pushLine("");
    pushLine("Powered by POS — Cash is First Class");
    pushLine(new Date().toISOString());
    push(GS, 0x56, 0x42, 0x00);
    push(ESC, 0x70, 0x00, 60, 255);
    return Buffer.concat(chunks);
  }

  parseEscPosToText(bytes) {
    let out = "";
    let i = 0;
    while (i < bytes.length) {
      const b = bytes[i];
      if (b === ESC) {
        const n = bytes[i + 1];
        if (n === 0x40) { out += "[INIT]\n"; i += 2; continue; }
        else if (n === 0x45) { const v = bytes[i + 2]; out += v === 1 ? "[BOLD ON]" : "[BOLD OFF]"; i += 3; continue; }
        else if (n === 0x61) { const v = bytes[i + 2]; out += v === 0 ? "[LEFT]" : v === 1 ? "[CENTER]" : "[RIGHT]"; i += 3; continue; }
        else if (n === 0x70) { const m = bytes[i + 2], t1 = bytes[i + 3], t2 = bytes[i + 4]; out += `\n[DRAWER KICK pin=${m} t1=${t1}*2ms t2=${t2}*2ms]\n`; i += 5; continue; }
        else if (n === 0x24 || n === 0x5c) { i += 4; continue; }
        else { i += 2; continue; }
      } else if (b === GS) {
        const n = bytes[i + 1];
        if (n === 0x21) { const v = bytes[i + 2]; out += v !== 0 ? "[DOUBLE SIZE]" : "[NORMAL SIZE]"; i += 3; continue; }
        else if (n === 0x56) { if (bytes[i + 2] === 0x42) { out += "\n[CUT]\n"; i += 4; continue; } else { out += "\n[CUT]\n"; i += 3; continue; } }
        else { i += 2; continue; }
      } else if (b === 0x0a || b === 0x0d) { out += "\n"; i += 1; }
      else if (b >= 0x20 && b <= 0x7e) { out += String.fromCharCode(b); i += 1; }
      else { i += 1; }
    }
    return out;
  }

  async sendToNetworkPrinter(bytes) {
    if (!this.printerHost) return false;
    const net = require("net");
    return new Promise((resolve, reject) => {
      const sock = new net.Socket();
      let done = false;
      const to = setTimeout(() => { if (!done) { done = true; sock.destroy(); reject(new Error("Printer timeout")); } }, 3000);
      sock.connect(this.printerPort, this.printerHost, () => {
        sock.write(bytes, (err) => {
          clearTimeout(to);
          if (err) { done = true; sock.destroy(); reject(err); } else { done = true; sock.end(); resolve(true); }
        });
      });
      sock.on("error", (err) => { clearTimeout(to); if (!done) { done = true; reject(err); } });
    });
  }

  getLast() { return { path: this.lastPath, bytes: this.lastBytes }; }
}

module.exports = RegisterPrinter;
