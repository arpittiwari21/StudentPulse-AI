import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FolderGit2,
  Sparkles,
  Users,
  LogOut,
  GraduationCap,
} from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab }) {
  const { user, logout } = useAuth();

  const isFaculty = user?.role === 'admin' || user?.role === 'faculty';

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'evidence', label: 'Evidence & Projects', icon: FolderGit2 },
    { id: 'action-plan', label: 'AI Plan & Mock Prep', icon: Sparkles },
    ...(isFaculty ? [{ id: 'cohort', label: 'Cohort Analytics', icon: Users }] : []),
  ];

  const getMonogram = () => {
    if (!user?.name) return 'ST';
    const parts = user.name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <aside
      style={{
        width: '240px',
        height: '100vh',
        backgroundColor: '#ffffff',
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 20,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: '#18181b',
            color: '#ffffff',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
          }}
        >
          SP
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            StudentPulse AI
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <GraduationCap size={11} style={{ color: '#2563eb' }} />
            <span>KIET MCA</span>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0 8px 8px 8px' }}>
          Workspace
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--bg-subtle)' : 'transparent',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--border-default)' : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s, border-color 0.15s',
                }}
              >
                <Icon size={16} style={{ color: isActive ? '#2563eb' : 'var(--text-muted)' }} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Moniker & Sign Out */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-default)',
          backgroundColor: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9999px',
              backgroundColor: '#e4e4e7',
              color: '#18181b',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {getMonogram()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={user?.name}
            >
              {user?.name || 'Student'}
            </div>
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={user?.enrollment_no || user?.email}
            >
              {user?.enrollment_no || user?.email}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          title="Sign Out"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            padding: '6px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
