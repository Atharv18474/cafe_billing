/**
 * PrinterManager.jsx
 *
 * Full Bluetooth Printer management panel (modal/dropdown).
 * Opened when the user clicks the PrinterButton in the Navbar.
 *
 * Handles:
 *   - Scan for printers (Web Bluetooth picker or mock)
 *   - Show discovered printers
 *   - Connect / Disconnect
 *   - Test Print
 *   - Error display
 *   - Mock mode indicator
 *
 * Does NOT contain billing logic.
 * Does NOT contain ESC/POS formatting.
 */

import React, { useRef, useEffect } from 'react';
import { usePrinter } from '../../context/PrinterContext.jsx';
import {
  Bluetooth,
  PrinterIcon,
  Wifi,
  WifiOff,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  X,
  Zap,
  TriangleAlert
} from 'lucide-react';

// Re-use icon from lucide — "Printer" is imported as PrinterIcon to avoid conflict
// (lucide exports it as "Printer")

export const PrinterManager = ({ onClose }) => {
  const {
    status,
    printerName,
    discoveredPrinters,
    error,
    isMockTransport,
    scan,
    connect,
    disconnect,
    testPrint,
  } = usePrinter();

  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // ─── Status helpers ──────────────────────────────────────────────────────────
  const isConnected   = status === 'connected';
  const isConnecting  = status === 'connecting';
  const isScanning    = status === 'scanning';
  const isPrinting    = status === 'printing';
  const isError       = status === 'error';
  const isBusy        = isScanning || isConnecting || isPrinting;

  // ─── Handle test print with toast-like feedback ──────────────────────────────
  const [testResult, setTestResult] = React.useState('');
  const handleTestPrint = async () => {
    setTestResult('');
    const result = await testPrint();
    setTestResult(result.message);
    setTimeout(() => setTestResult(''), 4000);
  };

  // ─── Styles ──────────────────────────────────────────────────────────────────
  const panelStyle = {
    position: 'fixed',
    top: '64px',
    right: '12px',
    zIndex: 9999,
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    width: 'min(360px, calc(100vw - 24px))',
    maxHeight: 'calc(100vh - 80px)',
    overflowY: 'auto',
    padding: '0',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px 12px',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    backgroundColor: 'var(--surface)',
    zIndex: 1,
  };

  const bodyStyle = { padding: '16px' };

  const statusDotStyle = (color) => ({
    width: 10,
    height: 10,
    borderRadius: '50%',
    backgroundColor: color,
    flexShrink: 0,
    display: 'inline-block',
  });

  const statusColor = isConnected ? '#22c55e' : isError ? '#ef4444' : '#f59e0b';
  const statusLabel =
    isConnected  ? `Connected — ${printerName}` :
    isConnecting ? 'Connecting...' :
    isScanning   ? 'Scanning...' :
    isPrinting   ? 'Printing...' :
    isError      ? 'Connection Error' :
    printerName  ? `Not Connected (Last: ${printerName})` :
    'Not Connected';

  const btnBase = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 14px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    justifyContent: 'center',
    border: '1px solid var(--border)',
    transition: 'all 0.15s ease',
  };

  const primaryBtn = {
    ...btnBase,
    backgroundColor: 'var(--primary)',
    color: '#fff',
    border: 'none',
  };

  const outlineBtn = {
    ...btnBase,
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
  };

  const dangerBtn = {
    ...btnBase,
    backgroundColor: 'transparent',
    color: 'var(--danger)',
    border: '1px solid var(--danger)',
  };

  const disabledStyle = { opacity: 0.5, cursor: 'not-allowed' };

  return (
    <div ref={panelRef} style={panelStyle} role="dialog" aria-label="Bluetooth Printer Manager">

      {/* ── Header ── */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bluetooth size={18} color="var(--primary)" />
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
            Bluetooth Printer
          </span>
          {isMockTransport && (
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fde68a',
              whiteSpace: 'nowrap',
            }}>
              DEV MOCK
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', color: 'var(--muted)', cursor: 'pointer', background: 'none', border: 'none', padding: 4 }}
          aria-label="Close printer panel"
        >
          <X size={18} />
        </button>
      </div>

      <div style={bodyStyle}>

        {/* ── Status Row ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: isConnected ? 'rgba(34,197,94,0.08)' : isError ? 'rgba(239,68,68,0.08)' : 'var(--surface-alt)',
          border: `1px solid ${isConnected ? 'rgba(34,197,94,0.25)' : isError ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`,
          marginBottom: 14,
        }}>
          {(isScanning || isConnecting || isPrinting)
            ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)', flexShrink: 0 }} />
            : <span style={statusDotStyle(statusColor)} />
          }
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', flex: 1, wordBreak: 'break-word' }}>
            {statusLabel}
          </span>
        </div>

        {/* ── Error Message ── */}
        {isError && error && (
          <div style={{
            display: 'flex',
            gap: 8,
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.25)',
            marginBottom: 14,
            fontSize: '0.825rem',
            color: '#b91c1c',
          }}>
            <XCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ wordBreak: 'break-word' }}>{error}</span>
          </div>
        )}

        {/* ── Mock Transport Warning ── */}
        {isMockTransport && (
          <div style={{
            display: 'flex',
            gap: 8,
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#fef3c7',
            border: '1px solid #fde68a',
            marginBottom: 14,
            fontSize: '0.8rem',
            color: '#78350f',
          }}>
            <TriangleAlert size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>Development Mock Mode.</strong> Web Bluetooth is not available in this browser.
              To print on a real Niyama BT-58, open this app in <strong>Chrome on Android</strong> via HTTPS or localhost.
            </span>
          </div>
        )}

        {/* ── Connected view ── */}
        {isConnected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.2)',
            }}>
              <CheckCircle2 size={20} color="#22c55e" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>{printerName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>58mm Thermal Printer • Connected</div>
              </div>
            </div>

            {testResult && (
              <div style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-alt)',
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
                textAlign: 'center',
              }}>
                {testResult}
              </div>
            )}

            <button
              type="button"
              style={isPrinting ? { ...primaryBtn, ...disabledStyle } : primaryBtn}
              disabled={isPrinting}
              onClick={handleTestPrint}
            >
              {isPrinting
                ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Printing…</>
                : <><Zap size={15} /> Test Print</>
              }
            </button>

            <button
              type="button"
              style={dangerBtn}
              onClick={disconnect}
              disabled={isBusy}
            >
              <WifiOff size={15} /> Disconnect
            </button>
          </div>
        ) : (
          /* ── Disconnected / Scan view ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Scan button */}
            <button
              type="button"
              style={isBusy ? { ...primaryBtn, ...disabledStyle } : primaryBtn}
              disabled={isBusy}
              onClick={scan}
            >
              {isScanning
                ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Scanning…</>
                : <><RefreshCw size={15} /> Scan for Printers</>
              }
            </button>

            {/* Discovered printers list */}
            {discoveredPrinters.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, marginTop: 4 }}>
                  Available Printers
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {discoveredPrinters.map((printer) => (
                    <div
                      key={printer.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                      }}
                    >
                      <PrinterIcon size={20} color="var(--primary)" style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', wordBreak: 'break-word' }}>
                          {printer.name}
                          {printer.isMock && (
                            <span style={{ fontSize: '0.7rem', color: '#92400e', marginLeft: 6 }}>(Mock)</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                          Bluetooth Thermal Printer
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => connect(printer)}
                        disabled={isConnecting}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          backgroundColor: 'var(--primary)',
                          color: '#fff',
                          border: 'none',
                          cursor: isConnecting ? 'not-allowed' : 'pointer',
                          opacity: isConnecting ? 0.6 : 1,
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isConnecting ? 'Connecting…' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No printers found hint */}
            {!isScanning && discoveredPrinters.length === 0 && !isError && (
              <div style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-alt)',
                fontSize: '0.825rem',
                color: 'var(--muted)',
                textAlign: 'center',
                lineHeight: 1.6,
              }}>
                <PrinterIcon size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
                Click <strong>Scan for Printers</strong> to discover nearby Bluetooth printers.
                <br />
                Make sure the Niyama BT-58 is <strong>powered on</strong> and in range.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Spin animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
