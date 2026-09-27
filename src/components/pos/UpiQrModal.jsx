import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  CheckCircle2,
  QrCode,
  Check,
  ShieldCheck,
  Printer,
  Copy,
  ExternalLink,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { formatCurrency } from '../../utils/calculations';
import phonePeStandee from '../../assets/phonepe-qr.jpg';

export const UpiQrModal = ({
  isOpen,
  onClose,
  totalAmount = 0,
  billReference = '',
  customerName = '',
  onPaymentSuccess,
  onPrintBill
}) => {
  const [paymentState, setPaymentState] = useState('PENDING'); // PENDING, SUCCESS
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('dynamic'); // 'dynamic' | 'standee'

  // Atharv Chavan PhonePe Details decoded from merchant standee QR
  const merchantName = 'ATHARV UTTAM CHAVAN';
  const merchantUpiId = '8788671566@ybl';
  const mc = '0000';
  const mode = '02';
  const purpose = '00';

  const amountStr = Number(totalAmount || 0).toFixed(2);
  const noteStr = billReference ? `Bill ${billReference}` : 'Cafe Cozy Order';

  // Dynamic UPI URI pre-populates the exact bill amount
  const dynamicUpiUri = `upi://pay?pa=${merchantUpiId}&pn=${encodeURIComponent(
    merchantName
  )}&mc=${mc}&mode=${mode}&purpose=${purpose}&am=${amountStr}&cu=INR&tn=${encodeURIComponent(noteStr)}`;

  useEffect(() => {
    if (!isOpen) return;
    setPaymentState('PENDING');
    QRCode.toDataURL(dynamicUpiUri, {
      width: 250,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate dynamic QR code', err);
      });
  }, [isOpen, dynamicUpiUri]);

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(merchantUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateSuccess = () => {
    setPaymentState('SUCCESS');
    if (onPaymentSuccess) {
      onPaymentSuccess({
        upiRef: `UPI-TXN-${Date.now().toString().slice(-6)}`,
        merchantUpiId,
        amount: totalAmount
      });
    }
  };

  const handleReset = () => {
    setPaymentState('PENDING');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleReset} title="PhonePe UPI Payment" maxWidth="460px">
      <div className="modal-body" style={{ textAlign: 'center', padding: '16px 20px 24px' }}>
        {paymentState === 'PENDING' ? (
          <div>
            {/* Amount Banner */}
            <div
              style={{
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                marginBottom: 16
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Bill Amount
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#5f259f', lineHeight: 1.2, marginTop: 2 }}>
                {formatCurrency(totalAmount)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Ref: <strong>{billReference || 'Cafe Bill'}</strong> {customerName ? `• ${customerName}` : ''}
              </div>
            </div>

            {/* Mode Switcher Tabs (Dynamic QR vs Original Standee) */}
            <div
              style={{
                display: 'flex',
                background: 'var(--surface-alt)',
                borderRadius: 'var(--radius-sm)',
                padding: '3px',
                marginBottom: 16,
                gap: 4
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('dynamic')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                  backgroundColor: viewMode === 'dynamic' ? '#5f259f' : 'transparent',
                  color: viewMode === 'dynamic' ? '#ffffff' : 'var(--muted)'
                }}
              >
                <Sparkles size={14} />
                <span>Dynamic QR (Auto-Amount)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('standee')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                  backgroundColor: viewMode === 'standee' ? '#5f259f' : 'transparent',
                  color: viewMode === 'standee' ? '#ffffff' : 'var(--muted)'
                }}
              >
                <QrCode size={14} />
                <span>Original Standee</span>
              </button>
            </div>

            {/* PhonePe Branded Card Container */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1.5px solid #e2e8f0',
                boxShadow: '0 8px 24px rgba(95, 37, 159, 0.08)',
                padding: '20px 16px 16px',
                margin: '0 auto 16px',
                maxWidth: '340px'
              }}
            >
              {/* PhonePe Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 6 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    backgroundColor: '#5f259f',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '1.4rem'
                  }}
                >
                  पे
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.02em', lineHeight: 1 }}>
                    PhonePe
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#5f259f', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
                    ACCEPTED HERE
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginBottom: 14 }}>
                Scan &amp; Pay Using PhonePe or Any UPI App
              </div>

              {/* QR Display Area */}
              {viewMode === 'dynamic' ? (
                <div>
                  <div
                    style={{
                      position: 'relative',
                      display: 'inline-block',
                      padding: '10px',
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="PhonePe Dynamic QR Code"
                        style={{ width: '220px', height: '220px', display: 'block' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '220px',
                          height: '220px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#94a3b8'
                        }}
                      >
                        Generating Dynamic QR...
                      </div>
                    )}

                    {/* Centered PhonePe Emblem (Matches uploaded Standee QR) */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '3px solid #ffffff',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                        fontSize: '1.25rem',
                        fontWeight: 900,
                        pointerEvents: 'none'
                      }}
                    >
                      पे
                    </div>
                  </div>

                  {/* Dynamic amount tag attached to QR */}
                  <div style={{ marginTop: 10 }}>
                    <span
                      style={{
                        backgroundColor: '#f3e8ff',
                        color: '#5f259f',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      Prefilled Amount: ₹{amountStr}
                    </span>
                  </div>
                </div>
              ) : (
                /* Original Standee View */
                <div>
                  <div
                    style={{
                      display: 'inline-block',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      maxWidth: '240px'
                    }}
                  >
                    <img
                      src={phonePeStandee}
                      alt="Original PhonePe Standee"
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  </div>
                </div>
              )}

              {/* Merchant Title from Standee */}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.04em' }}>
                  {merchantName}
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 4,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.78rem',
                    color: '#475569',
                    fontWeight: 600
                  }}
                >
                  <span>UPI ID: <strong>{merchantUpiId}</strong></span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    title="Copy UPI ID"
                    style={{
                      border: 'none',
                      background: 'none',
                      color: copied ? '#16a34a' : '#5f259f',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 2
                    }}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Supported UPI Apps Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: '0.78rem',
                color: 'var(--muted)',
                marginBottom: 14
              }}
            >
              <ShieldCheck size={15} color="var(--success)" />
              <span>GPay • PhonePe • Paytm • BHIM • Any UPI App</span>
            </div>

            {/* Mobile direct deep link option (opens UPI intent if on mobile device) */}
            <div style={{ marginBottom: 14 }}>
              <a
                href={dynamicUpiUri}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#5f259f',
                  textDecoration: 'none'
                }}
              >
                <Smartphone size={14} />
                <span>Pay directly via UPI App on this device</span>
                <ExternalLink size={12} />
              </a>
            </div>

            {/* Status Indicator & Payment Received Action */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: '#fef9c3',
                color: '#854d0e',
                fontSize: '0.8rem',
                fontWeight: 700,
                marginBottom: 16
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#ca8a04',
                  animation: 'pulse 1.5s infinite'
                }}
              />
              AWAITING UPI PAYMENT
            </div>

            <Button
              variant="success"
              size="lg"
              icon={Check}
              style={{ width: '100%' }}
              onClick={handleSimulateSuccess}
            >
              Payment Received
            </Button>
          </div>
        ) : (
          /* Payment Successful state */
          <div style={{ padding: '20px 0' }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                backgroundColor: 'var(--success-bg)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <CheckCircle2 size={42} />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
              Payment Successful!
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 8 }}>
              Received {formatCurrency(totalAmount)} via PhonePe UPI
            </p>
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--surface-alt)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                display: 'inline-block',
                marginBottom: 20
              }}
            >
              Merchant: <strong>{merchantName}</strong> ({merchantUpiId})
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Button variant="outline" onClick={handleReset}>
                Done
              </Button>
              {onPrintBill && (
                <Button
                  variant="primary"
                  icon={Printer}
                  onClick={() => {
                    handleReset();
                    onPrintBill();
                  }}
                >
                  Print Bill
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
