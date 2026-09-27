/**
 * escPosFormatter.js
 *
 * Generates ESC/POS command byte arrays for the Niyama BT-58 (58mm thermal printer).
 *
 * The 58mm printer has ~32 printable characters per line at normal size.
 * All formatting is done in plain ESC/POS bytes — NO HTML/CSS is sent to the printer.
 *
 * Reference: ESC/POS Command Manual (Epson / compatible)
 */

// ─── ESC/POS byte constants ───────────────────────────────────────────────────
const ESC = 0x1b;
const GS  = 0x1d;
const LF  = 0x0a; // Line feed
const CR  = 0x0d;

// ─── Printable width for 58mm paper ──────────────────────────────────────────
const COLS_NORMAL = 32;  // chars per line at font A normal

// ─── Text encoder ────────────────────────────────────────────────────────────
const encoder = new TextEncoder(); // UTF-8

// ─── Builder class ────────────────────────────────────────────────────────────
class EscPosBuilder {
  constructor() {
    this._bytes = [];
  }

  /** Append raw bytes */
  _push(...bytes) {
    this._bytes.push(...bytes);
    return this;
  }

  /** Append a string as bytes */
  _text(str) {
    const arr = encoder.encode(String(str));
    this._bytes.push(...arr);
    return this;
  }

  /** Initialize / reset printer */
  init() {
    return this._push(ESC, 0x40); // ESC @
  }

  /** Line feed */
  feed(n = 1) {
    for (let i = 0; i < n; i++) this._push(LF);
    return this;
  }

  /** Set alignment: 'left' | 'center' | 'right' */
  align(a) {
    const code = a === 'center' ? 1 : a === 'right' ? 2 : 0;
    return this._push(ESC, 0x61, code); // ESC a n
  }

  /** Bold on/off */
  bold(on) {
    return this._push(ESC, 0x45, on ? 1 : 0); // ESC E n
  }

  /** Double-width + double-height text size */
  doubleSize(on) {
    return this._push(GS, 0x21, on ? 0x11 : 0x00); // GS ! n
  }

  /** Add plain text (with line feed) */
  line(text = '') {
    return this._text(text)._push(LF);
  }

  /** Add a dashed separator line */
  separator(char = '-') {
    return this.line(char.repeat(COLS_NORMAL));
  }

  /**
   * Two-column row: left text + right text, padded to COLS_NORMAL total.
   * Wraps left text if too long, right is always right-aligned.
   */
  twoCol(left, right) {
    const l = String(left ?? '');
    const r = String(right ?? '');
    const gap = COLS_NORMAL - r.length;
    if (l.length <= gap) {
      // fits on one line
      const padded = l + ' '.repeat(Math.max(0, gap - l.length)) + r;
      return this.line(padded);
    }
    // left overflows — put left on its own line, right on next
    this.line(l);
    return this.line(' '.repeat(Math.max(0, COLS_NORMAL - r.length)) + r);
  }

  /**
   * Three-column row: item name | qty | amount
   * name is left-padded, qty is center, amount is right.
   * Wraps long names onto previous line.
   */
  itemRow(name, qty, amount) {
    const r = String(amount);       // e.g. "₹250.00"
    const q = String(qty).padStart(3);
    const spaceForName = COLS_NORMAL - q.length - r.length - 2;
    let n = String(name);

    if (n.length <= spaceForName) {
      const row = n.padEnd(spaceForName) + ' ' + q + ' ' + r;
      return this.line(row);
    }

    // Name too long — first line is name, second line is qty+amount
    while (n.length > COLS_NORMAL) {
      this.line(n.slice(0, COLS_NORMAL));
      n = n.slice(COLS_NORMAL);
    }
    this.line(n); // remainder of name
    const row2 = ' '.repeat(spaceForName) + ' ' + q + ' ' + r;
    return this.line(row2);
  }

  /** Cut paper (full cut). Some printers may ignore this. */
  cut() {
    return this._push(GS, 0x56, 0x00); // GS V 0 = full cut
  }

  /** Return final Uint8Array */
  build() {
    return new Uint8Array(this._bytes);
  }
}

// ─── Currency helper ─────────────────────────────────────────────────────────
const rs = (n) => 'Rs.' + Number(n || 0).toFixed(2);

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Build a 58mm ESC/POS receipt from existing bill data.
 *
 * @param {Object} bill  — The completed bill object from mockService.createBill()
 * @returns {Uint8Array} — Raw ESC/POS bytes ready to send to the printer
 */
export function buildReceipt(bill) {
  const b = new EscPosBuilder();

  b.init();

  // ── Header ──────────────────────────────────────────────────────────────────
  b.align('center')
   .bold(true)
   .doubleSize(true)
   .line('CAFE COZY')
   .doubleSize(false)
   .bold(false)
   .line('Connaught Place, New Delhi')
   .line('Tel: +91 98765 43210')
   .separator();

  // ── Bill Info ────────────────────────────────────────────────────────────────
  b.align('left');
  b.twoCol('Bill No: ' + (bill.billNumber || ''), 'Table: ' + (bill.tableNumber || ''));
  b.twoCol('Customer: ' + (bill.customerName || 'Walk-in'), 'Waiter: ' + (bill.waiterName || 'Staff'));
  b.twoCol('Date: ' + (bill.date || ''), 'Time: ' + (bill.time || ''));
  b.separator();

  // ── Column headers ───────────────────────────────────────────────────────────
  b.bold(true);
  const hdr = 'ITEM'.padEnd(COLS_NORMAL - 3 - 9) + ' QTY ' + 'AMOUNT'.padStart(8);
  b.line(hdr.slice(0, COLS_NORMAL));
  b.bold(false);
  b.separator('-');

  // ── Items ────────────────────────────────────────────────────────────────────
  const items = Array.isArray(bill.items) ? bill.items : [];
  items.forEach((item) => {
    if (!item.quantity || item.quantity <= 0) return;
    b.itemRow(item.productName, `x${item.quantity}`, rs(item.unitPrice * item.quantity));
  });

  b.separator();

  // ── Summary ──────────────────────────────────────────────────────────────────
  b.twoCol('Subtotal:', rs(bill.subtotal));

  // Applied discounts — either array or single
  if (Array.isArray(bill.appliedDiscounts) && bill.appliedDiscounts.length > 0) {
    bill.appliedDiscounts.forEach((ad) => {
      b.twoCol(ad.name + ':', '-' + rs(ad.amount));
    });
  } else if (bill.discountAmount > 0) {
    b.twoCol((bill.discountName || 'Discount') + ':', '-' + rs(bill.discountAmount));
  }

  b.separator();

  // ── Total ────────────────────────────────────────────────────────────────────
  b.bold(true).doubleSize(true);
  b.twoCol('TOTAL:', rs(bill.finalTotal));
  b.doubleSize(false).bold(false);
  b.separator();

  // ── Payment ──────────────────────────────────────────────────────────────────
  b.line('Payment: ' + (bill.paymentMethod || ''));
  if (bill.paymentMethod === 'CASH' && bill.cashReceived) {
    b.twoCol('Cash Received:', rs(bill.cashReceived));
    b.twoCol('Change Returned:', rs(bill.changeReturned || 0));
  }
  if (bill.paymentMethod === 'ONLINE' && bill.upiRef) {
    b.line('UPI Ref: ' + bill.upiRef);
  }

  b.separator();

  // ── Footer ───────────────────────────────────────────────────────────────────
  b.align('center')
   .bold(true)
   .line('** THANK YOU! **')
   .line('** VISIT AGAIN **')
   .bold(false)
   .feed(4);

  b.cut();

  return b.build();
}

/**
 * Build a short test receipt (no bill data needed).
 *
 * @param {string} printerName
 * @returns {Uint8Array}
 */
export function buildTestReceipt(printerName) {
  const b = new EscPosBuilder();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN');
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  b.init()
   .align('center')
   .bold(true)
   .doubleSize(true)
   .line('TEST PRINT')
   .doubleSize(false)
   .bold(false)
   .line('CAFE COZY')
   .separator()
   .align('left')
   .line('Printer: ' + (printerName || 'BT Printer'))
   .line('Date:    ' + dateStr)
   .line('Time:    ' + timeStr)
   .separator()
   .align('center')
   .bold(true)
   .line('Bluetooth: OK')
   .line('Connection: OK')
   .bold(false)
   .separator()
   .line('Test Print Successful!')
   .feed(4)
   .cut();

  return b.build();
}
