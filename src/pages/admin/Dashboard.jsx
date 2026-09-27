import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { PageHeader } from '../../components/common/PageHeader';
import { SummaryCard } from '../../components/common/SummaryCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ThermalBill } from '../../components/print/ThermalBill';
import {
  TrendingUp,
  Receipt,
  Banknote,
  Smartphone,
  Percent,
  Coffee,
  CheckCircle,
  Eye,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/calculations';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [billModalOpen, setBillModalOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [bills, tables] = await Promise.all([
        apiService.getBills(),
        apiService.getTables()
      ]);

      const dynamicBillsCount = bills.length;
      let dynamicGross = 0;
      let dynamicDiscount = 0;
      let dynamicNet = 0;
      let dynamicCash = 0;
      let dynamicOnline = 0;

      bills.forEach(b => {
        dynamicGross += Number(b.subtotal || 0);
        dynamicDiscount += Number(b.discountAmount || 0);
        const billTotal = Number(b.finalTotal || b.totalAmount || 0);
        dynamicNet += billTotal;
        if (b.paymentMethod === 'CASH') {
          dynamicCash += billTotal;
        } else {
          dynamicOnline += billTotal;
        }
      });

      const occupiedTables = tables.filter(t => t.status === 'OCCUPIED').length;
      const availableTables = tables.filter(t => t.status === 'AVAILABLE').length;
      const billingTables = tables.filter(t => t.status === 'BILLING').length;
      const paymentPendingTables = tables.filter(t => t.status === 'PAYMENT_PENDING').length;

      setSalesData({
        todaySales: dynamicNet,
        totalBills: dynamicBillsCount,
        cashSales: dynamicCash,
        onlineSales: dynamicOnline,
        discountGiven: dynamicDiscount,
        grossSales: dynamicGross,
        netSales: dynamicNet,
        occupiedTables,
        availableTables,
        billingTables,
        paymentPendingTables,
        totalTables: tables.length,
        recentBills: bills.slice(0, 10)
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    setBillModalOpen(true);
  };

  if (!salesData) return null;

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Real-time cafe operations, daily revenue KPIs, and live table status"
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={() => navigate('/sales')}>
              View Detailed Sales
            </Button>
            <Button variant="primary" onClick={() => navigate('/tables')}>
              Manage Tables
            </Button>
          </div>
        }
      />

      {/* Top KPI Cards (Section 16 & 9) */}
      <div
        className="dashboard-kpi-grid"
        style={{ marginBottom: 24 }}
      >
        <SummaryCard
          title="Today's Sales"
          value={formatCurrency(salesData.todaySales)}
          subtitle="Net revenue today"
          icon={TrendingUp}
          color="primary"
        />
        <SummaryCard
          title="Total Bills"
          value={salesData.totalBills}
          subtitle="Completed receipts"
          icon={Receipt}
          color="info"
        />
        <SummaryCard
          title="Cash Sales"
          value={formatCurrency(salesData.cashSales)}
          subtitle="Physical cash"
          icon={Banknote}
          color="success"
        />
        <SummaryCard
          title="Online Sales"
          value={formatCurrency(salesData.onlineSales)}
          subtitle="UPI & cards"
          icon={Smartphone}
          color="info"
        />
        <SummaryCard
          title="Discount Given"
          value={formatCurrency(salesData.discountGiven)}
          subtitle="Promotions & lunch special"
          icon={Percent}
          color="warning"
        />
        <SummaryCard
          title="Occupied Tables"
          value={salesData.occupiedTables}
          subtitle="Currently seated"
          icon={Coffee}
          color="warning"
        />
        <SummaryCard
          title="Available Tables"
          value={salesData.availableTables}
          subtitle="Ready for guests"
          icon={CheckCircle}
          color="success"
        />
      </div>

      {/* 2-Column Section: Today's Sales Summary & Table Status Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
          marginBottom: 24
        }}
      >
        {/* Section 17: Today's Sales Summary */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
              Today's Sales Summary
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={14} /> Live Mock Calculation
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Gross Sales</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(salesData.grossSales)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--danger)' }}>
              <span>Discounts</span>
              <span style={{ fontWeight: 600 }}>- {formatCurrency(salesData.discountGiven)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 700, borderTop: '1px dashed var(--border)', paddingTop: 10, color: 'var(--primary)' }}>
              <span>Net Sales</span>
              <span>{formatCurrency(salesData.netSales)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Banknote size={16} color="var(--success)" /> Cash
              </span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(salesData.cashSales)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Smartphone size={16} color="var(--info)" /> Online (UPI)
              </span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(salesData.onlineSales)}</span>
            </div>
          </div>
        </Card>

        {/* Section 19: Table Status Summary */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
              Table Status Summary
            </h3>
            <Button variant="outline" size="sm" onClick={() => navigate('/tables')}>
              View All Tables
            </Button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 12
            }}
          >
            <div style={{ backgroundColor: 'var(--success-bg)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--success-border)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase' }}>
                Available
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)', marginTop: 4 }}>
                {salesData.availableTables}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Ready for seating</span>
            </div>

            <div style={{ backgroundColor: 'var(--warning-bg)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--warning-border)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase' }}>
                Occupied
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--warning)', marginTop: 4 }}>
                {salesData.occupiedTables}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Guests dining</span>
            </div>

            <div style={{ backgroundColor: 'var(--info-bg)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--info-border)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--info)', textTransform: 'uppercase' }}>
                Billing
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--info)', marginTop: 4 }}>
                {salesData.billingTables}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Bill requested</span>
            </div>

            <div style={{ backgroundColor: '#fef9c3', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid #fde047' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#854d0e', textTransform: 'uppercase' }}>
                Payment Pending
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#854d0e', marginTop: 4 }}>
                {salesData.paymentPendingTables || 0}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Awaiting settlement</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Section 18: Recent Bills Table */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
              Recent Bills
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--muted)' }}>
              Completed customer transactions with print previews
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/bills')}>
            View All Bills
          </Button>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bill No.</th>
                <th>Table</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {salesData.recentBills.map((bill) => (
                <tr key={bill.id}>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{bill.billNumber}</td>
                  <td>Table {bill.tableNumber}</td>
                  <td>{bill.customerName}</td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(bill.finalTotal)}</td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
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
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Eye}
                      onClick={() => handleViewBill(bill)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bill Preview Modal */}
      <Modal
        isOpen={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        title="Thermal Receipt Preview"
        maxWidth="440px"
      >
        <div className="modal-body">
          {selectedBill && (
            <ThermalBill
              bill={selectedBill}
              onBack={() => setBillModalOpen(false)}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};
