import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { TableCard } from '../../components/pos/TableCard';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Plus, Filter, UtensilsCrossed } from 'lucide-react';
import { TABLE_STATUS } from '../../utils/constants';

export const Tables = () => {
  const [tables, setTables] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Form states
  const [newTableNum, setNewTableNum] = useState('');
  const [newCapacity, setNewCapacity] = useState('4');
  const [formError, setFormError] = useState('');

  const [selectedTable, setSelectedTable] = useState(null);
  const [editTableNum, setEditTableNum] = useState('');
  const [editCapacity, setEditCapacity] = useState('4');
  const [editStatus, setEditStatus] = useState('');
  const [pendingStatusChange, setPendingStatusChange] = useState(null);

  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tbls, wtrs] = await Promise.all([
        apiService.getTables(),
        apiService.getWaiters()
      ]);
      setTables(tbls);
      setWaiters(wtrs);
    } catch (err) {
      showToast(err.message || 'Failed to load data.', 'error');
    }
  };

  const filteredTables = tables.filter((t) => {
    if (statusFilter === 'ALL') return true;
    return t.status === statusFilter;
  });

  const handleAddTable = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!newTableNum.trim()) {
      setFormError('Table number is required.');
      return;
    }
    const capNum = Number(newCapacity);
    if (!capNum || capNum <= 0) {
      setFormError('Capacity must be greater than 0.');
      return;
    }

    try {
      await apiService.createTable({
        tableNumber: newTableNum.trim(),
        capacity: capNum
      });

      showToast('Table created successfully.', 'success');
      setAddModalOpen(false);
      setNewTableNum('');
      setNewCapacity('4');
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to create table.');
    }
  };

  const handleOpenEdit = (table) => {
    setSelectedTable(table);
    setEditTableNum(table.tableNumber);
    setEditCapacity(String(table.capacity));
    setEditStatus(table.status);
    setFormError('');
    setEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!editTableNum.trim()) {
      setFormError('Table number is required.');
      return;
    }
    const capNum = Number(editCapacity);
    if (!capNum || capNum <= 0) {
      setFormError('Capacity must be greater than 0.');
      return;
    }

    // Check Rule 22: Do not allow changing an occupied table to available manually without confirmation
    if (selectedTable.status === TABLE_STATUS.OCCUPIED && editStatus === TABLE_STATUS.AVAILABLE) {
      setPendingStatusChange(TABLE_STATUS.AVAILABLE);
      setConfirmDialogOpen(true);
      return;
    }

    applyTableUpdates(editStatus);
  };

  const applyTableUpdates = async (statusToApply) => {
    try {
      await apiService.updateTable(selectedTable.id, {
        tableNumber: editTableNum.trim(),
        capacity: Number(editCapacity),
        status: statusToApply
      });

      showToast('Table updated successfully.', 'success');
      setEditModalOpen(false);
      setSelectedTable(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update table.', 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Table Management"
        subtitle="Monitor dining tables, capacities, seating statuses, and waiter assignments"
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setFormError('');
              setAddModalOpen(true);
            }}
          >
            + Add Table
          </Button>
        }
      />

      {/* Filter Bar (Section 56) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
          backgroundColor: 'var(--surface)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          overflowX: 'auto'
        }}
      >
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          <Filter size={16} /> Filter:
        </span>
        <div className="horizontal-scroll-row" style={{ flex: 1 }}>
          {['ALL', TABLE_STATUS.AVAILABLE, TABLE_STATUS.OCCUPIED, TABLE_STATUS.BILLING].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                backgroundColor: statusFilter === status ? 'var(--primary)' : 'var(--surface-alt)',
                color: statusFilter === status ? '#fff' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: statusFilter === status ? 'var(--primary)' : 'var(--border)'
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Tables Grid */}
      {filteredTables.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No tables found"
          description="There are no tables matching the selected status filter."
          actionLabel="+ Add Table"
          onAction={() => setAddModalOpen(true)}
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
          {filteredTables.map((table) => {
            const assigned = waiters.filter((w) => (w.assignedTables || []).includes(table.id));
            return (
              <TableCard
                key={table.id}
                table={table}
                assignedWaiters={assigned}
                isWaiterView={false}
                onEditTable={handleOpenEdit}
              />
            );
          })}
        </div>
      )}

      {/* Add Table Modal (Section 21) */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Table"
        maxWidth="440px"
      >
        <form onSubmit={handleAddTable}>
          <div className="modal-body">
            {formError && <div className="form-error" style={{ marginBottom: 12 }}>{formError}</div>}
            <Input
              label="Table Number"
              type="text"
              value={newTableNum}
              onChange={(e) => setNewTableNum(e.target.value)}
              placeholder="e.g. 11 or 12"
              required
            />
            <Input
              label="Capacity (Seats)"
              type="number"
              min="1"
              max="20"
              value={newCapacity}
              onChange={(e) => setNewCapacity(e.target.value)}
              required
            />
          </div>
          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Table
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Table Modal (Section 22) */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Table ${selectedTable?.tableNumber || ''}`}
        maxWidth="440px"
      >
        <form onSubmit={handleSaveEdit}>
          <div className="modal-body">
            {formError && <div className="form-error" style={{ marginBottom: 12 }}>{formError}</div>}
            <Input
              label="Table Number"
              type="text"
              value={editTableNum}
              onChange={(e) => setEditTableNum(e.target.value)}
              required
            />
            <Input
              label="Capacity"
              type="number"
              min="1"
              max="20"
              value={editCapacity}
              onChange={(e) => setEditCapacity(e.target.value)}
              required
            />
            <Select
              label="Status"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              options={[
                { value: TABLE_STATUS.AVAILABLE, label: 'Available' },
                { value: TABLE_STATUS.OCCUPIED, label: 'Occupied' },
                { value: TABLE_STATUS.BILLING, label: 'Billing' }
              ]}
            />
          </div>
          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog for Changing Occupied to Available (Rule 22) */}
      <ConfirmDialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={() => applyTableUpdates(pendingStatusChange)}
        title="Reset Occupied Table?"
        message="This table is currently marked as OCCUPIED. Changing its status to AVAILABLE will clear its active order and unseat guests. Are you sure you want to proceed?"
        confirmText="Yes, Make Available"
        danger
      />
    </div>
  );
};
