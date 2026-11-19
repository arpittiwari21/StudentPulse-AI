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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090B] text-[#9CA3AF] gap-3">
        <div className="w-8 h-8 border-2 border-[#222228] border-t-[#00FF66] rounded-full animate-spin shadow-[0_0_12px_rgba(0,255,102,0.3)]" />
        <span className="text-xs font-mono text-white tracking-wider">
          INITIALIZING STUDENTPULSE AI...
        </span>
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
