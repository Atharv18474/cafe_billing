import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HelpCircle, Home } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFound = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const handleGoHome = () => {
    if (isAdmin) {
      navigate('/dashboard');
    } else if (user) {
      navigate('/waiter/tables');
    } else {
      navigate('/login');
    }
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '24px'
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: 'var(--surface-alt)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20
        }}
      >
        <HelpCircle size={44} />
      </div>
      <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>
        404
      </h1>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 8, marginBottom: 12 }}>
        Page Not Found
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.95rem', maxWidth: '420px', marginBottom: 24 }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Button variant="primary" icon={Home} onClick={handleGoHome}>
        Go to {isAdmin ? 'Dashboard' : user ? 'Tables' : 'Login'}
      </Button>
    </div>
  );
};
