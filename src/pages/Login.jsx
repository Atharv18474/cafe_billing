import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiService } from '../services/apiService';
import { Coffee, Lock, User, Eye, EyeOff, Sparkles, Phone, ShieldCheck, UserPlus } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { USER_ROLES } from '../utils/constants';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Initial database setup state (when database has 0 users)
  const [isInitialSetup, setIsInitialSetup] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupForm, setSetupForm] = useState({
    name: '',
    username: '',
    password: '',
    phone: ''
  });
  const [setupError, setSetupError] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);

  const { login, setupOwner } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkDatabaseSetup();
  }, []);

  const checkDatabaseSetup = async () => {
    try {
      const status = await apiService.getSetupStatus();
      if (status && !status.isSetup) {
        setIsInitialSetup(true);
      } else {
        setIsInitialSetup(false);
      }
    } catch {
      // Backend might still be starting, ignore
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('Please enter your username.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const authUser = await login(username, password);
      showToast(`Welcome back, ${authUser.name}!`, 'success');
      if (authUser.role === USER_ROLES.ADMIN || authUser.role === USER_ROLES.OWNER) {
        navigate('/dashboard');
      } else {
        navigate('/waiter/tables');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInitialOwner = async (e) => {
    e.preventDefault();
    setSetupError('');

    if (!setupForm.name.trim()) {
      setSetupError('Owner name is required.');
      return;
    }
    if (!setupForm.username.trim()) {
      setSetupError('Username is required.');
      return;
    }
    if (!setupForm.password.trim()) {
      setSetupError('Password is required.');
      return;
    }

    setSetupLoading(true);
    try {
      const newOwner = await setupOwner(setupForm);
      showToast(`Owner account created successfully! Welcome, ${newOwner.name}.`, 'success');
      setSetupModalOpen(false);
      setIsInitialSetup(false);
      navigate('/dashboard');
    } catch (err) {
      setSetupError(err.message || 'Failed to create owner account.');
    } finally {
      setSetupLoading(false);
    }
  };

  const fillQuickDemo = async (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setErrorMessage('');
    setLoading(true);
    try {
      const authUser = await login(user, pass);
      showToast(`Welcome back, ${authUser.name}!`, 'success');
      if (authUser.role === USER_ROLES.ADMIN || authUser.role === USER_ROLES.OWNER) {
        navigate('/dashboard');
      } else {
        navigate('/waiter/tables');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        backgroundImage: 'radial-gradient(circle at 50% 30%, #1e293b 0%, #0f172a 100%)',
        padding: '24px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden'
        }}
      >
        {/* Brand Banner */}
        <div
          style={{
            backgroundColor: 'var(--primary)',
            padding: '36px 24px 28px',
            textAlign: 'center',
            color: '#ffffff',
            position: 'relative'
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}
          >
            <Coffee size={32} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.05em' }}>
            CAFE COZY
          </h2>
          <p style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: 4 }}>
            Cafe Management & POS System
          </p>
        </div>

        {/* Form Container */}
        <div style={{ padding: '32px 28px' }}>
          {isInitialSetup && (
            <div
              style={{
                backgroundColor: 'var(--primary-light)',
                border: '1px solid var(--primary)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                marginBottom: 20,
                textAlign: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>
                <ShieldCheck size={18} />
                <span>Initial Database Setup</span>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                The database is clean and empty. Create the initial Cafe Owner account to get started.
              </p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={UserPlus}
                onClick={() => {
                  setSetupError('');
                  setSetupModalOpen(true);
                }}
                style={{ width: '100%' }}
              >
                Set Up Owner Account
              </Button>
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                backgroundColor: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                fontSize: '0.85rem',
                marginBottom: 20
              }}
            >
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: 18 }}>
              <label className="form-label" htmlFor="username">
                Username
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', left: 12, color: 'var(--muted)', display: 'flex' }}>
                  <User size={18} />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username (e.g. admin or amit)"
                  className="form-input"
                  style={{ paddingLeft: '38px', height: '44px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', left: 12, color: 'var(--muted)', display: 'flex' }}>
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="form-input"
                  style={{ paddingLeft: '38px', paddingRight: '40px', height: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    color: 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              style={{ width: '100%', fontWeight: 700 }}
            >
              LOGIN
            </Button>
          </form>

          {/* Quick Demo Credentials for Fast Testing */}
          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: '1px solid var(--border)',
              textAlign: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 10, fontWeight: 600 }}>
              <Sparkles size={14} color="var(--primary)" />
              <span>CLICK TO AUTO-FILL TEST LOGINS</span>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fillQuickDemo('owner', 'owner123')}
                style={{
                  fontSize: '0.75rem',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  border: '1px solid var(--primary)',
                  fontWeight: 700
                }}
              >
                Owner (owner / owner123)
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('admin', 'admin123')}
                style={{
                  fontSize: '0.75rem',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface-alt)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  fontWeight: 600
                }}
              >
                Admin (admin / admin123)
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('amit', 'amit123')}
                style={{
                  fontSize: '0.75rem',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface-alt)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  fontWeight: 600
                }}
              >
                Waiter Amit (amit / amit123)
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('rahul', 'rahul123')}
                style={{
                  fontSize: '0.75rem',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface-alt)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  fontWeight: 600
                }}
              >
                Waiter Rahul (rahul / rahul123)
              </button>
            </div>

            {/* Support / Contact Us Notice */}
            <div
              style={{
                marginTop: 20,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                textAlign: 'center',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)'
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
                <Phone size={13} color="var(--primary)" />
                <span>Contact & Support: Atharv Chavan</span>
              </div>
              <div>
                Mobile: <a href="tel:8788671566" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>+91 8788671566</a>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2, fontStyle: 'italic' }}>
                "For any query contact me"
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Initial Owner Setup Modal */}
      <Modal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        title="Initial Setup: Create Cafe Owner Account"
        maxWidth="480px"
      >
        <form onSubmit={handleCreateInitialOwner}>
          {setupError && (
            <div
              style={{
                backgroundColor: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                fontSize: '0.85rem',
                marginBottom: 16
              }}
            >
              {setupError}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Vikram Singhania"
                value={setupForm.name}
                onChange={(e) => setSetupForm({ ...setupForm, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. owner"
                value={setupForm.username}
                onChange={(e) => setSetupForm({ ...setupForm, username: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter secure password"
                value={setupForm.password}
                onChange={(e) => setSetupForm({ ...setupForm, password: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. +91 99999 88888"
                value={setupForm.phone}
                onChange={(e) => setSetupForm({ ...setupForm, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-footer" style={{ marginTop: 20 }}>
            <Button type="button" variant="secondary" onClick={() => setSetupModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={setupLoading}>
              Create Owner Account & Login
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
