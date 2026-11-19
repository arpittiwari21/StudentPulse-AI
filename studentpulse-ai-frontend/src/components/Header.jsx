import React from 'react';
import { useAuth } from '../context/AuthContext';
import { SlidersHorizontal, Clock, Target, Layers, Menu } from 'lucide-react';

export default function Header({ title, subtitle, onOpenContextModal, onToggleMobileMenu }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-[64px] px-6 lg:px-8 bg-[#0C0C0F]/90 backdrop-blur-md border-b border-[#222228]">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 -ml-2 text-[#9CA3AF] hover:text-white hover:bg-[#18181D] rounded-xl transition-colors cursor-pointer shrink-0"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5 text-[#00FF66]" />
        </button>

        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-white tracking-tight leading-snug truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-[#9CA3AF] leading-none mt-1 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Structured Pill-Based Control Strip */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center bg-[#111114] border border-[#222228] rounded-xl overflow-hidden h-9 divide-x divide-[#222228] shadow-inner">
          <div
            className="h-9 flex items-center gap-2 px-3 text-xs font-medium text-white hover:bg-[#18181D] transition-colors whitespace-nowrap"
            title="Target Career Role"
          >
            <Target className="w-3.5 h-3.5 text-[#00FF66] shrink-0" />
            <span className="font-mono text-xs">{user?.target_role || 'Full-Stack Developer'}</span>
          </div>

          <div
            className="h-9 flex items-center gap-2 px-3 text-xs font-medium text-white hover:bg-[#18181D] transition-colors whitespace-nowrap"
            title="Daily Study Commitment"
          >
            <Clock className="w-3.5 h-3.5 text-[#00FF66] shrink-0" />
            <span className="font-mono tabular-nums text-xs">{user?.daily_hours || 2}h/day</span>
          </div>

          <div
            className="h-9 flex items-center gap-2 px-3 text-xs font-medium text-white hover:bg-[#18181D] transition-colors whitespace-nowrap hidden lg:flex"
            title="Current Focus Area"
          >
            <Layers className="w-3.5 h-3.5 text-[#00FF66] shrink-0" />
            <span className="font-mono text-xs">{user?.focus_area || 'Projects'}</span>
          </div>
        </div>

        {/* Distinct Outlined Adjust Context Action Button */}
        <button
          type="button"
          onClick={onOpenContextModal}
          className="h-9 flex items-center gap-2 px-3.5 text-xs font-bold text-[#00FF66] bg-[#111114] border border-[#00FF66]/40 hover:border-[#00FF66] hover:bg-[#00FF66]/10 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-[0_0_10px_rgba(0,255,102,0.1)]"
          title="Adjust Role, Daily Hours & Focus"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#00FF66] shrink-0" />
          <span className="hidden sm:inline">Adjust Context</span>
        </button>
      </div>
    </header>
  );
}
