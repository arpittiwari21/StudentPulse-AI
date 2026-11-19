import React from 'react';
import { useAuth } from '../context/AuthContext';
import { SlidersHorizontal, Clock, Target, Layers } from 'lucide-react';

export default function Header({ title, subtitle, onOpenContextModal }) {
  const { user } = useAuth();

  return (
    <header
      style={{
        height: '60px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-default)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Context Badges */}
        <div className="pill pill-neutral" title="Target Job Role">
          <Target size={11} style={{ color: '#2563eb' }} />
          <span>{user?.target_role || 'Full-Stack Developer'}</span>
        </div>

        <div className="pill pill-neutral" title="Daily Study Hours">
          <Clock size={11} style={{ color: '#52525b' }} />
          <span className="tabular-nums">{user?.daily_hours || 2}h/day</span>
        </div>

        <div className="pill pill-neutral" title="Focus Area">
          <Layers size={11} style={{ color: '#52525b' }} />
          <span>{user?.focus_area || 'Projects'}</span>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={onOpenContextModal}
          style={{ fontSize: '12px', padding: '5px 10px', marginLeft: '4px' }}
          title="Adjust Role & Daily Hours"
        >
          <SlidersHorizontal size={13} />
          <span>Adjust Context</span>
        </button>
      </div>
    </header>
  );
}
