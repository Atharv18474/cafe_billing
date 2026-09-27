import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../../services/apiService';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { Card } from '../../components/common/Card';
import { ThermalBill } from '../../components/print/ThermalBill';
import { EmptyState } from '../../components/common/EmptyState';
import { Receipt, Eye, Printer, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatCurrency, formatDateOnly } from '../../utils/calculations';

// ── Date Helpers ──
const toYMD = (d) => d.toISOString().slice(0, 10); // 'YYYY-MM-DD'

const startOfWeek = (d) => {
  const dt = new Date(d);
  const day = dt.getDay(); // 0=Sun
  dt.setDate(dt.getDate() - day);
  return dt;
};

const endOfWeek = (d) => {
  const dt = new Date(d);
  const day = dt.getDay();
  dt.setDate(dt.getDate() + (6 - day));
  return dt;
};

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

export const Bills = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [bills, setBills] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [selectedBill, setSelectedBill] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Date Filter Modes: 'ALL' | 'TODAY' | 'DATE' | 'WEEK' | 'MONTH'
  const [dateFilterMode, setDateFilterMode] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(toYMD(today));
  const [weekAnchor, setWeekAnchor] = useState(new Date(today));
  const [monthAnchor, setMonthAnchor] = useState(new Date(today));

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      const data = await apiService.getBills();
      setBills(data);
    } catch (err) {
      console.error('Failed to load bills:', err);
    }
  };

  // Compute active date boundaries
  const { fromDate, toDate, dateFilterLabel } = useMemo(() => {
    if (dateFilterMode === 'TODAY') {
      const d = toYMD(today);
      return { fromDate: d, toDate: d, dateFilterLabel: 'Today' };
    }
    if (dateFilterMode === 'DATE') {
      return {
        fromDate: selectedDate,
        toDate: selectedDate,
        dateFilterLabel: formatDateShort(selectedDate)
      };
    }
    if (dateFilterMode === 'WEEK') {
      const wStart = startOfWeek(weekAnchor);
      const wEnd = endOfWeek(weekAnchor);
      return {
        fromDate: toYMD(wStart),
        toDate: toYMD(wEnd),
        dateFilterLabel: `${formatDateShort(toYMD(wStart))} – ${formatDateShort(toYMD(wEnd))}`
      };
    }
    if (dateFilterMode === 'MONTH') {
      const mStart = startOfMonth(monthAnchor);
      const mEnd = endOfMonth(monthAnchor);
      return {
        fromDate: toYMD(mStart),
        toDate: toYMD(mEnd),
        dateFilterLabel: `${MONTH_NAMES[monthAnchor.getMonth()]} ${monthAnchor.getFullYear()}`
      };
    }
    return { fromDate: null, toDate: null, dateFilterLabel: 'All Dates' };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilterMode, selectedDate, weekAnchor, monthAnchor]);

  const filteredBills = bills.filter((b) => {
    // 1. Search Query filter
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      b.billNumber.toLowerCase().includes(q) ||
      (b.customerName && b.customerName.toLowerCase().includes(q)) ||
      String(b.tableNumber).includes(q) ||
      (b.waiterName && b.waiterName.toLowerCase().includes(q));

    // 2. Payment Method filter
    const matchesPayment = paymentFilter === 'ALL' || b.paymentMethod === paymentFilter;

    // 3. Date Range filter
    let matchesDate = true;
    if (fromDate && toDate) {
      if (!b.date) {
        matchesDate = false;
      } else {
        matchesDate = b.date >= fromDate && b.date <= toDate;
      }
    }

    return matchesSearch && matchesPayment && matchesDate;
  });

  const handleOpenReceipt = (bill) => {
    setSelectedBill(bill);
    setModalOpen(true);
  };

  const handleDirectPrint = (bill) => {
    setSelectedBill(bill);
    setModalOpen(true);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Nav helpers for week/month
  const prevWeek = () => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() - 7);
    setWeekAnchor(d);
  };
  const nextWeek = () => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() + 7);
    setWeekAnchor(d);
  };
  const prevMonth = () => {
    const d = new Date(monthAnchor);
    d.setMonth(d.getMonth() - 1);
    setMonthAnchor(d);
  };
  const nextMonth = () => {
    const d = new Date(monthAnchor);
    d.setMonth(d.getMonth() + 1);
    setMonthAnchor(d);
  };

  const dateTabStyle = (active, color = 'var(--primary)') => ({
    padding: '6px 14px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.8rem',
    fontWeight: 600,
    backgroundColor: active ? color : 'var(--surface-alt)',
    color: active ? '#fff' : 'var(--text-secondary)',
    border: '1px solid',
    borderColor: active ? color : 'var(--border)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease'
  });

  const navBtnStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    cursor: 'pointer',
    color: 'var(--text)',
    flexShrink: 0
  };

  return (
    <div>
      <PageHeader
        title="Bills & Invoices"
        subtitle="Historical customer bills, date & payment filters, and thermal receipt reprints"
      />

      {/* Date Filter & Control Panel */}
      <Card style={{ marginBottom: 20, padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: dateFilterMode !== 'ALL' && dateFilterMode !== 'TODAY' ? 14 : 0 }}>
          {/* Mode Tabs */}
          <div className="horizontal-scroll-row" style={{ gap: 8 }}>
            {[
              { key: 'ALL', label: 'All History' },
              { key: 'TODAY', label: '📅 Today' },
              { key: 'DATE', label: '🗓 Specific Date' },
              { key: 'WEEK', label: '📆 Week' },
              { key: 'MONTH', label: '🗃 Month' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                style={dateTabStyle(dateFilterMode === tab.key)}
                onClick={() => setDateFilterMode(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active Date Label & Reset */}
          {dateFilterMode !== 'ALL' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.825rem', color: 'var(--muted)' }}>
              <Calendar size={14} color="var(--primary)" />
              <span>Filter: <strong style={{ color: 'var(--text)' }}>{dateFilterLabel}</strong></span>
              <button
                type="button"
                onClick={() => setDateFilterMode('ALL')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: '0.75rem',
                  color: 'var(--danger)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 6px'
                }}
              >
                <X size={12} /> Clear
              </button>
            </div>
          )}
        </div>

        {/* Date Mode Input Controls */}
        {dateFilterMode === 'DATE' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px dashed var(--border)' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Select Date:
            </label>
            <input
              type="date"
              value={selectedDate}
              max={toYMD(today)}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                background: 'var(--surface)',
                color: 'var(--text)',
                cursor: 'pointer'
              }}
            />
          </div>
        )}

        {/* Week Mode Controls */}
        {dateFilterMode === 'WEEK' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px dashed var(--border)' }}>
            <button type="button" style={navBtnStyle} onClick={prevWeek}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
              {formatDateShort(toYMD(startOfWeek(weekAnchor)))} – {formatDateShort(toYMD(endOfWeek(weekAnchor)))}
            </span>
            <button
              type="button"
              style={{
                ...navBtnStyle,
                opacity: new Date(endOfWeek(weekAnchor)) >= today ? 0.4 : 1,
                cursor: new Date(endOfWeek(weekAnchor)) >= today ? 'not-allowed' : 'pointer'
              }}
              onClick={() => {
                if (new Date(endOfWeek(weekAnchor)) < today) nextWeek();
              }}
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              style={{ ...dateTabStyle(false), padding: '4px 10px', fontSize: '0.75rem' }}
              onClick={() => setWeekAnchor(new Date(today))}
            >
              Current Week
            </button>
          </div>
        )}

        {/* Month Mode Controls */}
        {dateFilterMode === 'MONTH' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px dashed var(--border)' }}>
            <button type="button" style={navBtnStyle} onClick={prevMonth}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', minWidth: 120, textAlign: 'center' }}>
              {MONTH_NAMES[monthAnchor.getMonth()]} {monthAnchor.getFullYear()}
            </span>
            <button
              type="button"
              style={{
                ...navBtnStyle,
                opacity: monthAnchor >= startOfMonth(today) ? 0.4 : 1,
                cursor: monthAnchor >= startOfMonth(today) ? 'not-allowed' : 'pointer'
              }}
              onClick={() => {
                if (monthAnchor < startOfMonth(today)) nextMonth();
              }}
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              style={{ ...dateTabStyle(false), padding: '4px 10px', fontSize: '0.75rem' }}
              onClick={() => setMonthAnchor(new Date(today))}
            >
              Current Month
            </button>
          </div>
        )}
      </Card>

      {/* Filter and Search Bar */}
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
          placeholder="Search by bill #, table, customer..."
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {['ALL', 'CASH', 'ONLINE'].map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentFilter(method)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: paymentFilter === method ? 'var(--primary)' : 'var(--surface-alt)',
                color: paymentFilter === method ? '#fff' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: paymentFilter === method ? 'var(--primary)' : 'var(--border)'
              }}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {filteredBills.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No bills found"
          description="There are no completed bills matching your search and date filters."
          actionLabel={dateFilterMode !== 'ALL' ? 'Reset Date Filter' : undefined}
          onAction={dateFilterMode !== 'ALL' ? () => setDateFilterMode('ALL') : undefined}
        />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bill No.</th>
                <th>Date</th>
                <th>Time</th>
                <th>Table</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill) => (
                <tr key={bill.id}>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{bill.billNumber}</td>
                  <td>{bill.date}</td>
                  <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{bill.time}</td>
                  <td>Table {bill.tableNumber}</td>
                  <td>{bill.customerName || 'Walk-in'}</td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(bill.finalTotal)}</td>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        backgroundColor: bill.paymentMethod === 'CASH' ? 'var(--success-bg)' : 'var(--info-bg)',
                        color: bill.paymentMethod === 'CASH' ? 'var(--success)' : 'var(--info)'
                      }}
                    >
                      {bill.paymentMethod}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={bill.paymentStatus} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        onClick={() => handleOpenReceipt(bill)}
                      >
                        View
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Printer}
                        onClick={() => handleDirectPrint(bill)}
                      >
                        Print
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Printable Thermal Receipt Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Printable Thermal Bill Preview"
        maxWidth="460px"
      >
        <div className="modal-body">
          {selectedBill && (
            <ThermalBill
              bill={selectedBill}
              onBack={() => setModalOpen(false)}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};
