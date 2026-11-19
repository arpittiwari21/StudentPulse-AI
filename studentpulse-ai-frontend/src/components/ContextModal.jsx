import React, { useState } from 'react';
import { updateContext } from '../api/student';
import { useAuth } from '../context/AuthContext';
import { X, Sparkles } from 'lucide-react';

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
        className="panel p-6 w-full max-w-md bg-[#111114] border border-[#222228] rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight m-0 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00FF66]" />
              <span>Update Career Context</span>
            </h3>
            <p className="text-xs text-[#9CA3AF] m-0 mt-0.5">
              Re-align your target job matrix & daily preparation commitments
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#9CA3AF] hover:text-white rounded-lg"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
              Target Job Role
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="bg-[#18181D] border-[#222228] text-white"
            >
              <option value="Full-Stack Developer">Full-Stack Developer</option>
              <option value="AI/ML Engineer">AI/ML Engineer</option>
              <option value="Backend Python Developer">Backend Python Developer</option>
              <option value="Data Analyst">Data Analyst</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
              Daily Study Commitment (Hours)
            </label>
            <select
              value={dailyHours}
              onChange={(e) => setDailyHours(parseFloat(e.target.value))}
              className="bg-[#18181D] border-[#222228] text-white"
            >
              <option value={1.0}>1 Hour / day</option>
              <option value={2.0}>2 Hours / day (Standard)</option>
              <option value={3.0}>3 Hours / day</option>
              <option value={4.0}>4 Hours / day (Accelerated)</option>
              <option value={6.0}>6 Hours / day (Intensive Sprint)</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
              Current Focus Area
            </label>
            <select
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              className="bg-[#18181D] border-[#222228] text-white"
            >
              <option value="Projects">Projects & Production Code</option>
              <option value="DSA/Coding">DSA & Algorithmic Problem Solving</option>
              <option value="Core CS">Core CS (OS, DBMS, Computer Networks)</option>
              <option value="Interview Prep">Interview Preparation & Mock Rounds</option>
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? 'Re-aligning...' : 'Save Context Matrix'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
