import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft,
  Receipt,
  Banknote,
  Smartphone,
  ArrowRight,
  Percent,
  CheckCircle2,
  Coffee,
  Gift,
  Tag
} from 'lucide-react';
import { PAYMENT_METHOD, TABLE_STATUS, ORDER_STATUS, DISCOUNT_SCOPE } from '../../utils/constants';
import {
  calculateSubtotal,
  calculateComprehensiveDiscounts,
  calculateGrandTotal,
  formatCurrency,
  formatDateTime
} from '../../utils/calculations';

export const Billing = () => {
  const { id: tableId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [table, setTable] = useState(null);
  const [order, setOrder] = useState(null);
  const [allDiscounts, setAllDiscounts] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(PAYMENT_METHOD.CASH);

  useEffect(() => {
    loadBillingData();
  }, [tableId]);

  const loadBillingData = async () => {
    try {
      const t = await apiService.getTableById(tableId);
      if (!t) {
        showToast('Table not found.', 'error');
        navigate('/waiter/tables');
        return;
      }
      setTable(t);

      const activeOrder = await apiService.getOrderByTable(tableId);
      if (!activeOrder || !activeOrder.items || activeOrder.items.length === 0) {
        showToast('No active orders found for this table.', 'error');
        navigate(`/waiter/table/${tableId}`);
        return;
      }
      setOrder(activeOrder);

      // Get all promotions (order-level, combo, product-specific)
      const discounts = await apiService.getDiscounts();
      setAllDiscounts(discounts);
    } catch (err) {
      showToast(err.message || 'Failed to load billing data.', 'error');
    }
  };

  if (!table || !order) return null;

  const subtotal = calculateSubtotal(order.items);
  const { totalDiscount, appliedDiscounts } = calculateComprehensiveDiscounts(order.items, allDiscounts);
  const finalTotal = calculateGrandTotal(subtotal, totalDiscount);

  const handleContinuePayment = () => {
    // Navigate to payment screen with selected method in query param or route
    navigate(`/waiter/payment/${table.id}?method=${selectedPaymentMethod}`);
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <PageHeader
        title="Bill Confirmation"
        subtitle={`Review items and choose settlement method for Table ${table.tableNumber}`}
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate(`/waiter/table/${table.id}`)}
          >
            Back to Ordering
          </Button>
        }
      />

      <Card style={{ padding: 'clamp(14px, 4vw, 28px)', borderTop: '5px solid var(--primary)', width: '100%', boxSizing: 'border-box' }}>
        {/* Bill Header (Section 83) */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '1px' }}>
            CAFE COZY
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 2 }}>
            Table: {table.tableNumber} &bull; Customer: {order.customerName}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            Order No: {order.orderNumber} &bull; {formatDateTime(order.createdAt)}
          </p>
        </div>

        <div style={{ borderTop: '1px dashed var(--border)', margin: '16px 0' }} />

        {/* Bill Items Table (Section 44, 83) */}
        <div style={{ marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <th style={{ textAlign: 'left', paddingBottom: 8 }}>Item</th>
                <th style={{ textAlign: 'center', paddingBottom: 8 }}>Qty</th>
                <th style={{ textAlign: 'right', paddingBottom: 8 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--surface-alt)' }}>
                  <td style={{ padding: '10px 0' }}>
                    <div style={{ fontWeight: 600 }}>{item.productName}</div>
                    {item.addedByName && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                        Added by {item.addedByName}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', padding: '10px 0' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '10px 0', fontWeight: 600 }}>
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bill Summary (Section 44, 45, 83) */}
        <div
          style={{
            backgroundColor: 'var(--surface-alt)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(subtotal)}</span>
          </div>

          {appliedDiscounts.length > 0 ? (
            <div
              style={{
                backgroundColor: 'rgba(46, 125, 50, 0.08)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--success)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--success)', fontWeight: 700 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Percent size={15} /> Total Discounts / Combos Applied:
                </span>
                <span>- {formatCurrency(totalDiscount)}</span>
              </div>

              {appliedDiscounts.map((ad, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    fontSize: '0.85rem',
                    paddingLeft: 8,
                    borderLeft: '2px solid var(--success)',
                    marginTop: 2
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {ad.scope === DISCOUNT_SCOPE.COMBO ? <Gift size={13} color="#8e24aa" /> : ad.scope === DISCOUNT_SCOPE.PRODUCT ? <Tag size={13} color="#1976d2" /> : <Percent size={13} color="#2e7d32" />}
                      {ad.name}
                    </span>
                    {ad.details && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>
                        {ad.details}
                      </span>
                    )}
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                    - {formatCurrency(ad.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--muted)' }}>
              <span>Discount:</span>
              <span>₹0</span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.4rem',
              fontWeight: 800,
              color: 'var(--text)',
              borderTop: '2px solid var(--border)',
              paddingTop: 12,
              marginTop: 4
            }}
          >
            <span>TOTAL:</span>
            <span style={{ color: 'var(--primary)' }}>{formatCurrency(finalTotal)}</span>
          </div>
        </div>

        {/* Payment Selector (Section 44, 83) */}
        <div style={{ marginTop: 24 }}>
          <label className="form-label" style={{ marginBottom: 12, display: 'block', fontSize: '1rem', fontWeight: 700 }}>
            Select Payment Method:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
            <button
              type="button"
              onClick={() => setSelectedPaymentMethod(PAYMENT_METHOD.CASH)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: selectedPaymentMethod === PAYMENT_METHOD.CASH ? '2px solid var(--primary)' : '1px solid var(--border)',
                backgroundColor: selectedPaymentMethod === PAYMENT_METHOD.CASH ? 'var(--primary-light)' : 'var(--surface)',
                color: selectedPaymentMethod === PAYMENT_METHOD.CASH ? 'var(--primary)' : 'var(--text)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Banknote size={28} />
              <span>CASH</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPaymentMethod(PAYMENT_METHOD.ONLINE)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: selectedPaymentMethod === PAYMENT_METHOD.ONLINE ? '2px solid var(--primary)' : '1px solid var(--border)',
                backgroundColor: selectedPaymentMethod === PAYMENT_METHOD.ONLINE ? 'var(--primary-light)' : 'var(--surface)',
                color: selectedPaymentMethod === PAYMENT_METHOD.ONLINE ? 'var(--primary)' : 'var(--text)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Smartphone size={28} />
              <span>ONLINE (UPI QR)</span>
            </button>
          </div>
        </div>

        {/* Payment Actions (Section 83) */}
        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            onClick={() => navigate(`/waiter/table/${table.id}`)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            icon={ArrowRight}
            onClick={handleContinuePayment}
          >
            Continue to Payment
          </Button>
        </div>
      </Card>
    </div>
  );
};
