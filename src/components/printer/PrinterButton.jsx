/**
 * PrinterButton.jsx
 *
 * Reusable Navbar printer button and dropdown manager controller.
 * Displays connection state:
 *   - Disconnected: 🔴 Printer (or short "Printer")
 *   - Connected:    🟢 BT-58 / [Printer Name]
 *
 * Responsive: fits in navbar without overflowing on mobile.
 * When clicked, toggles the PrinterManager panel.
 */

import React, { useState } from 'react';
import { usePrinter } from '../../context/PrinterContext.jsx';
import { PrinterManager } from './PrinterManager.jsx';
import { Printer } from 'lucide-react';

export const PrinterButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { status, printerName } = usePrinter();

  const isConnected = status === 'connected';

  // Format short label for connected printer, e.g. "BT-58"
  const shortPrinterName = printerName
    ? printerName.replace(/^Niyama\s+/i, '').slice(0, 10)
    : 'BT-58';

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="btn btn-outline btn-sm printer-nav-btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 10px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.825rem',
          fontWeight: 600,
          borderColor: isConnected ? 'rgba(34, 197, 94, 0.4)' : 'var(--border)',
          backgroundColor: isConnected ? 'rgba(34, 197, 94, 0.08)' : 'var(--surface)',
          color: isConnected ? 'var(--success)' : 'var(--text)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.15s ease'
        }}
        title={isConnected ? `Printer Connected: ${printerName}` : 'Bluetooth Thermal Printer: Not Connected'}
        aria-label="Bluetooth Printer Connection"
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: isConnected ? '#22c55e' : '#ef4444',
            display: 'inline-block',
            flexShrink: 0
          }}
        />
        <Printer size={15} style={{ flexShrink: 0 }} />
        <span className="printer-btn-text">
          {isConnected ? shortPrinterName : 'Printer'}
        </span>
      </button>

      {isOpen && <PrinterManager onClose={() => setIsOpen(false)} />}
    </div>
  );
};
