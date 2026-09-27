import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Plus, Edit2, Trash2, Key, Phone, User, Crown, Shield } from 'lucide-react';
import { USER_ROLES } from '../../utils/constants';

export const OwnersAndAdmins = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'OWNER' | 'ADMIN'

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: USER_ROLES.ADMIN,
    phone: ''
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const all = await apiService.getUsers();
      // Only management accounts (Owners and Admins)
      const mgmt = all.filter((u) => u.role === USER_ROLES.OWNER || u.role === USER_ROLES.ADMIN);
      setUsers(mgmt);
    } catch (err) {
      showToast(err.message || 'Failed to load users.', 'error');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter === 'OWNER') return u.role === USER_ROLES.OWNER;
    if (roleFilter === 'ADMIN') return u.role === USER_ROLES.ADMIN;
    return true;
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      username: '',
      password: '',
      role: USER_ROLES.ADMIN,
      phone: ''
    });
    setFormError('');
    setAddModalOpen(true);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Full Name is required.');
      return;
    }
    if (!formData.username.trim()) {
      setFormError('Username is required.');
      return;
    }
    if (!formData.password.trim()) {
      setFormError('Password is required.');
      return;
    }

    try {
      await apiService.createUser({
        name: formData.name.trim(),
        username: formData.username.trim(),
        password: formData.password.trim(),
        role: formData.role,
        phone: formData.phone.trim()
      });

      showToast(`New ${formData.role === USER_ROLES.OWNER ? 'Owner' : 'Admin'} account created successfully!`, 'success');
      setAddModalOpen(false);
      loadUsers();
    } catch (err) {
      setFormError(err.message || 'Failed to create user.');
    }
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: '', // leave blank to keep unchanged
      role: user.role,
      phone: user.phone || ''
    });
    setFormError('');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Full Name is required.');
      return;
    }
    if (!formData.username.trim()) {
      setFormError('Username is required.');
      return;
    }

    try {
      await apiService.updateUser(selectedUser.id, {
        name: formData.name.trim(),
        username: formData.username.trim(),
        role: formData.role,
        phone: formData.phone.trim(),
        ...(formData.password.trim() ? { password: formData.password.trim() } : {})
      });

      showToast('Account details updated successfully.', 'success');
      setEditModalOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      setFormError(err.message || 'Failed to update user.');
    }
  };

  const handleOpenDelete = (user) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    // Safety check: Cannot delete own logged-in account
    if (currentUser?.id === selectedUser.id || currentUser?.username?.toLowerCase() === selectedUser.username?.toLowerCase()) {
      showToast('You cannot delete your own logged-in account.', 'error');
      setDeleteModalOpen(false);
      return;
    }

    try {
      await apiService.deleteUser(selectedUser.id);
      showToast(`Account "${selectedUser.name}" deleted.`, 'info');
      setDeleteModalOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      showToast(err.message || 'Failed to delete user.', 'error');
    }
  };

  const tabStyle = (active, color = 'var(--primary)') => ({
    padding: '7px 16px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.825rem',
    fontWeight: 600,
    backgroundColor: active ? color : 'var(--surface-alt)',
    color: active ? '#fff' : 'var(--text-secondary)',
    border: '1px solid',
    borderColor: active ? color : 'var(--border)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease'
  });

  return (
    <div>
      <PageHeader
        title="Owner & Admin Accounts"
        subtitle="Manage executive cafe management credentials, owners, and store administrators"
        actions={
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            + Add Owner / Admin
          </Button>
        }
      />

      {/* Role Filter Tabs */}
      <div className="horizontal-scroll-row" style={{ gap: 8, marginBottom: 20 }}>
        {[
          { key: 'ALL', label: `All Accounts (${users.length})` },
          { key: 'OWNER', label: `👑 Owners (${users.filter((u) => u.role === USER_ROLES.OWNER).length})` },
          { key: 'ADMIN', label: `🛡 Admins (${users.filter((u) => u.role === USER_ROLES.ADMIN).length})` }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            style={tabStyle(roleFilter === tab.key)}
            onClick={() => setRoleFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No accounts found"
          description="No Owner or Admin accounts match the selected filter."
        />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Account Holder</th>
                <th>Role & Privileges</th>
                <th>Username</th>
                <th>Contact</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isOwner = u.role === USER_ROLES.OWNER;
                const isSelf =
                  currentUser?.id === u.id ||
                  currentUser?.username?.toLowerCase() === u.username?.toLowerCase();

                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            backgroundColor: isOwner ? 'rgba(124, 58, 237, 0.12)' : 'rgba(14, 165, 233, 0.12)',
                            color: isOwner ? '#7c3aed' : '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.95rem'
                          }}
                        >
                          {isOwner ? <Crown size={20} /> : <Shield size={20} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{u.name}</span>
                            {isSelf && (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '1px 6px',
                                  borderRadius: 'var(--radius-sm)',
                                  backgroundColor: 'var(--success-bg)',
                                  color: 'var(--success)',
                                  border: '1px solid var(--success-border)',
                                  fontWeight: 700
                                }}
                              >
                                You
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                            {isOwner ? 'Full Universal & POS Access' : 'Administrative Access'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          backgroundColor: isOwner ? '#7c3aed' : 'var(--primary)',
                          color: '#fff'
                        }}
                      >
                        {isOwner ? <Crown size={12} /> : <Shield size={12} />}
                        {isOwner ? 'OWNER' : 'ADMIN'}
                      </span>
                    </td>
                    <td>
                      <code
                        style={{
                          backgroundColor: 'var(--surface-alt)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: 'var(--text)'
                        }}
                      >
                        {u.username}
                      </code>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {u.phone ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={13} style={{ opacity: 0.6 }} />
                          {u.phone}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Edit2}
                          onClick={() => handleOpenEdit(u)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          disabled={isSelf}
                          title={isSelf ? 'Cannot delete your own logged-in account' : 'Delete account'}
                          onClick={() => handleOpenDelete(u)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Owner or Admin Account"
        maxWidth="480px"
      >
        <form onSubmit={handleSaveAdd}>
          <div className="modal-body">
            {formError && (
              <div className="form-error" style={{ marginBottom: 14 }}>
                {formError}
              </div>
            )}

            <Select
              label="Account Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={[
                { value: USER_ROLES.ADMIN, label: 'Admin (Dashboard, Products, Sales, Staff, Tables)' },
                { value: USER_ROLES.OWNER, label: 'Owner (All Admin Features + Universal Dine-In POS)' }
              ]}
              required
            />

            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Ananya Sharma"
              required
            />

            <Input
              label="Username (Login ID)"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="e.g. ananya"
              required
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter secure password"
              required
            />

            <Input
              label="Phone Number (Optional)"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. +91 98765 43210"
            />
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Account: ${selectedUser?.name || ''}`}
        maxWidth="480px"
      >
        <form onSubmit={handleSaveEdit}>
          <div className="modal-body">
            {formError && (
              <div className="form-error" style={{ marginBottom: 14 }}>
                {formError}
              </div>
            )}

            <Select
              label="Account Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={[
                { value: USER_ROLES.ADMIN, label: 'Admin (Dashboard, Products, Sales, Staff, Tables)' },
                { value: USER_ROLES.OWNER, label: 'Owner (All Admin Features + Universal Dine-In POS)' }
              ]}
              required
            />

            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <Input
              label="Username (Login ID)"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />

            <Input
              label="New Password (leave blank to keep current)"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter new password if changing"
            />

            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Account Deletion"
        maxWidth="440px"
      >
        <div className="modal-body">
          <p style={{ fontSize: '0.95rem', color: 'var(--text)' }}>
            Are you sure you want to delete the {selectedUser?.role === USER_ROLES.OWNER ? 'Owner' : 'Admin'} account for <strong>{selectedUser?.name}</strong> (<code>{selectedUser?.username}</code>)?
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--danger)', marginTop: 8 }}>
            This account will immediately lose access to the system.
          </p>
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Delete Account
          </Button>
        </div>
      </Modal>
    </div>
  );
};
