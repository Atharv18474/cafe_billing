import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchBar } from '../../components/common/SearchBar';
import { useToast } from '../../context/ToastContext';
import { Plus, Edit2, CheckSquare, Power, UserCheck, Phone, Check } from 'lucide-react';

export const Waiters = () => {
  const [waiters, setWaiters] = useState([]);
  const [tables, setTables] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedWaiter, setSelectedWaiter] = useState(null);

  // Form states
  const [waiterForm, setWaiterForm] = useState({
    name: '',
    username: '',
    password: '',
    phone: '',
    status: 'ACTIVE'
  });
  const [formError, setFormError] = useState('');

  // Table assignment checkboxes state
  const [assignedTableIds, setAssignedTableIds] = useState([]);

  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [wtrs, tbls] = await Promise.all([
        apiService.getWaiters(),
        apiService.getTables()
      ]);
      setWaiters(wtrs);
      setTables(tbls);
    } catch (err) {
      showToast(err.message || 'Failed to load data.', 'error');
    }
  };

  const filteredWaiters = waiters.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.phone && w.phone.includes(searchQuery));
    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    setWaiterForm({
      name: '',
      username: '',
      password: '',
      phone: '',
      status: 'ACTIVE'
    });
    setFormError('');
    setAddModalOpen(true);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!waiterForm.name.trim()) {
      setFormError('Name is required.');
      return;
    }
    if (!waiterForm.username.trim()) {
      setFormError('Username is required.');
      return;
    }
    if (!waiterForm.password.trim()) {
      setFormError('Password is required.');
      return;
    }
    if (!waiterForm.phone.trim()) {
      setFormError('Phone number is required.');
      return;
    }

    try {
      await apiService.createWaiter(waiterForm);
      showToast('Waiter added successfully.', 'success');
      setAddModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to add waiter.');
    }
  };

  const handleOpenAssign = (waiter) => {
    setSelectedWaiter(waiter);
    setAssignedTableIds(waiter.assignedTables || []);
    setAssignModalOpen(true);
  };

  const handleToggleTableCheckbox = (tableId) => {
    if (assignedTableIds.includes(tableId)) {
      setAssignedTableIds(assignedTableIds.filter((id) => id !== tableId));
    } else {
      setAssignedTableIds([...assignedTableIds, tableId]);
    }
  };

  const handleSaveAssignment = async () => {
    try {
      await apiService.assignWaiterToTable(selectedWaiter.id, assignedTableIds);
      showToast(`Table assignments updated for ${selectedWaiter.name}.`, 'success');
      setAssignModalOpen(false);
      setSelectedWaiter(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to assign tables.', 'error');
    }
  };

  const handleToggleStatus = async (waiter) => {
    try {
      const res = await apiService.toggleWaiterStatus(waiter.id);
      const newStatus = res.status || (waiter.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
      showToast(
        `${waiter.name} is now ${newStatus}.`,
        newStatus === 'ACTIVE' ? 'success' : 'info'
      );
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to toggle status.', 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Waiter Management"
        subtitle="Manage service staff, credentials, and multi-waiter dining table assignments"
        actions={
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            + Add Waiter
          </Button>
        }
      />

      {/* Filter bar */}
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
          placeholder="Search waiters by name, phone..."
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
            style={{ width: 'auto', padding: '6px 12px', height: '38px' }}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Waiters Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Assigned Tables</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWaiters.map((waiter) => (
              <tr key={waiter.id}>
                <td style={{ fontWeight: 700 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}
                    >
                      {waiter.name.charAt(0)}
                    </div>
                    <span>{waiter.name}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                  {waiter.username}
                </td>
                <td style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                  {waiter.phone}
                </td>
                <td>
                  <StatusBadge status={waiter.status} />
                </td>
                <td>
                  {waiter.assignedTables && waiter.assignedTables.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {waiter.assignedTables.map((tId) => (
                        <span
                          key={tId}
                          style={{
                            padding: '2px 8px',
                            backgroundColor: 'var(--surface-alt)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.775rem',
                            fontWeight: 600,
                            border: '1px solid var(--border)'
                          }}
                        >
                          Table {tId}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>- None -</span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={CheckSquare}
                      onClick={() => handleOpenAssign(waiter)}
                    >
                      Assign Tables
                    </Button>
                    <Button
                      variant={waiter.status === 'ACTIVE' ? 'secondary' : 'success'}
                      size="sm"
                      icon={Power}
                      onClick={() => handleToggleStatus(waiter)}
                    >
                      {waiter.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Waiter Modal (Section 30) */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Waiter"
      >
        <form onSubmit={handleSaveAdd}>
          <div className="modal-body">
            {formError && <div className="form-error" style={{ marginBottom: 12 }}>{formError}</div>}
            <Input
              label="Full Name"
              value={waiterForm.name}
              onChange={(e) => setWaiterForm({ ...waiterForm, name: e.target.value })}
              placeholder="e.g. Ramesh Singh"
              required
            />
            <Input
              label="Phone Number"
              value={waiterForm.phone}
              onChange={(e) => setWaiterForm({ ...waiterForm, phone: e.target.value })}
              placeholder="+91 98765 00000"
              required
            />
            <Input
              label="Login Username"
              value={waiterForm.username}
              onChange={(e) => setWaiterForm({ ...waiterForm, username: e.target.value })}
              placeholder="e.g. ramesh"
              required
            />
            <Input
              label="Login Password"
              type="password"
              value={waiterForm.password}
              onChange={(e) => setWaiterForm({ ...waiterForm, password: e.target.value })}
              placeholder="Enter password"
              required
            />
            <Select
              label="Status"
              value={waiterForm.status}
              onChange={(e) => setWaiterForm({ ...waiterForm, status: e.target.value })}
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' }
              ]}
            />
          </div>
          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Waiter
            </Button>
          </div>
        </form>
      </Modal>

      {/* Waiter-Table Assignment Modal (Section 31) */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign Tables: ${selectedWaiter?.name || ''}`}
        maxWidth="480px"
      >
        <div className="modal-body">
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: 16 }}>
            Select the tables that <strong>{selectedWaiter?.name}</strong> is authorized to serve. Multiple waiters can be assigned to the same table.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
              maxHeight: '260px',
              overflowY: 'auto',
              padding: '4px'
            }}
          >
            {tables.map((table) => {
              const isChecked = assignedTableIds.includes(table.id);
              return (
                <label
                  key={table.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: isChecked ? '2px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: isChecked ? 'var(--primary-light)' : 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleTableCheckbox(table.id)}
                    style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                      Table {table.tableNumber}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {table.capacity} Seats
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => setAssignModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveAssignment}>
            Save Assignments
          </Button>
        </div>
      </Modal>
    </div>
  );
};
