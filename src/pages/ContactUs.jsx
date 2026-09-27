import React from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Phone, MessageSquare, Mail, User, HelpCircle, Clock, ShieldCheck, Heart } from 'lucide-react';

export const ContactUs = () => {
  const contactName = "Atharv Chavan";
  const mobileNumber = "8788671566";
  const queryMessage = "For any query contact me";

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <PageHeader
        title="Contact Us"
        subtitle="Developer and system administrator support for Cafe Cozy Management System"
      />

      {/* Main Support Card */}
      <Card style={{ padding: 'clamp(20px, 4vw, 36px)', borderTop: '5px solid var(--primary)', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              fontWeight: 800,
              flexShrink: 0
            }}
          >
            AC
          </div>
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--primary)',
                backgroundColor: 'rgba(234, 88, 12, 0.1)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              System Lead & Developer
            </span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>
              {contactName}
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginTop: 2 }}>
              Lead Technical Contact &amp; System Engineer
            </p>
          </div>
        </div>

        {/* Highlight Note Banner */}
        <div
          style={{
            backgroundColor: 'var(--surface-alt)',
            borderLeft: '4px solid var(--primary)',
            padding: '16px 20px',
            borderRadius: '0 var(--radius-md) var(--radius-md) 0',
            marginBottom: 28
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 700, fontSize: '1rem' }}>
            <HelpCircle size={18} />
            <span>Support Notice</span>
          </div>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginTop: 6, fontStyle: 'italic' }}>
            "{queryMessage}"
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 4 }}>
            Feel free to reach out via direct phone call or WhatsApp message for feature requests, system maintenance, bug fixes, or deployment queries.
          </p>
        </div>

        {/* Quick Contact Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 16 }}>
          {/* Direct Call Button */}
          <a
            href={`tel:${mobileNumber}`}
            style={{ textDecoration: 'none' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '18px 20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                transition: 'all 0.15s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.backgroundColor = 'var(--surface-alt)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.backgroundColor = 'var(--surface)';
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--success-bg)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Phone size={22} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Mobile / Direct Call
                </span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)' }}>
                  +91 {mobileNumber}
                </div>
              </div>
            </div>
          </a>

          {/* WhatsApp Direct Link */}
          <a
            href={`https://wa.me/91${mobileNumber}?text=Hi%20Atharv,%20I%20have%20a%20query%20regarding%20the%20Cafe%20Management%20System.`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '18px 20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                transition: 'all 0.15s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#25D366';
                e.currentTarget.style.backgroundColor = 'var(--surface-alt)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.backgroundColor = 'var(--surface)';
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(37, 211, 102, 0.12)',
                  color: '#25D366',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <MessageSquare size={22} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  WhatsApp Chat
                </span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)' }}>
                  Chat on WhatsApp
                </div>
              </div>
            </div>
          </a>
        </div>
      </Card>

      {/* Additional Details Card */}
      <Card style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>
          Assistance &amp; System Capabilities
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 16 }}>
          <div style={{ padding: '14px', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>
              <ShieldCheck size={18} />
              <span>Roles &amp; Access</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Assistance with adding new Owner, Admin, or Waiter profiles and configuring table allocations.
            </p>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>
              <Clock size={18} />
              <span>Availability</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Standard operational support Monday to Sunday for technical maintenance and queries.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
