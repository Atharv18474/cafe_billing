import React from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { CartItem } from './CartItem';
import { ShoppingBag, Save, Receipt, AlertCircle, Percent, Gift, Tag } from 'lucide-react';
import {
  calculateSubtotal,
  calculateComprehensiveDiscounts,
  calculateGrandTotal,
  formatCurrency
} from '../../utils/calculations';
import { DISCOUNT_SCOPE } from '../../utils/constants';

export const Cart = ({
  order,
  table,
  activeDiscount,
  allDiscounts = [],
  onUpdateQuantity,
  onRemoveItem,
  onSaveOrder,
  onConfirmBill,
  saving = false
}) => {
  const items = order?.items || [];
  const subtotal = calculateSubtotal(items);

  // Evaluate all promotions: combos, product-specific, and order-level
  const discountsToUse = (allDiscounts && allDiscounts.length > 0)
    ? allDiscounts
    : (activeDiscount ? [activeDiscount] : []);

  const { totalDiscount, appliedDiscounts } = calculateComprehensiveDiscounts(items, discountsToUse);
  const total = calculateGrandTotal(subtotal, totalDiscount);

  const hasItems = items.length > 0;

  return (
    <Card
      className="pos-cart"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '16px',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingBag size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>
              Current Order
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-alt)', fontWeight: 600 }}>
            {order?.orderNumber || 'New Order'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <div>
            <strong>Table:</strong> {table?.tableNumber || order?.tableNumber || '-'}
          </div>
          <div>
            <strong>Customer:</strong> {order?.customerName || 'Walk-in'}
          </div>
        </div>
      </div>

      {/* Item List */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, minHeight: '180px' }}>
        {!hasItems ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--muted)',
              textAlign: 'center',
              padding: '24px 0'
            }}
          >
            <ShoppingBag size={36} strokeWidth={1.5} style={{ marginBottom: 8, opacity: 0.5 }} />
            <p style={{ fontWeight: 500 }}>Cart is empty</p>
            <span style={{ fontSize: '0.8rem' }}>Add products from the catalog</span>
          </div>
        ) : (
          items.map((item) => (
            <CartItem
              key={item.productId}
              item={item}
              onUpdateQuantity={onUpdateQuantity}
              onRemove={onRemoveItem}
            />
          ))
        )}
      </div>

      {/* Bill Calculation Summary */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 16,
          marginTop: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <span>Subtotal</span>
          <span style={{ fontWeight: 600 }}>{formatCurrency(subtotal)}</span>
        </div>

        {/* Applied Discounts & Combos Breakdown */}
        {appliedDiscounts.length > 0 ? (
          <div
            style={{
              backgroundColor: 'rgba(46, 125, 50, 0.08)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--success)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: 'var(--success)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Percent size={14} /> Total Promotions Applied:
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
                  fontSize: '0.8rem',
                  paddingLeft: 6,
                  borderLeft: '2px solid var(--success)',
                  marginTop: 2
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {ad.scope === DISCOUNT_SCOPE.COMBO ? <Gift size={12} color="#8e24aa" /> : ad.scope === DISCOUNT_SCOPE.PRODUCT ? <Tag size={12} color="#1976d2" /> : <Percent size={12} color="#2e7d32" />}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--muted)' }}>
            <span>Discount / Combo</span>
            <span>₹0</span>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '1.25rem',
            fontWeight: 800,
            color: 'var(--text)',
            borderTop: '1px dashed var(--border)',
            paddingTop: 10,
            marginTop: 4
          }}
        >
          <span>TOTAL</span>
          <span style={{ color: 'var(--primary)' }}>{formatCurrency(total)}</span>
        </div>

        {/* Action Buttons */}
        <div className="cart-actions-row" style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            icon={Save}
            disabled={!hasItems || saving}
            loading={saving}
            style={{ flex: '1 1 120px', minWidth: 0, whiteSpace: 'normal', padding: '8px 10px', fontSize: '0.85rem' }}
            onClick={onSaveOrder}
          >
            Save Order
          </Button>

          <Button
            variant="success"
            icon={Receipt}
            disabled={!hasItems || saving}
            style={{ flex: '1 1 120px', minWidth: 0, whiteSpace: 'normal', padding: '8px 10px', fontSize: '0.85rem' }}
            onClick={onConfirmBill}
          >
            Confirm Bill
          </Button>
        </div>
      </div>
    </Card>
  );
};
