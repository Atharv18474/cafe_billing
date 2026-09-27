/**
 * printerService.js
 *
 * Singleton printer service that manages:
 *   - Printer state (disconnected / scanning / connecting / connected / printing / error)
 *   - Transport lifecycle (scan, connect, disconnect)
 *   - ESC/POS receipt delivery
 *
 * The service exposes callbacks so React context can subscribe to state changes.
 * No React is imported here — this file is pure JS.
 */

import { createPrinterTransport } from './printerTransport.js';
import { buildReceipt, buildTestReceipt } from './escPosFormatter.js';

// ─── Storage keys ──────────────────────────────────────────────────────────────
const LS_PRINTER_NAME = 'cafe_printer_name';
const LS_PRINTER_ID   = 'cafe_printer_id';

// ─── Initial state ─────────────────────────────────────────────────────────────
const DEFAULT_STATE = {
  status: 'disconnected',  // 'disconnected'|'scanning'|'connecting'|'connected'|'printing'|'error'
  printerName: '',
  printerId: '',
  discoveredPrinters: [],  // [{id, name, device?, isMock?}]
  error: '',
  isMockTransport: false,
};

class PrinterService {
  constructor() {
    this._state = { ...DEFAULT_STATE };
    this._transport = null;
    this._listeners = new Set();

    // Restore remembered printer name (NOT auto-connect — status stays disconnected)
    try {
      const savedName = localStorage.getItem(LS_PRINTER_NAME);
      const savedId   = localStorage.getItem(LS_PRINTER_ID);
      if (savedName) {
        this._state.printerName = savedName;
        this._state.printerId   = savedId || '';
      }
    } catch {
      // localStorage might be blocked — ignore
    }
  }

  // ─── State Management ────────────────────────────────────────────────────────
  get state() {
    return { ...this._state };
  }

  _setState(patch) {
    this._state = { ...this._state, ...patch };
    this._notify();
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notify() {
    this._listeners.forEach((fn) => {
      try { fn(this.state); } catch (e) { console.error('[PrinterService] Listener error:', e); }
    });
  }

  // ─── Transport Initialization ─────────────────────────────────────────────────
  _ensureTransport() {
    if (!this._transport) {
      this._transport = createPrinterTransport();
      this._transport.onDisconnect = (reason) => {
        console.warn('[PrinterService] Printer disconnected:', reason);
        this._setState({
          status: 'disconnected',
          error: reason || 'Printer disconnected unexpectedly.',
          discoveredPrinters: [],
        });
      };
    }
    return this._transport;
  }

  // ─── Scan ────────────────────────────────────────────────────────────────────
  /**
   * Starts scanning for nearby Bluetooth printers.
   * On Web Bluetooth, this opens the browser's native device picker.
   * The user selects a device; the returned list contains that device.
   */
  async scan() {
    this._setState({ status: 'scanning', error: '', discoveredPrinters: [] });
    try {
      const transport = this._ensureTransport();
      const printers = await transport.scan();
      const isMock = !!transport.isMock;
      this._setState({
        status: 'disconnected',
        discoveredPrinters: printers,
        isMockTransport: isMock,
        error: '',
      });
    } catch (err) {
      console.error('[PrinterService] Scan error:', err);
      let msg = 'Bluetooth scan failed.';
      if (err.name === 'NotFoundError' || err.message?.includes('cancelled')) {
        msg = 'No printer selected. Please scan again and select a printer.';
      } else if (err.name === 'NotAllowedError') {
        msg = 'Bluetooth permission denied. Please allow Bluetooth access and try again.';
      } else if (err.name === 'NotSupportedError') {
        msg = 'Bluetooth is not supported on this device/browser.';
      } else if (err.message) {
        msg = err.message;
      }
      this._setState({ status: 'error', error: msg, discoveredPrinters: [] });
    }
  }

  // ─── Connect ─────────────────────────────────────────────────────────────────
  async connect(deviceEntry) {
    this._setState({ status: 'connecting', error: '' });
    try {
      const transport = this._ensureTransport();
      const ok = await transport.connect(deviceEntry);
      if (!ok) throw new Error('Connection returned false.');

      // Persist printer info for current session
      const name = deviceEntry.name || 'BT Printer';
      const id   = deviceEntry.id   || '';
      try {
        localStorage.setItem(LS_PRINTER_NAME, name);
        localStorage.setItem(LS_PRINTER_ID,   id);
      } catch { /* ignore */ }

      this._setState({
        status: 'connected',
        printerName: name,
        printerId: id,
        error: '',
      });
    } catch (err) {
      console.error('[PrinterService] Connect error:', err);
      let msg = 'Unable to connect to the printer. Make sure it is powered on and not connected to another device.';
      if (err.name === 'NetworkError' || err.message?.includes('GATT')) {
        msg = 'Bluetooth connection failed (GATT error). The printer may be out of range or already in use.';
      } else if (err.name === 'NotFoundError') {
        msg = 'Printer not found. Please scan again.';
      } else if (err.message) {
        msg = err.message;
      }
      this._setState({ status: 'error', error: msg });
    }
  }

  // ─── Disconnect ──────────────────────────────────────────────────────────────
  async disconnect() {
    try {
      if (this._transport) await this._transport.disconnect();
    } catch (e) {
      console.warn('[PrinterService] Disconnect warning:', e);
    }
    this._setState({
      status: 'disconnected',
      error: '',
      discoveredPrinters: [],
    });
  }

  // ─── Test Print ──────────────────────────────────────────────────────────────
  async testPrint() {
    if (this._state.status !== 'connected') {
      this._setState({ error: 'Please connect a printer before test printing.' });
      return { success: false, message: 'Not connected.' };
    }
    this._setState({ status: 'printing', error: '' });
    try {
      const bytes = buildTestReceipt(this._state.printerName);
      await this._transport.write(bytes);
      this._setState({ status: 'connected', error: '' });
      return { success: true, message: 'Test print sent successfully.' };
    } catch (err) {
      console.error('[PrinterService] Test print error:', err);
      const msg = err.message || 'Test print failed.';
      this._setState({ status: 'error', error: msg });
      // Try to recover status to connected if printer still available
      setTimeout(() => {
        if (this._transport?.isConnected) {
          this._setState({ status: 'connected' });
        }
      }, 2000);
      return { success: false, message: msg };
    }
  }

  // ─── Print Bill ──────────────────────────────────────────────────────────────
  /**
   * Formats and prints an existing bill object.
   * Does NOT recalculate anything — uses exact bill data passed in.
   *
   * @param {Object} bill  — completed bill from mockService.createBill()
   * @returns {{ success: boolean, message: string }}
   */
  async printBill(bill) {
    if (this._state.status !== 'connected') {
      return {
        success: false,
        message: 'Please connect a thermal printer first.',
      };
    }
    if (!bill) {
      return { success: false, message: 'No bill data available to print.' };
    }

    this._setState({ status: 'printing', error: '' });
    try {
      const bytes = buildReceipt(bill);
      await this._transport.write(bytes);
      this._setState({ status: 'connected', error: '' });
      return { success: true, message: 'Bill printed successfully.' };
    } catch (err) {
      console.error('[PrinterService] Print bill error:', err);
      const msg = err.message || 'Printing failed. Please try again.';
      this._setState({ status: 'error', error: msg });
      setTimeout(() => {
        if (this._transport?.isConnected) {
          this._setState({ status: 'connected' });
        }
      }, 2000);
      return { success: false, message: msg };
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  get isConnected() {
    return this._state.status === 'connected';
  }

  get isPrinting() {
    return this._state.status === 'printing';
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────
export const printerService = new PrinterService();
