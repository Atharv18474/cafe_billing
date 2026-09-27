import React from 'react';
import { Card } from '../common/Card';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';
import { Users, Edit2, Play, ArrowRight, Receipt, Coffee } from 'lucide-react';
import { TABLE_STATUS } from '../../utils/constants';
import { formatCurrency } from '../../utils/calculations';

export const TableCard = ({
  table,
  isWaiterView = false,
  assignedWaiters = [],
  onStartOrder,
  onOpenOrder,
  onViewBilling,
  onEditTable
}) => {
  const isAvailable = table.status === TABLE_STATUS.AVAILABLE;
  const isOccupied = table.status === TABLE_STATUS.OCCUPIED;
  const isBilling = table.status === TABLE_STATUS.BILLING;
  const isPending = table.status === TABLE_STATUS.PAYMENT_PENDING;

  return (
    <Card
      className="table-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderLeft: isAvailable
          ? '5px solid var(--success)'
          : isOccupied
          ? '5px solid var(--warning)'
          : isBilling
          ? '5px solid var(--info)'
          : '5px solid #eab308',
        minHeight: isWaiterView ? '190px' : '170px',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Dine-In
            </span>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Coffee size={20} color="var(--primary)" /> Table {table.tableNumber}
            </h3>
          </div>
          <StatusBadge status={table.status} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 10 }}>
          <Users size={16} color="var(--muted)" />
          <span>{table.capacity} Seats</span>
        </div>

        {/* Waiter assignment list if in Admin view */}
        {!isWaiterView && assignedWaiters && assignedWaiters.length > 0 && (
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 10, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            Waiters: <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
              {assignedWaiters.map(w => w.name).join(', ')}
            </span>
          </div>
        )}

        {/* Current Order details if occupied/billing */}
        {(isOccupied || isBilling || isPending) && (
          <div
            style={{
              backgroundColor: 'var(--surface-alt)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              fontSize: '0.85rem',
              marginBottom: 12,
              wordBreak: 'break-word',
              overflowWrap: 'anywhere'
            }}
          >
            {table.currentCustomer && (
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                {table.currentCustomer}
              </div>
            )}
            {table.currentAmount !== undefined && (
              <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.05rem', marginTop: 2 }}>
                {formatCurrency(table.currentAmount)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div style={{ paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
        {isWaiterView ? (
          <>
            {isAvailable && (
              <Button
                variant="success"
                size="sm"
                icon={Play}
                style={{ width: '100%' }}
                onClick={() => onStartOrder && onStartOrder(table)}
              >
                START
              </Button>
            )}
            {isOccupied && (
              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                style={{ width: '100%' }}
                onClick={() => onOpenOrder && onOpenOrder(table)}
              >
                OPEN
              </Button>
            )}
            {(isBilling || isPending) && (
              <Button
                variant="info"
                size="sm"
                icon={Receipt}
                style={{ width: '100%', background: 'var(--info)', color: '#fff' }}
                onClick={() => onViewBilling && onViewBilling(table)}
              >
                BILLING
              </Button>
            )}
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            icon={Edit2}
            style={{ width: '100%' }}
            onClick={() => onEditTable && onEditTable(table)}
          >
            Edit Table
          </Button>
        )}
      </div>
    </Card>
  );
};
