import { useEffect, useRef } from "react";

const SCAN_THRESHOLD_MS = 50; // Max ms between keystrokes to be considered a scan
const MIN_BARCODE_LENGTH = 5; // Minimum length of a barcode

export function useBarcodeScanner(onScan: (barcode: string) => void) {
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys
      if (e.key === "Shift" || e.key === "Control" || e.key === "Alt" || e.key === "Meta") {
        return;
      }

      const now = performance.now();
      const timeDiff = now - lastKeyTimeRef.current;

      // If it's been too long since the last keypress, reset the buffer
      if (timeDiff > SCAN_THRESHOLD_MS && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      lastKeyTimeRef.current = now;

      // When Enter is pressed, check if we have a valid accumulated barcode
      if (e.key === "Enter") {
        if (bufferRef.current.length >= MIN_BARCODE_LENGTH) {
          // It's a scan!
          const barcode = bufferRef.current;
          bufferRef.current = "";
          
          // Stop this event from doing anything else (like submitting a form)
          e.preventDefault();
          e.stopPropagation();
          
          // Trigger the callback
          onScan(barcode);
        } else {
          // Not a valid scan, just reset
          bufferRef.current = "";
        }
        return;
      }

      // If it's a printable character (length 1), add it to the buffer
      if (e.key.length === 1) {
        bufferRef.current += e.key;
        
        // If we have more than 1 character and it's rapid, it's likely a scan.
        // We can optionally preventDefault to stop characters filling up inputs,
        // but we can't prevent the first character since we didn't know it was a scan yet.
        // Doing e.preventDefault() here stops subsequent characters from appearing.
        if (bufferRef.current.length > 1) {
          // Stop rapid typing from bleeding into focused inputs as much as possible
          if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
            e.preventDefault();
          }
        }
      } else {
        // Some other special key was pressed, clear the buffer
        bufferRef.current = "";
      }
    };

    // Use capture phase to intercept before focused inputs receive it
    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [onScan]);
}
