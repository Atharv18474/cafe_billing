import React from 'react';

export const StatusBadge = ({ status, className = '' }) => {
  if (!status) return null;

  const normalized = String(status).toLowerCase().replace(/\s+/g, '_');

  return (
    <span className={`status-badge ${normalized} ${className}`}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: 'currentColor'
        }}
      />
      {status}
    </span>
  );
};
