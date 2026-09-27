import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { ThermalBill } from '../../components/print/ThermalBill';
import { UpiQrModal } from '../../components/pos/UpiQrModal';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft,
  Banknote,
  Smartphone,
  CheckCircle2,
  Printer,
  Home,
  Check,
  QrCode
} from 'lucide-react';
import { PAYMENT_METHOD, TABLE_STATUS, ORDER_STATUS } from '../../utils/constants';
import {
  calculateSubtotal,
  calculateComprehensiveDiscounts,
  calculateGrandTotal,
  calculateChange,
  formatCurrency
} from '../../utils/calculations';

export const Payment = () => {
  const { id: tableId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [table, setTable] = useState(null);
  const [order, setOrder] = useState(null);
  const [method, setMethod] = useState(searchParams.get('method') || PAYMENT_METHOD.CASH);
  
  // Cash calculation
  const [cashReceived, setCashReceived] = useState('');
  const [cashError, setCashError] = useState('');

  // Completed payment state
  const [completedBill, setCompletedBill] = useState(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const [allDiscounts, setAllDiscounts] = useState([]);

  useEffect(() => {
    loadPaymentData();
  }, [tableId]);

  const loadPaymentData = async () => {
    try {
      const t = await apiService.getTableById(tableId);
      if (!t) {
        showToast('Table not found.', 'error');
        navigate('/waiter/tables');
        return;
      }
      setTable(t);

      const discounts = await apiService.getDiscounts();
      setAllDiscounts(discounts);

      const activeOrder = await apiService.getOrderByTable(tableId);
      if (!activeOrder) {
        // If payment already completed, check if bill exists
        const bills = await apiService.getBills();
        const lastBill = bills.find((b) => b.tableId === Number(tableId));
        if (lastBill) {
          setCompletedBill(lastBill);
        } else {
          navigate('/waiter/tables');
        }
        return;
      }
      setOrder(activeOrder);

      // Default cash received suggestion based on comprehensive discounts
      const sub = calculateSubtotal(activeOrder.items);
      const { totalDiscount: disc } = calculateComprehensiveDiscounts(activeOrder.items, discounts);
      const tot = calculateGrandTotal(sub, disc);
      const roundedUp = Math.ceil(tot / 50) * 50;
      setCashReceived(String(roundedUp > tot ? roundedUp : tot + 50));
    } catch (err) {
      showToast(err.message || 'Failed to load payment data.', 'error');
    }
  };

  if (!table) return null;

  const subtotal = order ? calculateSubtotal(order.items) : 0;
  const { totalDiscount: discountAmount } = order
    ? calculateComprehensiveDiscounts(order.items, allDiscounts)
    : { totalDiscount: 0 };
  const grandTotal = order ? calculateGrandTotal(subtotal, discountAmount) : 0;

  const cashNum = Number(cashReceived) || 0;
  const changeAmount = calculateChange(cashNum, grandTotal);

  // Cash Payment Flow (Section 46)
  const handleCompleteCashPayment = async (e) => {
    e.preventDefault();
    setCashError('');

    if (cashNum < 0) {
      setCashError('Cash received cannot be negative.');
      return;
    }
    if (cashNum < grandTotal) {
      setCashError(`Cash received cannot be less than total (${formatCurrency(grandTotal)}).`);
      return;
    }

    try {
      const res = await apiService.createPayment({
        orderId: order.orderNumber || order.id,
        paymentMethod: PAYMENT_METHOD.CASH,
        amount: grandTotal,
        cashReceived: cashNum,
        changeReturned: changeAmount
      });

      setCompletedBill(res.bill);
      showToast('Payment completed successfully.', 'success');
    } catch (err) {
      showToast(err.message || 'Payment settlement failed.', 'error');
    }
  };

  // Online Payment Flow (Section 47, 48)
  const handleOpenOnlineQr = async () => {
    try {
      // Set table status: PAYMENT_PENDING
      await apiService.updateTableStatus(table.id, TABLE_STATUS.PAYMENT_PENDING);
      setQrModalOpen(true);
    } catch (err) {
      setQrModalOpen(true);
    }
  };

  const handleOnlinePaymentSuccess = async ({ upiRef }) => {
    try {
      const res = await apiService.createPayment({
        orderId: order.orderNumber || order.id,
        paymentMethod: 'UPI',
        amount: grandTotal,
        upiRef: upiRef
      });
      setCompletedBill(res.bill);
      showToast('Payment completed successfully via UPI.', 'success');
    } catch (err) {
      showToast(err.message || 'Payment settlement failed.', 'error');
    }
  };

  const handleFinishAndReturn = () => {
    navigate('/waiter/tables');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <PageHeader
        title="Payment Settlement"
        subtitle={`Table ${table.tableNumber} &bull; Bill settlement`}
        actions={
          !completedBill && (
            <Button
              variant="outline"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate(`/waiter/bill/${table.id}`)}
            >
              Back to Bill
            </Button>
          )
        }
      />

      {!completedBill ? (
        <Card style={{ padding: 'clamp(14px, 4vw, 28px)', width: '100%', boxSizing: 'border-box' }}>
          {/* Total display */}
          <div
            style={{
              textAlign: 'center',
              backgroundColor: 'var(--surface-alt)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px 16px',
              marginBottom: 24,
              border: '1px solid var(--border)'
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Payable Amount
            </span>
            <div style={{ fontSize: 'clamp(1.8rem, 6vw, 2.5rem)', fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>
              {formatCurrency(grandTotal)}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Subtotal: {formatCurrency(subtotal)} | Discount: -{formatCurrency(discountAmount)}
            </div>
          </div>

          {/* Payment Method Switcher */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            <Button
              variant={method === PAYMENT_METHOD.CASH ? 'primary' : 'outline'}
              icon={Banknote}
              style={{ flex: '1 1 140px' }}
              onClick={() => setMethod(PAYMENT_METHOD.CASH)}
            >
              Cash Payment
            </Button>
            <Button
              variant={method === PAYMENT_METHOD.ONLINE ? 'primary' : 'outline'}
              icon={Smartphone}
              style={{ flex: '1 1 140px' }}
              onClick={() => setMethod(PAYMENT_METHOD.ONLINE)}
            >
              Online QR Payment
            </Button>
          </div>

          {/* Mode 1: Cash Payment (Section 46) */}
          {method === PAYMENT_METHOD.CASH ? (
            <form onSubmit={handleCompleteCashPayment}>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label" htmlFor="cashReceived">
                  Cash Received from Customer (₹)
                </label>
                <input
                  id="cashReceived"
                  type="number"
                  step="1"
                  min="0"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="Enter cash received"
                  className="form-input"
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    height: '48px',
                    borderColor: cashError ? 'var(--danger)' : undefined
                  }}
                  autoFocus
                />
                {cashError && <div className="form-error">{cashError}</div>}
              </div>

              {/* Quick Cash Buttons */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {[grandTotal, Math.ceil(grandTotal / 50) * 50, Math.ceil(grandTotal / 100) * 100, Math.ceil(grandTotal / 500) * 500]
                  .filter((v, idx, arr) => arr.indexOf(v) === idx && v >= grandTotal)
                  .map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setCashReceived(String(amount));
                        setCashError('');
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.825rem',
                        fontWeight: 600,
                        backgroundColor: 'var(--surface-alt)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)'
                      }}
                    >
                      ₹{amount}
                    </button>
                  ))}
              </div>

              {/* Auto-Calculated Change */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  backgroundColor: 'var(--success-bg)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--success-border)',
                  marginBottom: 24
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                  Change to Return:
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)' }}>
                  {formatCurrency(changeAmount)}
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                icon={Check}
                style={{ width: '100%' }}
              >
                Complete Payment
              </Button>
            </form>
          ) : (
            /* Mode 2: Online Payment (Section 47, 48) */
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div
                style={{
                  backgroundColor: '#faf5ff',
                  border: '1.5px dashed #c084fc',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  marginBottom: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: '#5f259f',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.9rem'
                    }}
                  >
                    पे
                  </div>
                  <span style={{ fontWeight: 800, color: '#5f259f', fontSize: '1.05rem' }}>PhonePe UPI</span>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#e9d5ff', color: '#581c87', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                    Dynamic QR
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                  Merchant: <strong>ATHARV UTTAM CHAVAN</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  UPI ID: <code>8788671566@ybl</code>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#581c87', fontWeight: 600, marginTop: 4 }}>
                  Bill amount of <strong>{formatCurrency(grandTotal)}</strong> is automatically locked into the QR Code.
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                icon={QrCode}
                style={{ width: '100%', backgroundColor: '#5f259f', borderColor: '#5f259f' }}
                onClick={handleOpenOnlineQr}
              >
                Display PhonePe Dynamic QR Code
              </Button>
            </div>
          )}
        </Card>
      ) : (
        /* Post-Payment Success View */
        <Card style={{ padding: '36px 28px', textAlign: 'center' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <CheckCircle2 size={44} />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)' }}>
            Payment Successful!
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginTop: 4, marginBottom: 24 }}>
            Bill <strong>{completedBill.billNumber}</strong> has been marked as PAID. Table {table.tableNumber} is now reset to AVAILABLE.
          </p>

          <div
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              gap: 6,
              padding: '12px 24px',
              backgroundColor: 'var(--surface-alt)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 28,
              textAlign: 'left',
              fontSize: '0.9rem'
            }}
          >
            <div>Amount Paid: <strong>{formatCurrency(completedBill.finalTotal)}</strong></div>
            <div>Method: <strong>{completedBill.paymentMethod}</strong></div>
            {completedBill.changeReturned > 0 && (
              <div>Change Returned: <strong>{formatCurrency(completedBill.changeReturned)}</strong></div>
            )}
            {completedBill.upiRef && (
              <div>UPI Reference: <strong>{completedBill.upiRef}</strong></div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
            <Button
              variant="outline"
              icon={Home}
              onClick={handleFinishAndReturn}
            >
              Back to Tables
            </Button>
            <Button
              variant="primary"
              icon={Printer}
              onClick={() => setPrintModalOpen(true)}
            >
              Print Bill
            </Button>
          </div>
        </Card>
      )}

      {/* Online UPI Modal */}
      <UpiQrModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        totalAmount={grandTotal}
        billReference={order?.orderNumber}
        customerName={order?.customerName}
        onPaymentSuccess={handleOnlinePaymentSuccess}
        onPrintBill={() => setPrintModalOpen(true)}
      />

      {/* Printable Thermal Receipt Modal */}
      <Modal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        title="Thermal Bill Print Preview"
        maxWidth="460px"
      >
        <div className="modal-body">
          {completedBill && (
            <ThermalBill
              bill={completedBill}
              onBack={() => setPrintModalOpen(false)}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};
