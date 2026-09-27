import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { Receipt, ArrowRight, Clock, Coffee, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDateTime, calculateSubtotal } from '../../utils/calculations';
import { ORDER_STATUS } from '../../utils/constants';

export const WaiterOrders = () => {
  const { user, isOwner } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'OCCUPIED' (OPEN) | 'BILLING'

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    try {
      const allOrders = await apiService.getOrders();

      // If Owner or Admin, they have access to all tables across the cafe
      if (user?.role === 'OWNER' || user?.role === 'ADMIN') {
        setOrders(allOrders);
        return;
      }

      // Otherwise, standard waiter with assigned tables
      const waiters = await apiService.getWaiters();
      const currentWaiter = waiters.find(
        (w) => w.username.toLowerCase() === user?.username?.toLowerCase() || w.id === user?.waiterId
      );
      const assignedTables = currentWaiter?.assignedTables || [];

      // Filter orders on assigned tables or created by waiter
      const myOrders = allOrders.filter(
        (o) => assignedTables.includes(o.tableId) || o.waiterId === user?.waiterId
      );
      setOrders(myOrders);
    } catch (err) {
      console.error('Failed to load waiter orders:', err);
    }
  };

  // Active orders: includes Occupied (OPEN) and Billing (BILLING, PAYMENT_PENDING)
  const activeOrders = orders.filter((o) =>
    [ORDER_STATUS.OPEN, ORDER_STATUS.BILLING, ORDER_STATUS.PAYMENT_PENDING].includes(o.status)
  );

  // Filter based on user-selected status filter tab
  const filteredOrders = activeOrders.filter((o) => {
    if (statusFilter === 'OCCUPIED') {
      return o.status === ORDER_STATUS.OPEN;
    }
    if (statusFilter === 'BILLING') {
      return o.status === ORDER_STATUS.BILLING || o.status === ORDER_STATUS.PAYMENT_PENDING;
    }
    return true;
  });

  const occupiedCount = activeOrders.filter((o) => o.status === ORDER_STATUS.OPEN).length;
  const billingCount = activeOrders.filter(
    (o) => o.status === ORDER_STATUS.BILLING || o.status === ORDER_STATUS.PAYMENT_PENDING
  ).length;

  const tabStyle = (active, color = 'var(--primary)') => ({
    padding: '8px 16px',
    borderRadius: 'var(--radius-full)',
    border: active ? `2px solid ${color}` : '1px solid var(--border)',
    backgroundColor: active ? color : 'var(--surface)',
    color: active ? '#fff' : 'var(--text-secondary)',
    fontWeight: 700,
    fontSize: '0.85rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6
  });

  return (
    <div>
      <PageHeader
        title={isOwner ? 'Live Orders & Active Tables' : 'Current Active Orders'}
        subtitle={
          isOwner
            ? 'Real-time cafe monitor showing all occupied dining tables and billing orders'
            : 'Manage live orders on your assigned tables'
        }
      />

      {/* Status Filter Tabs */}
      <div
        className="horizontal-scroll-row"
        style={{ gap: 8, marginBottom: 20 }}
      >
        <button
          type="button"
          style={tabStyle(statusFilter === 'ALL', 'var(--primary)')}
          onClick={() => setStatusFilter('ALL')}
        >
          <span>All Live Orders</span>
          <span
            style={{
              fontSize: '0.75rem',
              padding: '1px 6px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: statusFilter === 'ALL' ? 'rgba(255,255,255,0.3)' : 'var(--surface-alt)',
              color: statusFilter === 'ALL' ? '#fff' : 'var(--text)'
            }}
          >
            {activeOrders.length}
          </span>
        </button>

        <button
          type="button"
          style={tabStyle(statusFilter === 'OCCUPIED', '#f59e0b')}
          onClick={() => setStatusFilter('OCCUPIED')}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
          <span>Occupied ({occupiedCount})</span>
        </button>

        <button
          type="button"
          style={tabStyle(statusFilter === 'BILLING', '#0284c7')}
          onClick={() => setStatusFilter('BILLING')}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#0284c7' }} />
          <span>Billing & Settlement ({billingCount})</span>
        </button>
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={
            statusFilter === 'OCCUPIED'
              ? 'No occupied orders'
              : statusFilter === 'BILLING'
              ? 'No billing orders'
              : 'No active orders'
          }
          description={
            statusFilter === 'OCCUPIED'
              ? 'There are currently no dining tables in occupied state.'
              : statusFilter === 'BILLING'
              ? 'There are currently no tables in billing or payment pending state.'
              : 'There are currently no live orders.'
          }
          actionLabel="View Tables"
          onAction={() => navigate('/waiter/tables')}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
            gap: 18
          }}
        >
          {filteredOrders.map((order) => {
            const subtotal = calculateSubtotal(order.items);
            const itemsCount = (order.items || []).reduce((sum, i) => sum + i.quantity, 0);
            const isBilling =
              order.status === ORDER_STATUS.BILLING || order.status === ORDER_STATUS.PAYMENT_PENDING;

            return (
              <div
                key={order.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderLeft: `5px solid ${isBilling ? '#0284c7' : '#f59e0b'}`
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 10
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>
                        Table {order.tableNumber}
                      </h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        Order #{order.orderNumber}
                      </span>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                    <div>
                      <strong>Customer:</strong> {order.customerName} ({order.customerCount} guests)
                    </div>
                    {order.waiterName && (
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        <strong>Attendant:</strong> {order.waiterName}
                      </div>
                    )}
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 2 }}>
                      <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                      {formatDateTime(order.createdAt)}
                    </div>
                  </div>

                  {/* Items snapshot */}
                  <div
                    style={{
                      backgroundColor: 'var(--surface-alt)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      marginBottom: 14
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{itemsCount} items ordered:</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                      {(order.items || []).map((item) => `${item.productName} ×${item.quantity}`).join(', ')}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontWeight: 800,
                      fontSize: '1.15rem',
                      color: isBilling ? '#0284c7' : 'var(--primary)',
                      marginBottom: 14
                    }}
                  >
                    <span>Current Total:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    borderTop: '1px solid var(--border)',
                    paddingTop: 10
                  }}
                >
                  <Button
                    variant="primary"
                    size="sm"
                    icon={ArrowRight}
                    style={{ flex: 1 }}
                    onClick={() => navigate(`/waiter/table/${order.tableId}`)}
                  >
                    Open Order
                  </Button>
                  <Button
                    variant={isBilling ? 'primary' : 'success'}
                    size="sm"
                    onClick={() =>
                      navigate(
                        isBilling
                          ? `/waiter/payment/${order.tableId}`
                          : `/waiter/bill/${order.tableId}`
                      )
                    }
                  >
                    {isBilling ? 'Settle Payment' : 'Bill'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
