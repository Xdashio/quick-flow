"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PrinterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrinterService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ESC = 0x1b;
const GS = 0x1d;
let PrinterService = PrinterService_1 = class PrinterService {
    logger = new common_1.Logger(PrinterService_1.name);
    virtualDir;
    printerHost;
    printerPort;
    lastReceiptPath = null;
    lastReceiptBytes = null;
    constructor() {
        this.virtualDir = path.join(process.cwd(), 'data', 'virtual-printer');
        this.printerHost = process.env.POS_PRINTER_HOST;
        this.printerPort = parseInt(process.env.POS_PRINTER_PORT || '9100', 10);
        fs.mkdirSync(this.virtualDir, { recursive: true });
    }
    async printReceipt(tx) {
        const bytes = this.generateEscPosBytes(tx);
        this.lastReceiptBytes = bytes;
        const hexPreview = bytes.toString('hex').substring(0, 400);
        const textPreview = this.parseEscPosToText(bytes);
        const virtualParsed = textPreview;
        const filename = `receipt-${tx.id}-${Date.now()}.bin`;
        const outputPath = path.join(this.virtualDir, filename);
        fs.writeFileSync(outputPath, bytes);
        fs.writeFileSync(outputPath + '.txt', textPreview, 'utf-8');
        this.lastReceiptPath = outputPath;
        if (this.printerHost) {
            try {
                const netSuccess = await this.sendToNetworkPrinter(bytes);
                if (netSuccess) {
                    this.logger.log(`Receipt ${tx.id} sent to network printer ${this.printerHost}:${this.printerPort} (${bytes.length} bytes)`);
                    return {
                        success: true,
                        bytesLength: bytes.length,
                        hexPreview,
                        textPreview,
                        outputPath,
                        virtualParsed,
                        printerType: 'network',
                    };
                }
            }
            catch (e) {
                this.logger.warn(`Network printer failed, falling back to virtual: ${e.message}`);
            }
        }
        this.logger.log(`Receipt ${tx.id} → virtual ESC/POS emulator (${bytes.length} bytes) → ${outputPath}`);
        return {
            success: true,
            bytesLength: bytes.length,
            hexPreview,
            textPreview,
            outputPath,
            virtualParsed,
            printerType: 'virtual',
        };
    }
    generateDrawerKickBytes(pin = 0) {
        return Buffer.from([ESC, 0x70, pin, 60, 255]);
    }
    async kickDrawer(pin = 0) {
        const kickBytes = this.generateDrawerKickBytes(pin);
        const bytesHex = kickBytes.toString('hex');
        if (this.printerHost) {
            try {
                await this.sendToNetworkPrinter(kickBytes);
                return { success: true, bytesHex, printerType: 'network' };
            }
            catch (e) {
                this.logger.warn(`Drawer kick network failed: ${e.message}`);
            }
        }
        const kickPath = path.join(this.virtualDir, `drawer-kick-${Date.now()}.bin`);
        fs.writeFileSync(kickPath, kickBytes);
        this.logger.log(`Drawer kick (virtual) ${bytesHex} → ${kickPath}`);
        return { success: true, bytesHex, printerType: 'virtual' };
    }
    getLastReceipt() {
        return { path: this.lastReceiptPath, bytes: this.lastReceiptBytes };
    }
    generateEscPosBytes(tx) {
        const chunks = [];
        const push = (...b) => chunks.push(Buffer.from(b));
        const pushText = (t) => chunks.push(Buffer.from(t, 'utf-8'));
        const pushLine = (t) => {
            chunks.push(Buffer.from(t, 'utf-8'));
            chunks.push(Buffer.from([0x0a]));
        };
        const formatKES = (cents) => {
            return `KES ${(cents / 100).toFixed(2)}`;
        };
        push(ESC, 0x40);
        push(ESC, 0x61, 0x01);
        push(ESC, 0x45, 0x01);
        pushText('================================\n');
        pushText('     KENYA RETAIL — POS        \n');
        push(ESC, 0x45, 0x00);
        pushText('   Moi Avenue, Nairobi, Kenya  \n');
        pushText('   Tel: 0712345678 | KRA PIN   \n');
        pushText('================================\n');
        push(ESC, 0x61, 0x00);
        pushLine('');
        pushLine(`Receipt: ${tx.id.substring(0, 8).toUpperCase()}  ${new Date(tx.createdAt).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}`);
        if (tx.cashierId)
            pushLine(`Cashier: ${tx.cashierId.substring(0, 8)}`);
        pushLine('--------------------------------');
        pushLine('Item             Qty   Price    Total');
        pushLine('--------------------------------');
        for (const li of tx.lineItems) {
            const name = li.name.length > 16 ? li.name.substring(0, 16) : li.name.padEnd(16);
            const qty = li.quantity.toFixed(li.quantity % 1 === 0 ? 0 : 2).padStart(4);
            const unit = formatKES(li.unitPriceCents).padStart(8);
            const total = formatKES(li.lineTotalCents).padStart(8);
            pushLine(`${name} ${qty} ${unit} ${total}`);
        }
        pushLine('--------------------------------');
        const labelWidth = 20;
        const valueWidth = 12;
        const line = (label, cents) => {
            const v = formatKES(cents);
            const padded = v.padStart(valueWidth);
            const l = label.padEnd(labelWidth);
            return `${l}${padded}`;
        };
        pushLine(line('Subtotal:', tx.subtotalCents));
        pushLine(line('VAT:', tx.taxCents));
        push(GS, 0x21, 0x11);
        pushLine(line('TOTAL:', tx.totalCents));
        push(GS, 0x21, 0x00);
        pushLine('--------------------------------');
        if (tx.payment) {
            pushLine(line(`Paid (${tx.payment.method}):`, tx.payment.amountCents));
            if (tx.payment.mpesaReceiptNumber) {
                pushLine(`M-Pesa Ref: ${tx.payment.mpesaReceiptNumber}`);
            }
            if (tx.payment.mpesaPhoneNumber) {
                pushLine(`Phone: ${tx.payment.mpesaPhoneNumber}`);
            }
            if (typeof tx.changeDueCents === 'number' && tx.changeDueCents >= 0 && tx.payment.method === 'cash') {
                push(ESC, 0x45, 0x01);
                pushLine(line('Change Due:', tx.changeDueCents));
                push(ESC, 0x45, 0x00);
            }
            if (typeof tx.amountTenderedCents === 'number' && tx.payment.method === 'cash') {
                pushLine(line('Tendered:', tx.amountTenderedCents));
            }
        }
        pushLine('');
        push(ESC, 0x61, 0x01);
        pushLine('Thank you for shopping with us!');
        pushLine('Goods once sold not returnable');
        pushLine('KRA eTIMS invoice available on sync');
        pushLine(`Ref: ${tx.id}`);
        pushLine('--------------------------------');
        pushLine('[QR: eTIMS pending online sync]');
        pushLine('');
        pushLine('Powered by POS — Cash is First Class');
        pushLine(new Date().toISOString());
        push(GS, 0x56, 0x42, 0x00);
        push(ESC, 0x70, 0x00, 60, 255);
        return Buffer.concat(chunks);
    }
    parseEscPosToText(bytes) {
        let out = '';
        let i = 0;
        while (i < bytes.length) {
            const b = bytes[i];
            if (b === ESC) {
                const next = bytes[i + 1];
                if (next === 0x40) {
                    out += '[INIT]\n';
                    i += 2;
                    continue;
                }
                else if (next === 0x45) {
                    const n = bytes[i + 2];
                    out += n === 1 ? '[BOLD ON]' : '[BOLD OFF]';
                    i += 3;
                    continue;
                }
                else if (next === 0x61) {
                    const n = bytes[i + 2];
                    const align = n === 0 ? '[LEFT]' : n === 1 ? '[CENTER]' : '[RIGHT]';
                    out += `${align}`;
                    i += 3;
                    continue;
                }
                else if (next === 0x70) {
                    const m = bytes[i + 2];
                    const t1 = bytes[i + 3];
                    const t2 = bytes[i + 4];
                    out += `\n[DRAWER KICK pin=${m} t1=${t1}*2ms t2=${t2}*2ms]\n`;
                    i += 5;
                    continue;
                }
                else if (next === 0x24 || next === 0x5c) {
                    i += 4;
                    continue;
                }
                else {
                    i += 2;
                    continue;
                }
            }
            else if (b === GS) {
                const next = bytes[i + 1];
                if (next === 0x21) {
                    const n = bytes[i + 2];
                    out += n !== 0 ? '[DOUBLE SIZE]' : '[NORMAL SIZE]';
                    i += 3;
                    continue;
                }
                else if (next === 0x56) {
                    if (bytes[i + 2] === 0x42) {
                        out += '\n[CUT]\n';
                        i += 4;
                        continue;
                    }
                    else {
                        out += '\n[CUT]\n';
                        i += 3;
                        continue;
                    }
                }
                else {
                    i += 2;
                    continue;
                }
            }
            else if (b === 0x0a || b === 0x0d) {
                out += '\n';
                i += 1;
            }
            else if (b >= 0x20 && b <= 0x7e) {
                out += String.fromCharCode(b);
                i += 1;
            }
            else {
                i += 1;
            }
        }
        return out;
    }
    async sendToNetworkPrinter(bytes) {
        if (!this.printerHost)
            return false;
        const net = await Promise.resolve().then(() => __importStar(require('net')));
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();
            let done = false;
            const timeout = setTimeout(() => {
                if (!done) {
                    done = true;
                    socket.destroy();
                    reject(new Error('Printer socket timeout'));
                }
            }, 3000);
            socket.connect(this.printerPort, this.printerHost, () => {
                socket.write(bytes, (err) => {
                    clearTimeout(timeout);
                    if (err) {
                        done = true;
                        socket.destroy();
                        reject(err);
                    }
                    else {
                        done = true;
                        socket.end();
                        resolve(true);
                    }
                });
            });
            socket.on('error', (err) => {
                clearTimeout(timeout);
                if (!done) {
                    done = true;
                    reject(err);
                }
            });
        });
    }
    getVirtualReceiptList() {
        try {
            return fs.readdirSync(this.virtualDir).filter((f) => f.endsWith('.bin')).slice(-20);
        }
        catch {
            return [];
        }
    }
};
exports.PrinterService = PrinterService;
exports.PrinterService = PrinterService = PrinterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrinterService);
//# sourceMappingURL=printer.service.js.map