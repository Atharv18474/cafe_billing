import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../../services/apiService';
import { PageHeader } from '../../components/common/PageHeader';
import { SummaryCard } from '../../components/common/SummaryCard';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  TrendingUp, Banknote, Smartphone, Percent, Receipt,
  Calendar, ChevronLeft, ChevronRight, ArrowUpDown
} from 'lucide-react';
import { formatCurrency } from '../../utils/calculations';

// ─── Helpers ────────────────────────────────────────────────────────────────

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
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d} ${MONTH_NAMES[parseInt(m, 10) - 1].slice(0, 3)} ${y}`;
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const Sales = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter mode: 'today' | 'date' | 'week' | 'month'
  const [filterMode, setFilterMode] = useState('today');

  // For "date" mode
  const [selectedDate, setSelectedDate] = useState(toYMD(today));

  // For "week" mode — anchor = any date in the week
  const [weekAnchor, setWeekAnchor] = useState(new Date(today));

  // For "month" mode — anchor year/month
  const [monthAnchor, setMonthAnchor] = useState(new Date(today));

  // Derived from/to dates
  const { fromDate, toDate, label } = useMemo(() => {
    if (filterMode === 'today') {
      const d = toYMD(today);
      return { fromDate: d, toDate: d, label: 'Today' };
    }
    if (filterMode === 'date') {
      return {
        fromDate: selectedDate,
        toDate: selectedDate,
        label: formatDate(selectedDate)
      };
    }
    if (filterMode === 'week') {
      const wStart = startOfWeek(weekAnchor);
      const wEnd = endOfWeek(weekAnchor);
      return {
        fromDate: toYMD(wStart),
        toDate: toYMD(wEnd),
        label: `${formatDate(toYMD(wStart))} – ${formatDate(toYMD(wEnd))}`
      };
    }
    if (filterMode === 'month') {
      const mStart = startOfMonth(monthAnchor);
      const mEnd = endOfMonth(monthAnchor);
      return {
        fromDate: toYMD(mStart),
        toDate: toYMD(mEnd),
        label: `${MONTH_NAMES[monthAnchor.getMonth()]} ${monthAnchor.getFullYear()}`
      };
    }
    return { fromDate: null, toDate: null, label: 'All Time' };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMode, selectedDate, weekAnchor, monthAnchor]);

  const [salesData, setSalesData] = useState(null);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const allBills = await apiService.getBills();
        const from = fromDate ? new Date(fromDate + 'T00:00:00') : null;
        const to = toDate ? new Date(toDate + 'T23:59:59') : null;

        const filtered = allBills.filter(b => {
          if (!b.date) return false;
          const billDate = new Date(b.date + 'T00:00:00');
          if (from && billDate < from) return false;
          if (to && billDate > to) return false;
          return true;
        });

        let gross = 0, discount = 0, net = 0, cash = 0, online = 0;
        filtered.forEach(b => {
          gross += Number(b.subtotal || 0);
          discount += Number(b.discountAmount || 0);
          const total = Number(b.finalTotal || b.totalAmount || 0);
          net += total;
          if (b.paymentMethod === 'CASH') cash += total;
          else online += total;
        });

        setSalesData({
          totalBills: filtered.length,
          grossSales: gross,
          discountGiven: discount,
          netSales: net,
          cashSales: cash,
          onlineSales: online,
          bills: filtered.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
        });
      } catch (err) {
        console.error('Failed to load sales:', err);
      }
    };
    fetchSales();
  }, [fromDate, toDate]);

  // Navigation helpers
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

  if (!salesData) return null;

  const cashPercent = salesData.netSales > 0
    ? Math.round((salesData.cashSales / salesData.netSales) * 100)
    : 0;
  const onlinePercent = 100 - cashPercent;

  const tabStyle = (active, color = 'var(--primary)') => ({
    padding: '9px 18px',
    borderRadius: 'var(--radius-full)',
    border: active ? `2px solid ${color}` : '1px solid var(--border)',
    backgroundColor: active ? color : 'var(--surface)',
    color: active ? '#fff' : 'var(--text-secondary)',
    fontWeight: 700,
    fontSize: '0.875rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease'
  });

  const navBtnStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
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
        title="Sales & Revenue Analytics"
        subtitle="Filter by date, week, or month to review revenue, discounts, and payment methods"
      />

      {/* ── Filter Bar ── */}
      <Card style={{ marginBottom: 20 }}>
        {/* Mode tabs */}
        <div
          className="horizontal-scroll-row"
          style={{ gap: 8, marginBottom: filterMode !== 'today' ? 14 : 0 }}
        >
          {[
            { key: 'today', label: '📅 Today' },
            { key: 'date', label: '🗓 Specific Date' },
            { key: 'week', label: '📆 This Week' },
            { key: 'month', label: '🗃 This Month' },
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              style={tabStyle(filterMode === tab.key)}
              onClick={() => setFilterMode(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date picker (specific date) */}
        {filterMode === 'date' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>
              Select Date:
            </label>
            <input
              type="date"
              value={selectedDate}
              max={toYMD(today)}
              onChange={e => setSelectedDate(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
                background: 'var(--surface)',
                color: 'var(--text)',
                cursor: 'pointer'
              }}
            />
          </div>
        )}

        {/* Week navigator */}
        {filterMode === 'week' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" style={navBtnStyle} onClick={prevWeek}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>
              {formatDateShort(toYMD(startOfWeek(weekAnchor)))} – {formatDateShort(toYMD(endOfWeek(weekAnchor)))}
            </span>
            <button
              type="button"
              style={{ ...navBtnStyle, opacity: new Date(endOfWeek(weekAnchor)) >= today ? 0.4 : 1, cursor: new Date(endOfWeek(weekAnchor)) >= today ? 'not-allowed' : 'pointer' }}
              onClick={() => { if (new Date(endOfWeek(weekAnchor)) < today) nextWeek(); }}
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              style={{ ...tabStyle(false), padding: '5px 12px', fontSize: '0.8rem' }}
              onClick={() => setWeekAnchor(new Date(today))}
            >
              Current Week
            </button>
          </div>
        )}

        {/* Month navigator */}
        {filterMode === 'month' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" style={navBtnStyle} onClick={prevMonth}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', minWidth: 130, textAlign: 'center' }}>
              {MONTH_NAMES[monthAnchor.getMonth()]} {monthAnchor.getFullYear()}
            </span>
            <button
              type="button"
              style={{ ...navBtnStyle, opacity: monthAnchor >= startOfMonth(today) ? 0.4 : 1, cursor: monthAnchor >= startOfMonth(today) ? 'not-allowed' : 'pointer' }}
              onClick={() => { if (monthAnchor < startOfMonth(today)) nextMonth(); }}
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              style={{ ...tabStyle(false), padding: '5px 12px', fontSize: '0.8rem' }}
              onClick={() => setMonthAnchor(new Date(today))}
            >
              Current Month
            </button>
          </div>
        )}
      </Card>

      {/* ── Reporting Period Label ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 18,
        color: 'var(--muted)',
        fontSize: '0.875rem'
      }}>
        <Calendar size={15} />
        <span>Showing results for: <strong style={{ color: 'var(--text)' }}>{label}</strong></span>
        {salesData.totalBills === 0 && (
          <span style={{
            marginLeft: 8,
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--warning-bg)',
            color: 'var(--warning)',
            fontSize: '0.8rem',
            fontWeight: 600,
            border: '1px solid var(--warning-border)'
          }}>
            No data for this period
          </span>
        )}
      </div>

      {/* ── KPI Cards ── */}
      <div className="dashboard-kpi-grid" style={{ marginBottom: 24 }}>
        <SummaryCard
          title="Gross Sales"
          value={formatCurrency(salesData.grossSales)}
          subtitle="Pre-discount billing"
          icon={TrendingUp}
          color="primary"
        />
        <SummaryCard
          title="Discounts Given"
          value={formatCurrency(salesData.discountGiven)}
          subtitle="Promotional reductions"
          icon={Percent}
          color="warning"
        />
        <SummaryCard
          title="Net Sales"
          value={formatCurrency(salesData.netSales)}
          subtitle="Total realized revenue"
          icon={TrendingUp}
          color="success"
        />
        <SummaryCard
          title="Total Bills"
          value={salesData.totalBills}
          subtitle="Invoices generated"
          icon={Receipt}
          color="info"
        />
      </div>

      {/* ── Payment Split + Summary ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: 20,
          marginBottom: 24
        }}
      >
        <Card>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            Payment Method Split
          </h3>

          {salesData.netSales === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: '0.875rem', textAlign: 'center', padding: '20px 0' }}>
              No sales data for this period
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.9rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--success)' }}>
                    <Banknote size={16} /> Cash Sales ({cashPercent}%)
                  </span>
                  <span style={{ fontWeight: 700 }}>{formatCurrency(salesData.cashSales)}</span>
                </div>
                <div style={{ width: '100%', height: 10, backgroundColor: 'var(--surface-alt)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: `${cashPercent}%`, height: '100%', backgroundColor: 'var(--success)', borderRadius: 5, transition: 'width 0.4s ease' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.9rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--info)' }}>
                    <Smartphone size={16} /> Online / UPI ({onlinePercent}%)
                  </span>
                  <span style={{ fontWeight: 700 }}>{formatCurrency(salesData.onlineSales)}</span>
                </div>
                <div style={{ width: '100%', height: 10, backgroundColor: 'var(--surface-alt)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: `${onlinePercent}%`, height: '100%', backgroundColor: 'var(--info)', borderRadius: 5, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 20, padding: 14, backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Average Ticket Size:{' '}
            <strong>
              {formatCurrency(salesData.totalBills > 0 ? Math.round(salesData.netSales / salesData.totalBills) : 0)}
            </strong>{' '}
            per completed bill.
          </div>
        </Card>

        <Card>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            Period Financial Summary
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Gross Billed Amount:</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(salesData.grossSales)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--danger)' }}>
              <span>Discounts & Promotions:</span>
              <span style={{ fontWeight: 600 }}>- {formatCurrency(salesData.discountGiven)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, borderTop: '2px solid var(--border)', paddingTop: 10, color: 'var(--primary)' }}>
              <span>Net Collected Sales:</span>
              <span>{formatCurrency(salesData.netSales)}</span>
            </div>

            <div style={{ borderTop: '1px dashed var(--border)', marginTop: 8, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--muted)' }}>
              <span>Total Bills Count:</span>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{salesData.totalBills} Bills</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--muted)' }}>
              <span>Cash Collections:</span>
              <span style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(salesData.cashSales)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--muted)' }}>
              <span>Online (UPI) Collections:</span>
              <span style={{ fontWeight: 600, color: 'var(--info)' }}>{formatCurrency(salesData.onlineSales)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Bill-wise Breakdown Table ── */}
      {salesData.bills && salesData.bills.length > 0 && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
                Bill-wise Breakdown
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--muted)', marginTop: 2 }}>
                {salesData.bills.length} bill{salesData.bills.length !== 1 ? 's' : ''} in this period
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--muted)' }}>
              <ArrowUpDown size={14} />
              Sorted by newest first
            </div>
          </div>

          <div className="data-table-container" style={{ marginTop: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bill No.</th>
                  <th>Date & Time</th>
                  <th>Table</th>
                  <th>Customer</th>
                  <th>Waiter</th>
                  <th>Gross</th>
                  <th>Discount</th>
                  <th>Net Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {salesData.bills.map((bill) => (
                  <tr key={bill.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                      {bill.billNumber}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                      <div>{formatDate(bill.date)}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{bill.time}</div>
                    </td>
                    <td>Table {bill.tableNumber}</td>
                    <td>{bill.customerName}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{bill.waiterName}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(bill.subtotal)}</td>
                    <td style={{ color: bill.discountAmount > 0 ? 'var(--danger)' : 'var(--muted)', fontWeight: bill.discountAmount > 0 ? 600 : 400 }}>
                      {bill.discountAmount > 0 ? `- ${formatCurrency(bill.discountAmount)}` : '—'}
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--success)' }}>
                      {formatCurrency(bill.finalTotal)}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: bill.paymentMethod === 'CASH' ? 'var(--success-bg)' : 'var(--info-bg)',
                        color: bill.paymentMethod === 'CASH' ? 'var(--success)' : 'var(--info)',
                        border: `1px solid ${bill.paymentMethod === 'CASH' ? 'var(--success-border)' : 'var(--info-border)'}`,
                        whiteSpace: 'nowrap'
                      }}>
                        {bill.paymentMethod === 'CASH' ? <Banknote size={12} /> : <Smartphone size={12} />}
                        {bill.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={bill.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: 'var(--surface-alt)' }}>
                  <td colSpan={5} style={{ fontWeight: 700, color: 'var(--text)', padding: '12px 16px' }}>
                    Period Total
                  </td>
                  <td style={{ fontWeight: 700, padding: '12px 16px' }}>
                    {formatCurrency(salesData.grossSales)}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--danger)', padding: '12px 16px' }}>
                    {salesData.discountGiven > 0 ? `- ${formatCurrency(salesData.discountGiven)}` : '—'}
                  </td>
                  <td style={{ fontWeight: 800, color: 'var(--primary)', padding: '12px 16px', fontSize: '1rem' }}>
                    {formatCurrency(salesData.netSales)}
                  </td>
                  <td colSpan={2} style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--muted)' }}>
                    💵 {formatCurrency(salesData.cashSales)} &nbsp; | &nbsp; 📱 {formatCurrency(salesData.onlineSales)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
