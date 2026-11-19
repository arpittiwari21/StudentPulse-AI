import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, GraduationCap, UserCheck } from 'lucide-react';

export default function Login({ onSwitchToRegister }) {
  const { login, error, clearError, isServerOnline } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleLogin = async (loginEmail, loginPassword) => {
    setLocalError('');
    clearError();

    const targetEmail = (loginEmail || email).trim();
    const targetPassword = loginPassword || password;

    if (!targetEmail) {
      setLocalError('Please enter your @kiet.edu institutional email.');
      return;
    }
    if (!targetPassword) {
      setLocalError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        email: targetEmail,
        password: targetPassword,
      });
    } catch (err) {
      // Error handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoStudent = () => {
    setEmail('student@kiet.edu');
    setPassword('Student@123');
    handleLogin('student@kiet.edu', 'Student@123');
  };

  const handleDemoFaculty = () => {
    setEmail('admin@kiet.edu');
    setPassword('Faculty@KIET2024');
    handleLogin('admin@kiet.edu', 'Faculty@KIET2024');
  };

  const activeError = localError || error;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px 16px', backgroundColor: 'var(--bg-canvas)' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '420px', padding: '28px 24px', backgroundColor: '#ffffff' }}>
        {/* Institutional Branding */}
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '9999px', backgroundColor: '#f4f4f5', border: '1px solid #e4e4e7', fontSize: '11px', fontWeight: 600, color: '#52525b', marginBottom: '12px' }}>
            <GraduationCap size={13} style={{ color: '#2563eb' }} />
            <span>KIET GROUP OF INSTITUTIONS</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            StudentPulse AI
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Student Success, Skill Readiness & Career Analytics
          </p>
        </div>

        {/* Server Offline Warning */}
        {!isServerOnline && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '12px', marginBottom: '16px' }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>Backend offline. Check Flask server connection.</span>
          </div>
        )}

        {/* Active Error Banner */}
        {activeError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '12px', marginBottom: '16px' }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{activeError}</span>
          </div>
        )}

        {/* 1-Click MSE-2 Demo Login Strip */}
        <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#fafafa', border: '1px solid #e4e4e7', borderRadius: '6px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#71717a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <UserCheck size={12} />
            <span>1-Click MSE-2 Evaluation Logins</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleDemoStudent}
              disabled={isSubmitting}
              style={{ fontSize: '12px', padding: '6px 8px', justifyContent: 'center' }}
            >
              <span>Student Demo</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleDemoFaculty}
              disabled={isSubmitting}
              style={{ fontSize: '12px', padding: '6px 8px', justifyContent: 'center' }}
            >
              <span>Faculty Demo</span>
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', textAlign: 'center', margin: '16px 0' }}>
          <div style={{ position: 'absolute', inset: '0', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '100%', borderTop: '1px solid #e4e4e7' }}></div>
          </div>
          <div style={{ position: 'relative', display: 'inline-block', padding: '0 8px', backgroundColor: '#ffffff', fontSize: '11px', color: '#a1a1aa' }}>
            or continue with email
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} noValidate>
          <div style={{ marginBottom: '14px' }}>
            <label htmlFor="login-email" style={{ fontSize: '12px', fontWeight: 500, color: '#52525b', display: 'block', marginBottom: '4px' }}>
              Institutional Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#a1a1aa' }} />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rollno.2628mcaXXXX@kiet.edu"
                style={{ paddingLeft: '32px' }}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label htmlFor="login-password" style={{ fontSize: '12px', fontWeight: 500, color: '#52525b', margin: 0 }}>
                Password
              </label>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#a1a1aa' }} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{ paddingLeft: '32px', paddingRight: '34px' }}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                style={{ position: 'absolute', right: '6px', top: '6px', background: 'none', border: 'none', padding: '4px', color: '#a1a1aa', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', padding: '9px 16px', fontSize: '13px', fontWeight: 600 }}
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign in to Dashboard</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: '#71717a' }}>
          New student?{' '}
          <button
            type="button"
            onClick={() => { clearError(); onSwitchToRegister(); }}
            style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 500, padding: 0, textDecoration: 'underline' }}
          >
            Create an account
          </button>
        </div>
      </div>

      {/* Institutional & Team Attribution Footer */}
      <div style={{ marginTop: '20px', maxWidth: '420px', textAlign: 'center', fontSize: '11px', color: '#71717a', lineHeight: 1.6 }}>
        <div>Department of Computer Applications • MCA AI & Python Programming</div>
        <div style={{ color: '#a1a1aa', marginTop: '2px' }}>
          Team: Amarjeet Kumar (2628MCA0069), Akhilesh Chaubey, Arpit Tiwari, Ankit Pathak, Archana Tiwari
        </div>
      </div>
    </div>
  );
}
