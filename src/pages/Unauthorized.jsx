import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const Unauthorized = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const handleGoBack = () => {
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
          backgroundColor: 'var(--danger-bg)',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20
        }}
      >
        <ShieldAlert size={44} />
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
        Access Denied
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '1rem', maxWidth: '400px', marginBottom: 24 }}>
        You do not have permission to access this page.
      </p>
      <Button variant="primary" icon={ArrowLeft} onClick={handleGoBack}>
        Go Back
      </Button>
    </div>
  );
};
