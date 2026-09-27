import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Printer, ArrowLeft, Download, Bluetooth, Loader2 } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/calculations';
import { usePrinter } from '../../context/PrinterContext';
import { useToast } from '../../context/ToastContext';

export const ThermalBill = ({ bill, onBack }) => {
  const [paperWidth, setPaperWidth] = useState('80mm'); // '80mm' or '58mm'
  const { status, printBill, printerName } = usePrinter();
  const { showToast } = useToast();
  const [isPrintingBt, setIsPrintingBt] = useState(false);

  if (!bill) {
    return <div>No bill information available.</div>;
  }

  const isConnected = status === 'connected';

  // Bluetooth Thermal Print (58mm Niyama BT-58 target)
  const handleBtPrint = async () => {
    if (!isConnected) {
      showToast('Please connect a thermal printer first.', 'warning');
      return;
    }
    setIsPrintingBt(true);
    const res = await printBill(bill);
    setIsPrintingBt(false);
    if (res.success) {
      showToast('Bill printed successfully.', 'success');
    } else {
      showToast(res.message || 'Printing failed.', 'error');
    }
  };

  // Browser standard print
  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* Controls - Hidden on print */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 20,
          background: 'var(--surface)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)'
        }}
      >
        {onBack ? (
          <Button variant="outline" size="sm" icon={ArrowLeft} onClick={onBack}>
            Back
          </Button>
        ) : <div />}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Paper Size:</span>
          <button
            type="button"
            onClick={() => setPaperWidth('58mm')}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: paperWidth === '58mm' ? 'var(--primary)' : 'var(--surface-alt)',
              color: paperWidth === '58mm' ? '#fff' : 'var(--text)'
            }}
          >
            58mm
          </button>
          <button
            type="button"
            onClick={() => setPaperWidth('80mm')}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: paperWidth === '80mm' ? 'var(--primary)' : 'var(--surface-alt)',
              color: paperWidth === '80mm' ? '#fff' : 'var(--text)'
            }}
          >
            80mm
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button
            variant="primary"
            size="sm"
            icon={isPrintingBt ? Loader2 : Printer}
            onClick={isConnected ? handleBtPrint : handleBrowserPrint}
            disabled={isPrintingBt}
          >
            {isPrintingBt
              ? 'Printing...'
              : isConnected
              ? `Print Bill (${printerName ? printerName.replace(/^Niyama\s+/i, '').slice(0, 8) : 'BT'})`
              : 'Print Bill'}
          </Button>
          {isConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBrowserPrint}
              title="Print using system dialog"
            >
              System Dialog
            </Button>
          )}
        </div>
      </div>

      {/* Printable Receipt Container */}
      <div
        className={`thermal-bill-container printable-receipt-area ${paperWidth === '58mm' ? 'width-58mm' : ''}`}
        style={{
          backgroundColor: '#fff',
          color: '#111',
          fontFamily: 'monospace',
          padding: paperWidth === '58mm' ? '12px' : '20px',
          border: '1px dashed #bbb',
          margin: '0 auto',
          maxWidth: paperWidth === '58mm' ? '300px' : '360px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          lineHeight: '1.35'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '1px' }}>
            CAFE COZY
          </div>
          <div style={{ fontSize: '0.8rem', color: '#444' }}>
            Connaught Place, New Delhi
          </div>
          <div style={{ fontSize: '0.8rem', color: '#444' }}>
            Phone: +91 98765 43210
          </div>
        </div>

        <div style={{ borderTop: '1px dashed #333', margin: '8px 0' }} />

        <div style={{ fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Bill No: <strong>{bill.billNumber}</strong></span>
            <span>Table: <strong>{bill.tableNumber}</strong></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Customer: {bill.customerName || 'Walk-in'}</span>
            <span>Waiter: {bill.waiterName || 'Staff'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Date: {bill.date}</span>
            <span>Time: {bill.time}</span>
          </div>
        </div>

        <div style={{ borderTop: '1px dashed #333', margin: '8px 0' }} />

        <table style={{ width: '100%', fontSize: '0.85rem', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px dashed #333' }}>
              <th style={{ paddingBottom: 4 }}>ITEM</th>
              <th style={{ textAlign: 'center', paddingBottom: 4 }}>QTY</th>
              <th style={{ textAlign: 'right', paddingBottom: 4 }}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {(bill.items || []).map((item, idx) => (
              <tr key={idx}>
                <td style={{ paddingTop: 4, paddingBottom: 4, wordBreak: 'break-word' }}>
                  {item.productName}
                </td>
                <td style={{ textAlign: 'center', paddingTop: 4, paddingBottom: 4 }}>
                  {item.quantity}
                </td>
                <td style={{ textAlign: 'right', paddingTop: 4, paddingBottom: 4 }}>
                  ₹{(item.unitPrice * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderTop: '1px dashed #333', margin: '8px 0' }} />

        <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>₹{(bill.subtotal || 0).toFixed(2)}</span>
          </div>
          {bill.appliedDiscounts && bill.appliedDiscounts.length > 0 ? (
            bill.appliedDiscounts.map((ad, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#1b5e20' }}>
                <span>{ad.name}:</span>
                <span>- ₹{(ad.amount || 0).toFixed(2)}</span>
              </div>
            ))
          ) : bill.discountAmount > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1b5e20' }}>
              <span>{bill.discountName || 'Discount'}:</span>
              <span>- ₹{(bill.discountAmount || 0).toFixed(2)}</span>
            </div>
          ) : null}
        </div>

        <div style={{ borderTop: '1px dashed #333', margin: '8px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold' }}>
          <span>TOTAL:</span>
          <span>₹{(bill.finalTotal || 0).toFixed(2)}</span>
        </div>

        <div style={{ borderTop: '1px dashed #333', margin: '8px 0' }} />

        <div style={{ fontSize: '0.85rem' }}>
          <div>Payment Method: <strong>{bill.paymentMethod}</strong></div>
          {bill.paymentMethod === 'CASH' && bill.cashReceived && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Cash Received:</span>
                <span>₹{bill.cashReceived.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Change Returned:</span>
                <span>₹{(bill.changeReturned || 0).toFixed(2)}</span>
              </div>
            </>
          )}
          {bill.paymentMethod === 'ONLINE' && bill.upiRef && (
            <div style={{ fontSize: '0.8rem', color: '#444' }}>
              UPI Ref: {bill.upiRef}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 14, fontSize: '0.85rem', fontWeight: 'bold' }}>
          *** THANK YOU! VISIT AGAIN ***
        </div>
      </div>
    </div>
  );
};
