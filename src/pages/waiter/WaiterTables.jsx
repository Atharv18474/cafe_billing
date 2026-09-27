import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { PageHeader } from '../../components/common/PageHeader';
import { TableCard } from '../../components/pos/TableCard';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Play, UtensilsCrossed, AlertCircle } from 'lucide-react';
import { TABLE_STATUS } from '../../utils/constants';

export const WaiterTables = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [authorizedTables, setAuthorizedTables] = useState([]);
  const [waiterProfile, setWaiterProfile] = useState(null);

  // Start Order modal
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [targetTable, setTargetTable] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [guestCount, setGuestCount] = useState('2');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadWaiterTables();
  }, [user]);

  const loadWaiterTables = async () => {
    if (!user) return;
    try {
      const allTables = await apiService.getTables();
      if (user.role === 'OWNER') {
        setWaiterProfile({ id: user.id, name: user.name, username: user.username, role: 'OWNER' });
        setAuthorizedTables(allTables);
        return;
      }

      const waiters = await apiService.getWaiters();
      // Find waiter record by username or waiterId
      const currentWaiter = waiters.find(
        (w) => w.username.toLowerCase() === user.username.toLowerCase() || w.id === user.waiterId
      );
      setWaiterProfile(currentWaiter);

      const assignedIds = currentWaiter?.assignedTables || [];

      // Show ONLY tables authorized for this waiter
      const myTables = allTables.filter((t) => assignedIds.includes(t.id));
      setAuthorizedTables(myTables);
    } catch (err) {
      showToast(err.message || 'Error loading tables', 'error');
    }
  };

  const handleOpenStartModal = (table) => {
    setTargetTable(table);
    setCustomerName('');
    setGuestCount(String(table.capacity > 0 ? table.capacity : 2));
    setFormError('');
    setStartModalOpen(true);
  };

  const handleStartOrder = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim()) {
      setFormError('Customer name is required.');
      return;
    }

    const count = Number(guestCount);
    if (!count || count <= 0) {
      setFormError('Number of customers must be greater than 0.');
      return;
    }

    try {
      const newOrder = await apiService.createOrder({
        tableId: targetTable.id,
        customerName: customerName.trim(),
        customerCount: count,
        waiterId: waiterProfile?.id || user.id,
        waiterName: waiterProfile?.name || user.name
      });

      showToast(`Order created for Table ${targetTable.tableNumber}.`, 'success');
      setStartModalOpen(false);
      navigate(`/waiter/table/${targetTable.id}`);
    } catch (err) {
      setFormError(err.message || 'Error creating order.');
    }
  };

  const handleOpenOrder = (table) => {
    navigate(`/waiter/table/${table.id}`);
  };

  const handleViewBilling = (table) => {
    navigate(`/waiter/bill/${table.id}`);
  };

  return (
    <div>
      <PageHeader
        title="My Tables"
        subtitle={`Welcome, ${waiterProfile?.name || user?.name}! You have ${authorizedTables.length} authorized tables assigned.`}
      />

      {authorizedTables.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No authorized tables assigned"
          description="You do not currently have any tables assigned. Please ask the cafe administrator to assign tables to your waiter profile."
        />
      ) : (
        <div
          className="table-cards-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16
          }}
        >
          {authorizedTables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              isWaiterView={true}
              onStartOrder={handleOpenStartModal}
              onOpenOrder={handleOpenOrder}
              onViewBilling={handleViewBilling}
            />
          ))}
        </div>
      )}

      {/* Start Order Modal (Section 34) */}
      <Modal
        isOpen={startModalOpen}
        onClose={() => setStartModalOpen(false)}
        title={`Start Order: Table ${targetTable?.tableNumber || ''}`}
        maxWidth="440px"
      >
        <form onSubmit={handleStartOrder}>
          <div className="modal-body">
            {formError && <div className="form-error" style={{ marginBottom: 12 }}>{formError}</div>}
            
            <div style={{ padding: '10px 14px', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: '0.875rem' }}>
              <strong>Table {targetTable?.tableNumber}</strong> &bull; Capacity: {targetTable?.capacity} Seats
            </div>

            <Input
              label="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Rahul or Walk-in"
              required
              autoFocus
            />

            <Input
              label="Number of Customers"
              type="number"
              min="1"
              max="20"
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              required
            />
          </div>
          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setStartModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={Play}>
              Start Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
