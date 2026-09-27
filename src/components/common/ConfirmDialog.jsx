import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  children
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="480px">
      <div className="modal-body" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div
          style={{
            padding: 10,
            borderRadius: '50%',
            backgroundColor: danger ? 'var(--danger-bg)' : 'var(--warning-bg)',
            color: danger ? 'var(--danger)' : 'var(--warning)',
            flexShrink: 0
          }}
        >
          <AlertTriangle size={24} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {message && (
            <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: children ? 12 : 0 }}>
              {message}
            </p>
          )}
          {children}
        </div>
      </div>
      <div className="modal-footer">
        <Button variant="secondary" onClick={onClose}>
          {cancelText}
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};
