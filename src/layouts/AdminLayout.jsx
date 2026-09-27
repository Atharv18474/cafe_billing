import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Package,
  Layers,
  Users,
  Percent,
  Receipt,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Coffee,
  UserCheck,
  ShieldCheck,
  PhoneCall
} from 'lucide-react';
import { PrinterButton } from '../components/printer/PrinterButton';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isOwner = user?.role === 'OWNER';

  const navItems = isOwner
    ? [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Dine-In & POS', path: '/waiter/tables', icon: UtensilsCrossed, badge: 'POS' },
        { label: 'Live Orders', path: '/waiter/orders', icon: Coffee },
        { label: 'Tables Setup', path: '/tables', icon: UtensilsCrossed },
        { label: 'Orders Log', path: '/orders', icon: Receipt },
        { label: 'Products', path: '/products', icon: Package },
        { label: 'Categories', path: '/categories', icon: Layers },
        { label: 'Waiters Staff', path: '/waiters', icon: Users },
        { label: 'Discounts & Combos', path: '/discounts', icon: Percent },
        { label: 'Bills History', path: '/bills', icon: Receipt },
        { label: 'Sales Analytics', path: '/sales', icon: TrendingUp },
        { label: 'Owners & Admins', path: '/owners-admins', icon: ShieldCheck, badge: 'NEW' },
        { label: 'Contact Us', path: '/contact-us', icon: PhoneCall }
      ]
    : [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Tables', path: '/tables', icon: UtensilsCrossed },
        { label: 'Orders', path: '/orders', icon: Receipt },
        { label: 'Products', path: '/products', icon: Package },
        { label: 'Categories', path: '/categories', icon: Layers },
        { label: 'Waiters', path: '/waiters', icon: Users },
        { label: 'Discounts & Combos', path: '/discounts', icon: Percent },
        { label: 'Bills', path: '/bills', icon: Receipt },
        { label: 'Sales', path: '/sales', icon: TrendingUp },
        { label: 'Contact Us', path: '/contact-us', icon: PhoneCall }
      ];

  return (
    <div className="app-layout">
      {/* Mobile Drawer Overlay */}
      <div
        className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Admin Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Coffee size={24} color="#f97316" />
            <span>CAFE COZY</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="sidebar-close-btn"
            style={{ color: '#fff', padding: '4px', borderRadius: '4px' }}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {isOwner && (
            <div style={{ padding: '4px 10px 8px', fontSize: '0.75rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Owner All-Access Portal
            </div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span style={{ fontSize: '0.7rem', padding: '1px 6px', backgroundColor: '#0284c7', color: '#fff', borderRadius: '4px', fontWeight: 700 }}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="nav-link"
            onClick={handleLogout}
            style={{ width: '100%', color: 'var(--danger)', border: 'none', background: 'none' }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Navbar */}
        <header className="navbar no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              className="menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)'
              }}
              aria-label="Toggle navigation drawer"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="navbar-brand">
              <Coffee size={22} color="var(--primary)" />
              <span className="navbar-title-full">
                {isOwner ? 'Cafe Cozy (Owner Management & POS)' : 'Cafe Management System'}
              </span>
              <span className="navbar-title-short">Cafe Cozy</span>
            </div>
          </div>

          <div className="navbar-actions">
            <PrinterButton />
            <div className="user-badge">
              <UserCheck size={16} color="var(--primary)" />
              <span className="hide-on-mobile">{user?.name || 'Admin'}</span>
              <span
                style={{
                  fontSize: '0.75rem',
                  backgroundColor: isOwner ? '#7c3aed' : 'var(--primary)',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700
                }}
              >
                {user?.role || 'ADMIN'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '6px 10px' }}
            >
              <LogOut size={14} />
              <span className="hide-on-mobile">Logout</span>
            </button>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      <style>{`
        .sidebar-close-btn {
          display: none;
        }
        .navbar-title-short {
          display: none;
        }
        @media (min-width: 1025px) {
          .menu-toggle-btn {
            display: none !important;
          }
        }
        @media (max-width: 1024px) {
          .sidebar-close-btn {
            display: flex !important;
          }
        }
        @media (max-width: 640px) {
          .navbar-title-full {
            display: none !important;
          }
          .navbar-title-short {
            display: inline !important;
          }
          .hide-on-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
