#!/usr/bin/env python3

"""
emulate_barcode_scanner.py

This script uses the `evdev` library to emulate a raw USB HID keyboard at the OS level.
It will type out the given string of digits and terminate with the Enter key,
with very small delays between keystrokes to mimic a physical barcode scanner.
"""

import sys
import time
import argparse

try:
    from evdev import uinput, ecodes as e
except ImportError:
    print("Please install evdev first: pip install evdev")
    sys.exit(1)

# Mapping characters to evdev keycodes
# We mainly need digits for barcodes
KEY_MAP = {
    '0': e.KEY_0,
    '1': e.KEY_1,
    '2': e.KEY_2,
    '3': e.KEY_3,
    '4': e.KEY_4,
    '5': e.KEY_5,
    '6': e.KEY_6,
    '7': e.KEY_7,
    '8': e.KEY_8,
    '9': e.KEY_9,
}

def scan_barcode(barcode: str, delay_ms: int = 15):
    print(f"Emulating barcode scanner for '{barcode}'...")
    
    # Create virtual USB HID device
    # This requires running with sufficient privileges (e.g. root or proper udev rules for /dev/uinput)
    try:
        with uinput.UInput(name="Virtual Barcode Scanner") as ui:
            # Give the OS a moment to register the new device
            time.sleep(0.5)

            for char in barcode:
                if char not in KEY_MAP:
                    print(f"Unsupported character '{char}', skipping.")
                    continue
                
                keycode = KEY_MAP[char]
                
                # Press key
                ui.write(e.EV_KEY, keycode, 1)
                ui.syn()
                
                # Tiny delay (mimic hardware speed)
                time.sleep(delay_ms / 1000.0)
                
                # Release key
                ui.write(e.EV_KEY, keycode, 0)
                ui.syn()
                
                # Delay between keystrokes
                time.sleep(delay_ms / 1000.0)

            # Terminate with Enter
            ui.write(e.EV_KEY, e.KEY_ENTER, 1)
            ui.syn()
            time.sleep(0.01)
            ui.write(e.EV_KEY, e.KEY_ENTER, 0)
            ui.syn()
            
            print("Scan complete.")
            time.sleep(0.1)
    except PermissionError:
        print("Permission denied: You need root privileges or write access to /dev/uinput.")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Emulate a USB HID barcode scanner.")
    parser.add_argument("barcode", type=str, help="The barcode string to scan")
    parser.add_argument("--delay", type=int, default=15, help="Delay between keystrokes in ms (default: 15)")
    args = parser.parse_args()

    scan_barcode(args.barcode, args.delay)
