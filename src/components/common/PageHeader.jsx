import React from 'react';

export const PageHeader = ({ title, subtitle, children, actions }) => {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {(actions || children) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {actions}
          {children}
        </div>
      )}
    </div>
  );
};
