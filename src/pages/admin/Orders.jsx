import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { Receipt, Eye, Clock, User, Coffee } from 'lucide-react';
import { ORDER_STATUS } from '../../utils/constants';
import { formatCurrency, formatDateTime, calculateSubtotal } from '../../utils/calculations';

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await apiService.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(q) ||
      (o.customerName && o.customerName.toLowerCase().includes(q)) ||
      String(o.tableNumber).includes(q) ||
      (o.waiterName && o.waiterName.toLowerCase().includes(q));

    let matchesStatus = true;
    if (statusFilter === 'ACTIVE') {
      matchesStatus = [ORDER_STATUS.OPEN, ORDER_STATUS.BILLING, ORDER_STATUS.PAYMENT_PENDING].includes(o.status);
    } else if (statusFilter === 'COMPLETED') {
      matchesStatus = [ORDER_STATUS.PAID, ORDER_STATUS.CLOSED].includes(o.status);
    } else if (statusFilter === 'CANCELLED') {
      matchesStatus = o.status === ORDER_STATUS.CANCELLED;
    }

    return matchesSearch && matchesStatus;
  });

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setViewModalOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Orders Log"
        subtitle="Track active table orders, itemized order lists, and waiter attributions"
      />

      {/* Filter and Search Bar (Section 54, 56) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          marginBottom: 20,
          flexWrap: 'wrap',
          backgroundColor: 'var(--surface)',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)'
        }}
      >
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by order #, table, customer..."
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: statusFilter === tab ? 'var(--primary)' : 'var(--surface-alt)',
                color: statusFilter === tab ? '#fff' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: statusFilter === tab ? 'var(--primary)' : 'var(--border)'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No active orders"
          description="There are no orders matching the specified filter criteria."
        />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order No.</th>
                <th>Table</th>
                <th>Customer</th>
                <th>Waiter</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date & Time</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const subtotal = calculateSubtotal(order.items);
                const itemsCount = (order.items || []).reduce((sum, i) => sum + i.quantity, 0);

                return (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{order.orderNumber}</td>
                    <td>Table {order.tableNumber}</td>
                    <td>{order.customerName}</td>
                    <td>{order.waiterName || 'Staff'}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          padding: '3px 8px',
                          backgroundColor: 'var(--surface-alt)',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 600
                        }}
                      >
                        {itemsCount} items
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(subtotal)}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td style={{ fontSize: '0.825rem', color: 'var(--muted)' }}>
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        onClick={() => handleViewOrder(order)}
                      >
                        View Items
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* View Order Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={`Order Details: ${selectedOrder?.orderNumber || ''}`}
        maxWidth="520px"
      >
        <div className="modal-body">
          {selectedOrder && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    Table {selectedOrder.tableNumber}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                    Customer: {selectedOrder.customerName} ({selectedOrder.customerCount} guests)
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <StatusBadge status={selectedOrder.status} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
                    {formatDateTime(selectedOrder.createdAt)}
                  </div>
                </div>
              </div>

              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 }}>
                Ordered Items
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '240px', overflowY: 'auto' }}>
                {(selectedOrder.items || []).map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      backgroundColor: 'var(--surface-alt)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {item.productName} <span style={{ color: 'var(--muted)' }}>× {item.quantity}</span>
                      </div>
                      {item.addedByName && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <User size={12} />
                          <span>Added by {item.addedByName}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: 14, marginTop: 16, fontSize: '1.15rem', fontWeight: 800 }}>
                <span>Subtotal:</span>
                <span style={{ color: 'var(--primary)' }}>
                  {formatCurrency(calculateSubtotal(selectedOrder.items))}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => setViewModalOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};
