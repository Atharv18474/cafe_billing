/**
 * printerTransport.js
 *
 * Transport abstraction layer that separates the UI from the actual
 * Bluetooth communication mechanism.
 *
 * Two transports are available:
 *   1. WebBluetoothTransport  — uses the Web Bluetooth API (Chrome/Android WebView).
 *                               Only works on HTTPS or localhost.
 *   2. MockPrinterTransport   — simulates scanning, connecting and printing for
 *                               development. NEVER shows "Connected" unless the
 *                               mock flow completes. Clearly labelled in UI.
 *
 * Niyama BT-58 info:
 *   - Standard ESC/POS Bluetooth SPP printer
 *   - 58mm paper, ~48 chars per line
 *   - Services: 0x18F0 (common generic BT printer), or printer-specific UUIDs
 *   - Characteristic: 0x2AF1 (write)
 *
 * For production Android usage without Web Bluetooth:
 *   Replace this file's WebBluetoothTransport implementation with a call to
 *   your Android JS bridge (Capacitor plugin, React Native bridge, etc.)
 *   The rest of the stack (printerService, escPosFormatter, UI) stays unchanged.
 */

// ─── ESC/POS known UUIDs for generic BT thermal printers ─────────────────────
const BT_PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Generic BT printer service
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Some ESC/POS printers
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART (some rebranded printers)
];
const BT_PRINTER_WRITE_CHAR_UUIDS = [
  '00002af1-0000-1000-8000-00805f9b34fb', // Generic write char
  '49535343-8841-43f4-a8d4-ecbe34729bb3', // Alternate
  '6e400002-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART TX
];

// ─── Web Bluetooth Transport ──────────────────────────────────────────────────
export class WebBluetoothTransport {
  constructor() {
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.onDisconnect = null; // callback(reason)
  }

  get isSupported() {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Scan & present the browser's native Bluetooth device picker.
   * Returns an array of "discovered" devices (browser shows its own picker,
   * so we only get back the one the user selected).
   */
  async scan() {
    if (!this.isSupported) {
      throw new Error('Web Bluetooth is not supported on this browser. Use Chrome on Android or desktop.');
    }
    // requestDevice shows the OS/browser Bluetooth picker
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,          // show all nearby BT devices
      optionalServices: BT_PRINTER_SERVICE_UUIDS,
    });
    // Return as array so the UI can list it
    return [
      {
        id: device.id,
        name: device.name || 'Unknown Printer',
        device, // keep reference for connect()
      },
    ];
  }

  /**
   * Connect to a specific device entry returned from scan().
   */
  async connect(deviceEntry) {
    const btDevice = deviceEntry.device;
    if (!btDevice) throw new Error('Invalid device reference.');

    this.device = btDevice;

    // Listen for disconnection events from the OS
    this.device.addEventListener('gattserverdisconnected', () => {
      this.server = null;
      this.characteristic = null;
      if (this.onDisconnect) this.onDisconnect('Printer disconnected.');
    });

    this.server = await btDevice.gatt.connect();

    // Try each known service UUID until one works
    let service = null;
    for (const uuid of BT_PRINTER_SERVICE_UUIDS) {
      try {
        service = await this.server.getPrimaryService(uuid);
        break;
      } catch {
        // try next
      }
    }
    if (!service) {
      throw new Error(
        'Could not find a compatible ESC/POS service on this printer. ' +
        'Make sure the Niyama BT-58 is powered on and not connected to another device.'
      );
    }

    // Try each known characteristic UUID
    let char = null;
    for (const uuid of BT_PRINTER_WRITE_CHAR_UUIDS) {
      try {
        char = await service.getCharacteristic(uuid);
        break;
      } catch {
        // try next
      }
    }
    if (!char) {
      throw new Error('Found printer service but could not access write characteristic.');
    }

    this.characteristic = char;
    return true; // real connection confirmed
  }

  /**
   * Write raw ESC/POS bytes to the printer.
   * Splits into chunks ≤512 bytes (BLE MTU safe).
   */
  async write(uint8Array) {
    if (!this.characteristic) {
      throw new Error('Printer is not connected.');
    }
    const CHUNK = 512;
    for (let i = 0; i < uint8Array.length; i += CHUNK) {
      const chunk = uint8Array.slice(i, i + CHUNK);
      await this.characteristic.writeValueWithoutResponse(chunk);
    }
  }

  async disconnect() {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.server = null;
    this.characteristic = null;
    this.device = null;
  }

  get isConnected() {
    return !!(this.device && this.device.gatt && this.device.gatt.connected && this.characteristic);
  }
}

// ─── Mock Transport (Development / Unsupported Environment) ──────────────────
export class MockPrinterTransport {
  constructor() {
    this.device = null;
    this.onDisconnect = null;
    this._connected = false;
    this.MOCK_LABEL = '⚠ MOCK / DEV MODE'; // shown in UI
  }

  get isSupported() {
    return true; // always "supported" — it's a mock
  }

  get isMock() {
    return true;
  }

  async scan() {
    // Simulate a scan delay; return a single virtual printer
    await new Promise((r) => setTimeout(r, 1500));
    return [
      {
        id: 'mock-niyama-bt58',
        name: 'Niyama BT-58 (Dev Mock)',
        isMock: true,
      },
    ];
  }

  async connect(deviceEntry) {
    await new Promise((r) => setTimeout(r, 1200));
    this.device = deviceEntry;
    this._connected = true;
    return true;
  }

  async write(uint8Array) {
    if (!this._connected) throw new Error('Mock printer not connected.');
    // Simulate print time based on data size
    await new Promise((r) => setTimeout(r, 600));
    // Log readable bytes for debugging
    const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
    console.log('[MockPrinter] Received ESC/POS data (' + uint8Array.length + ' bytes):\n', text);
  }

  async disconnect() {
    this._connected = false;
    this.device = null;
    if (this.onDisconnect) this.onDisconnect('Disconnected.');
  }

  get isConnected() {
    return this._connected;
  }
}

// ─── Transport Factory ────────────────────────────────────────────────────────
/**
 * Returns the best available transport for the current environment.
 * Web Bluetooth is preferred; falls back to Mock if unavailable.
 */
export function createPrinterTransport() {
  const webBT = new WebBluetoothTransport();
  if (webBT.isSupported) {
    return webBT;
  }
  console.warn(
    '[PrinterTransport] Web Bluetooth not available. Using mock transport. ' +
    'For real Niyama BT-58 printing, open this app in Chrome on Android.'
  );
  return new MockPrinterTransport();
}
