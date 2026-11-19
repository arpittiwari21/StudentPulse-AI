import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, BookOpen, AlertCircle, ArrowRight, GraduationCap, Eye, EyeOff } from 'lucide-react';

export default function Register({ onSwitchToLogin }) {
  const { register, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!name.trim()) {
      setLocalError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@kiet.edu')) {
      setLocalError('Please provide a valid institutional @kiet.edu email address.');
      return;
    }
    if (!enrollmentNo.trim()) {
      setLocalError('Please provide your university roll/enrollment number.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        enrollment_no: enrollmentNo.trim().toUpperCase(),
        password: password,
      });
    } catch (err) {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = localError || error;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px 16px', backgroundColor: 'var(--bg-canvas)' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '440px', padding: '28px 24px', backgroundColor: '#ffffff' }}>
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '9999px', backgroundColor: '#f4f4f5', border: '1px solid #e4e4e7', fontSize: '11px', fontWeight: 600, color: '#52525b', marginBottom: '12px' }}>
            <GraduationCap size={13} style={{ color: '#2563eb' }} />
            <span>KIET GROUP OF INSTITUTIONS</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Create Student Account
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Initialize your student readiness & career preparation tracker
          </p>
        </div>

        {activeError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '12px', marginBottom: '16px' }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{activeError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '12px' }}>
            <label htmlFor="reg-name" style={{ fontSize: '12px', fontWeight: 500, color: '#52525b', display: 'block', marginBottom: '4px' }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <User size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#a1a1aa' }} />
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Amarjeet Kumar"
                style={{ paddingLeft: '32px' }}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label htmlFor="reg-email" style={{ fontSize: '12px', fontWeight: 500, color: '#52525b', display: 'block', marginBottom: '4px' }}>
              Institutional Email (@kiet.edu)
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#a1a1aa' }} />
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name.2628mcaXXXX@kiet.edu"
                style={{ paddingLeft: '32px' }}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label htmlFor="reg-roll" style={{ fontSize: '12px', fontWeight: 500, color: '#52525b', display: 'block', marginBottom: '4px' }}>
              University Roll / Enrollment No
            </label>
            <div style={{ position: 'relative' }}>
              <BookOpen size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#a1a1aa' }} />
              <input
                id="reg-roll"
                type="text"
                value={enrollmentNo}
                onChange={(e) => setEnrollmentNo(e.target.value)}
                placeholder="e.g. 2628MCA0069"
                style={{ paddingLeft: '32px', textTransform: 'uppercase' }}
                className="font-mono"
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="reg-password" style={{ fontSize: '12px', fontWeight: 500, color: '#52525b', display: 'block', marginBottom: '4px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#a1a1aa' }} />
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                style={{ paddingLeft: '32px', paddingRight: '34px' }}
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
              <span>Registering account...</span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: '#71717a' }}>
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => { clearError(); onSwitchToLogin(); }}
            style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 500, padding: 0, textDecoration: 'underline' }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
