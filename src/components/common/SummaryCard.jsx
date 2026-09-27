import React from 'react';
import { Card } from './Card';

export const SummaryCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'primary', // primary, success, warning, info
  trend
}) => {
  const colorMap = {
    primary: { bg: 'var(--primary-light)', text: 'var(--primary)' },
    success: { bg: 'var(--success-bg)', text: 'var(--success)' },
    warning: { bg: 'var(--warning-bg)', text: 'var(--warning)' },
    danger: { bg: 'var(--danger-bg)', text: 'var(--danger)' },
    info: { bg: 'var(--info-bg)', text: 'var(--info)' }
  };

  const currentTheme = colorMap[color] || colorMap.primary;

  return (
    <Card className="summary-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {Icon && (
        <div
          className="kpi-icon"
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-md)',
            backgroundColor: currentTheme.bg,
            color: currentTheme.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Icon size={24} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="kpi-title" style={{ fontSize: '0.825rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </p>
        <p className="kpi-value" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, marginTop: 4 }}>
          {value}
        </p>
        {(subtitle || trend) && (
          <div className="kpi-subtext" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: '0.8rem', color: 'var(--muted)' }}>
            {trend && <span style={{ fontWeight: 600, color: currentTheme.text }}>{trend}</span>}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </div>
    </Card>
  );
};
