import React from 'react';
import { Plus, Minus, Trash2, User } from 'lucide-react';
import { formatCurrency } from '../../utils/calculations';

export const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const itemTotal = item.unitPrice * item.quantity;

  return (
    <div
      className="cart-item"
      style={{
        padding: '10px 0',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0, paddingRight: 6 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            {item.productName}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
            {formatCurrency(item.unitPrice)} each
          </div>
        </div>

        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', flexShrink: 0 }}>
          {formatCurrency(itemTotal)}
        </div>
      </div>

      {/* Multi-waiter attribution if available */}
      {item.addedByName && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500, wordBreak: 'break-word' }}>
          <User size={12} style={{ flexShrink: 0 }} />
          <span>Added by {item.addedByName}</span>
        </div>
      )}

      {/* Quantity adjustment & Remove */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--surface-alt)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)'
          }}
        >
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)'
            }}
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600, fontSize: '0.9rem' }}>
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)'
            }}
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => onRemove(item.productId)}
          style={{
            color: 'var(--danger)',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)'
          }}
          aria-label="Remove item"
        >
          <Trash2 size={14} />
          <span>Remove</span>
        </button>
      </div>
    </div>
  );
};
