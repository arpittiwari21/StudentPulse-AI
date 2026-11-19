import React from 'react';
import { useAuth } from '../context/AuthContext';
import { SlidersHorizontal, Clock, Target, Layers } from 'lucide-react';

export default function Header({ title, subtitle, onOpenContextModal }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-[60px] px-6 bg-white border-b border-slate-200">
      <div>
        <h2 className="text-[15px] font-bold text-slate-900 tracking-tight leading-snug">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-500 leading-none mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Unified Sleek Control Bar */}
      <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden h-9 divide-x divide-slate-200">
        <div
          className="h-9 flex items-center gap-1.5 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          title="Target Career Role"
        >
          <Target className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="whitespace-nowrap font-medium">{user?.target_role || 'Backend Python Developer'}</span>
        </div>

        <div
          className="h-9 flex items-center gap-1.5 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          title="Daily Study Commitment"
        >
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-mono tabular-nums whitespace-nowrap">{user?.daily_hours || 2}h/day</span>
        </div>

        <div
          className="h-9 flex items-center gap-1.5 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap hidden sm:flex"
          title="Current Focus Area"
        >
          <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="whitespace-nowrap">{user?.focus_area || 'DSA/Coding'}</span>
        </div>

        <button
          type="button"
          onClick={onOpenContextModal}
          className="h-9 flex items-center gap-1.5 px-3.5 text-xs font-semibold text-slate-900 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
          title="Adjust Role & Daily Hours"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="whitespace-nowrap">Adjust Context</span>
        </button>
      </div>
    </header>
  );
}
