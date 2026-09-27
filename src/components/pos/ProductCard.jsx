import React from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Plus, Minus } from 'lucide-react';
import { formatCurrency } from '../../utils/calculations';

export const ProductCard = ({ product, quantityInCart = 0, onAdd, onUpdateQuantity }) => {
  return (
    <Card
      className="product-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '14px',
        border: quantityInCart > 0 ? '2px solid var(--primary)' : '1px solid var(--border)',
        position: 'relative',
        transition: 'transform 0.1s ease, border-color 0.15s ease',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      <div style={{ minWidth: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <h4
            style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              color: 'var(--text)',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.25
            }}
          >
            {product.name}
          </h4>
        </div>
        
        <span
          style={{
            fontSize: '0.725rem',
            color: 'var(--muted)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            display: 'block',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {product.categoryName}
        </span>

        {product.description && (
          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              marginTop: 4,
              marginBottom: 8,
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word'
            }}
          >
            {product.description}
          </p>
        )}

        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', marginTop: 6 }}>
          {formatCurrency(product.price)}
        </div>
      </div>

      <div style={{ marginTop: 12, width: '100%', minWidth: 0 }}>
        {quantityInCart === 0 ? (
          <button
            type="button"
            className="btn btn-primary add-to-cart-btn"
            onClick={() => onAdd(product)}
            style={{
              width: '100%',
              minHeight: '40px',
              padding: '8px 10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              boxSizing: 'border-box'
            }}
          >
            <Plus size={15} style={{ flexShrink: 0 }} />
            <span>ADD TO CART</span>
          </button>
        ) : (
          <div
            className="quantity-stepper"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--primary-light)',
              borderRadius: 'var(--radius-md)',
              padding: '4px',
              border: '1px solid rgba(194, 94, 0, 0.3)',
              width: '100%',
              minWidth: 0,
              boxSizing: 'border-box'
            }}
          >
            <button
              type="button"
              onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
              style={{
                width: 30,
                height: 30,
                flexShrink: 0,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#fff',
                color: 'var(--primary)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)'
              }}
              aria-label="Decrease quantity"
            >
              <Minus size={15} />
            </button>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)', minWidth: 20, textAlign: 'center', flex: 1 }}>
              {quantityInCart}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQuantity(product.id, quantityInCart + 1)}
              style={{
                width: 30,
                height: 30,
                flexShrink: 0,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary)',
                color: '#fff',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)'
              }}
              aria-label="Increase quantity"
            >
              <Plus size={15} />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};
