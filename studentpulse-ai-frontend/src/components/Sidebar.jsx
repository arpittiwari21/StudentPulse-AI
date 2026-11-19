import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FolderGit2,
  Sparkles,
  Users,
  LogOut,
  GraduationCap,
  X,
} from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab, isOpen, onClose }) {
  const { user, logout } = useAuth();

  const isFaculty = user?.role === 'admin' || user?.role === 'faculty';

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'evidence', label: 'Evidence & Projects', icon: FolderGit2 },
    { id: 'action-plan', label: 'AI Plan & Mock Prep', icon: Sparkles },
    ...(isFaculty ? [{ id: 'cohort', label: 'Cohort Analytics', icon: Users }] : []),
  ];

  const getMonogram = () => {
    if (!user?.name) return 'SP';
    const parts = user.name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`w-64 fixed inset-y-0 left-0 z-30 bg-[#0C0C0F] border-r border-[#222228] flex flex-col select-none transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header with Glowing Neon SP Emblem */}
        <div className="p-5 border-b border-[#222228] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#111114] border border-[#00FF66]/40 flex items-center justify-center text-[#00FF66] font-mono font-bold text-sm shadow-[0_0_16px_rgba(0,255,102,0.3)]">
              SP
            </div>
            <div>
              <div className="text-[14px] font-bold text-white tracking-tight leading-tight flex items-center gap-1.5">
                <span>StudentPulse</span>
                <span className="text-[#00FF66] text-xs font-mono font-bold">AI</span>
              </div>
              <div className="text-[10px] text-[#9CA3AF] flex items-center gap-1 mt-0.5 font-mono uppercase tracking-wider">
                <GraduationCap className="w-3 h-3 text-[#00FF66]" />
                <span>KIET MCA</span>
              </div>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 text-[#6B7280] hover:text-white hover:bg-[#18181D] rounded-lg transition-colors cursor-pointer"
            title="Close navigation menu"
          >
            <X className="w-5 h-5 text-[#9CA3AF]" />
          </button>
        </div>

        {/* Nav List */}
        <nav className="p-3.5 flex-1 overflow-y-auto flex flex-col gap-1.5">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#6B7280] px-3 py-2">
            Platform Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-[rgba(0,255,102,0.12)] text-[#00FF66] border border-[#00FF66]/30 shadow-[0_0_12px_rgba(0,255,102,0.15)]'
                    : 'text-[#9CA3AF] hover:text-white hover:bg-[#18181D] border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#00FF66]' : 'text-[#6B7280]'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile Card */}
        <div className="p-3.5 border-t border-[#222228] bg-[#09090B]">
          <div className="p-2.5 rounded-xl bg-[#111114] border border-[#222228] flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#18181D] border border-[#32323C] text-[#00FF66] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                {getMonogram()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate leading-tight">
                  {user?.name || 'Dr. Faculty KIET'}
                </div>
                <div className="text-[10px] font-mono text-[#9CA3AF] truncate leading-tight mt-0.5">
                  {user?.enrollment_no || user?.email || 'admin@kiet.edu'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#EF4444] hover:bg-[#18181D] transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
