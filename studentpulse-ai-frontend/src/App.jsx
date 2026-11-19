import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentView] = useState('login'); // 'login' | 'register'

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-canvas)',
          color: 'var(--text-muted)',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            border: '2px solid #e4e4e7',
            borderTopColor: '#18181b',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span style={{ fontSize: '13px', fontWeight: 500 }}>Initializing StudentPulse AI...</span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return currentView === 'login' ? (
    <Login onSwitchToRegister={() => setCurrentView('register')} />
  ) : (
    <Register onSwitchToLogin={() => setCurrentView('login')} />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
