import React, { useState } from 'react';
import { updateContext } from '../api/student';
import { useAuth } from '../context/AuthContext';
import { X, Check } from 'lucide-react';

export default function ContextModal({ isOpen, onClose, onContextUpdated }) {
  const { user, token, refreshProfile } = useAuth();
  const [targetRole, setTargetRole] = useState(user?.target_role || 'Full-Stack Developer');
  const [dailyHours, setDailyHours] = useState(user?.daily_hours || 2.0);
  const [focusArea, setFocusArea] = useState(user?.focus_area || 'Projects');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      await updateContext(token, {
        target_role: targetRole,
        daily_hours: parseFloat(dailyHours),
        focus_area: focusArea,
      });
      await refreshProfile();
      if (onContextUpdated) onContextUpdated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update context.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="panel"
        style={{ width: '100%', maxWidth: '440px', padding: '24px', backgroundColor: '#ffffff' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Update Career Context</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Re-align your target job matrix & daily preparation commitments
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '12px', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label htmlFor="context-target-role" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Target Job Role
            </label>
            <select
              id="context-target-role"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            >
              <option value="Full-Stack Developer">Full-Stack Developer</option>
              <option value="AI/ML Engineer">AI/ML Engineer</option>
              <option value="Backend Python Developer">Backend Python Developer</option>
              <option value="Data Analyst">Data Analyst</option>
            </select>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label htmlFor="context-daily-hours" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Daily Study Commitment (Hours)
            </label>
            <select
              id="context-daily-hours"
              value={dailyHours}
              onChange={(e) => setDailyHours(parseFloat(e.target.value))}
            >
              <option value={1.0}>1 Hour / day</option>
              <option value={2.0}>2 Hours / day (Recommended)</option>
              <option value={3.0}>3 Hours / day</option>
              <option value={4.0}>4 Hours / day</option>
              <option value={6.0}>6 Hours / day (Intensive)</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="context-focus-area" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Current Focus Area
            </label>
            <select
              id="context-focus-area"
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
            >
              <option value="Projects">Projects & Practical Code</option>
              <option value="DSA/Coding">DSA & Algorithmic Problem Solving</option>
              <option value="Core CS">Core CS (OS, DBMS, Computer Networks)</option>
              <option value="Interview Prep">Interview Preparation & Mock Rounds</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? 'Updating...' : 'Save Context'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
