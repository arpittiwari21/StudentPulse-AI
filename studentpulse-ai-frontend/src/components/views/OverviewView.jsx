import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getReadiness, getProgress } from '../../api/student';
import {
  Award,
  BookOpen,
  Flame,
  Check,
  ArrowRight,
  RefreshCw,
  Plus,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Chart, registerables } from 'chart.js';

// Register Chart.js elements
Chart.register(...registerables);

function CircularProgressRing({ percentage, size = 40, strokeWidth = 3.5 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#222228"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#00FF66"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out drop-shadow-[0_0_6px_rgba(0,255,102,0.4)]"
        />
      </svg>
      <span className="absolute text-[11px] font-mono font-bold text-white">
        {Math.round(clamped)}
      </span>
    </div>
  );
}

function ActivityStrip({ streakDays, activeDays }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const activeCount = Math.min(7, Math.max(streakDays, activeDays > 0 ? (activeDays % 7 || 7) : 0));

  return (
    <div className="flex items-center gap-1.5 mt-3">
      {days.map((day, idx) => {
        const isActive = idx >= 7 - activeCount;
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`h-2 w-full rounded-full transition-all duration-300 ${
                isActive
                  ? 'bg-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.4)]'
                  : 'bg-[#222228]'
              }`}
              title={`${day}: ${isActive ? 'Active Study Logged' : 'Rest Day'}`}
            />
            <span className="text-[9px] font-mono text-[#6B7280] leading-none">{day}</span>
          </div>
        );
      })}
    </div>
  );
}

function RadarChart({ labels, scores }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !labels || !scores) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    chartInstanceRef.current = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Competency Score',
            data: scores,
            backgroundColor: 'rgba(0, 255, 102, 0.15)',
            borderColor: '#00FF66',
            borderWidth: 2,
            pointBackgroundColor: '#00FF66',
            pointBorderColor: '#09090B',
            pointBorderWidth: 2,
            pointRadius: 4.5,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: '#39FF14',
            pointHoverBorderColor: '#FFFFFF',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 16,
            bottom: 24,
            left: 32,
            right: 32,
          },
        },
        scales: {
          r: {
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: {
              stepSize: 25,
              display: false,
            },
            grid: {
              color: '#27272A',
              lineWidth: 1,
            },
            angleLines: {
              color: '#27272A',
              lineWidth: 1,
            },
            pointLabels: {
              font: {
                family: "'JetBrains Mono', 'Inter', monospace",
                size: 11,
                weight: '600',
              },
              color: '#9CA3AF',
              padding: 16,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#111114',
            borderColor: '#00FF66',
            borderWidth: 1,
            titleFont: { family: "'Inter', sans-serif", size: 12, weight: '700' },
            bodyFont: { family: "'JetBrains Mono', monospace", size: 12, weight: '600' },
            titleColor: '#FFFFFF',
            bodyColor: '#00FF66',
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: (context) => ` ${context.label}: ${context.raw}%`,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [labels, scores]);

  return (
    <div className="w-full h-[290px] relative px-3 py-1">
      <canvas ref={canvasRef} />
    </div>
  );
}

export default function OverviewView({ onNavigateTab }) {
  const { token, user } = useAuth();
  const [readiness, setReadiness] = useState(null);
  const [radar, setRadar] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [targetedSkills, setTargetedSkills] = useState({});
  const [toastMessage, setToastMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [readinessRes, progressRes] = await Promise.all([
        getReadiness(token),
        getProgress(token).catch(() => null),
      ]);
      setReadiness(readinessRes.readiness);
      setRadar(readinessRes.radar);
      setProgress(progressRes);
    } catch (err) {
      setError(err.message || 'Failed to load readiness overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleSkillGapClick = (skill) => {
    setTargetedSkills((prev) => ({
      ...prev,
      [skill]: !prev[skill],
    }));
    setToastMessage(`"${skill}" ${targetedSkills[skill] ? 'removed from' : 'targeted in'} your learning roadmap.`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className="px-6 py-6 flex flex-col gap-6 bg-[#09090B] min-h-screen">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="panel skeleton h-[120px] rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="panel skeleton h-[420px] rounded-2xl" />
          <div className="panel skeleton h-[420px] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-6 bg-[#09090B] min-h-screen">
        <div className="p-5 bg-[#18181D] border border-red-500/30 rounded-2xl text-red-400">
          <p className="font-bold text-white mb-1">Could not load overview telemetry</p>
          <p className="text-sm m-0 text-red-300">{error}</p>
          <button
            type="button"
            className="btn-secondary mt-3"
            onClick={loadData}
          >
            <RefreshCw size={14} /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const overallScore = Math.round(readiness?.overall_score || 0);
  const tier = readiness?.readiness_tier || 'Developing';

  const getTierBadge = (t) => {
    if (t === 'Industry Ready') {
      return 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/30 shadow-[0_0_10px_rgba(0,255,102,0.15)]';
    }
    if (t === 'Developing') {
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]';
    }
    return 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]';
  };

  const streakDays = progress?.streak_days || 0;
  const activeDays = progress?.active_days || 0;
  const academicPct = Math.round(readiness?.academic_index || 0);
  const dailyHours = user?.daily_hours || readiness?.daily_hours || 2;

  return (
    <div className="px-6 py-6 flex flex-col gap-6 bg-[#09090B] min-h-screen relative overflow-x-hidden">
      {/* Subtle Ambient Radial Glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[350px] bg-[radial-gradient(circle,rgba(0,255,102,0.04)_0%,transparent_70%)] pointer-events-none" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111114] border border-[#00FF66]/50 text-white text-xs px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(0,255,102,0.25)] flex items-center gap-2.5 animate-bounce">
          <Zap className="w-4 h-4 text-[#00FF66]" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* 1. Bento Grid Top Row: 4 Modernized KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Overall Readiness */}
        <div className="panel p-5 rounded-2xl flex flex-col justify-between hover:border-[#00FF66]/40 transition-all duration-300 group">
          <div>
            <div className="flex justify-between items-start mb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Overall Readiness
              </span>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border whitespace-nowrap shrink-0 font-mono ${getTierBadge(tier)}`}>
                {tier}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
                {overallScore}%
              </span>
              <span className="text-xs text-[#6B7280] font-mono">composite index</span>
            </div>
            <div className="text-[10px] font-mono text-[#9CA3AF] mt-2 flex items-center gap-1">
              <span>Weights: 40% Skills • 35% Exams • 25% Projects ({Math.round(readiness?.evidence_index || 0)}%)</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 w-full bg-[#18181D] rounded-full overflow-hidden border border-[#222228]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  overallScore >= 75
                    ? 'bg-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.5)]'
                    : overallScore >= 50
                    ? 'bg-[#60A5FA] shadow-[0_0_12px_rgba(96,165,250,0.5)]'
                    : 'bg-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                }`}
                style={{ width: `${overallScore}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono text-[#6B7280] mt-1.5">
              <span>Target: 75% Benchmark</span>
              <span className="text-[#00FF66]">100% Total Model</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Skill Alignment */}
        <div className="panel p-5 rounded-2xl flex flex-col justify-between hover:border-[#00FF66]/40 transition-all duration-300 group">
          <div>
            <div className="flex justify-between items-start mb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Skill Alignment
              </span>
              <Award className="w-4 h-4 text-[#00FF66]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
                {Math.round(readiness?.skill_index || 0)}%
              </span>
              <span className="text-xs text-[#6B7280] font-mono">40% weight</span>
            </div>
          </div>
          <div className="text-xs text-[#9CA3AF] mt-4 pt-3 border-t border-[#1F1F26] flex items-center justify-between font-mono">
            <span>
              <strong className="text-[#00FF66]">{readiness?.matched_skills?.length || 0}</strong> verified
            </span>
            <span className="text-[#32323C]">•</span>
            <span>
              <strong className="text-[#F59E0B]">{readiness?.missing_skills?.length || 0}</strong> skill gaps
            </span>
          </div>
        </div>

        {/* KPI 3: Academic & Exams Index */}
        <div className="panel p-5 rounded-2xl flex flex-col justify-between hover:border-[#00FF66]/40 transition-all duration-300 group">
          <div>
            <div className="flex justify-between items-start mb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Academic & Exams
              </span>
              <BookOpen className="w-4 h-4 text-[#00FF66]" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
                  {academicPct}%
                </span>
                <span className="text-xs text-[#6B7280] font-mono">35% weight</span>
              </div>
              <CircularProgressRing percentage={academicPct} size={42} strokeWidth={4} />
            </div>
          </div>
          <div className="text-xs mt-4 pt-3 border-t border-[#1F1F26]">
            {readiness?.weak_subjects?.length ? (
              <span className="text-[#F59E0B] font-medium truncate block font-mono text-[11px]">
                Focus: {readiness.weak_subjects.join(', ')}
              </span>
            ) : (
              <span className="text-[#00FF66] font-medium flex items-center gap-1.5 text-[11px]">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>All course metrics verified</span>
              </span>
            )}
          </div>
        </div>

        {/* KPI 4: Study Streak & Consistency */}
        <div className="panel p-5 rounded-2xl flex flex-col justify-between hover:border-[#00FF66]/40 transition-all duration-300 group">
          <div>
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Study Streak
              </span>
              <Flame className={`w-4 h-4 ${streakDays > 0 ? 'text-[#00FF66] drop-shadow-[0_0_8px_rgba(0,255,102,0.6)]' : 'text-[#6B7280]'}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
                {streakDays}
              </span>
              <span className="text-xs font-semibold text-[#9CA3AF]">days active</span>
            </div>
            {/* 7-Day Neon Activity Strip */}
            <ActivityStrip streakDays={streakDays} activeDays={activeDays} />
          </div>

          {/* Zero-Streak Framing */}
          {streakDays === 0 ? (
            <div className="mt-3 text-[11px] text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/25 rounded-xl px-2.5 py-1.5 flex items-center gap-2 leading-tight">
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
              <span>Complete 1 milestone today to ignite your streak</span>
            </div>
          ) : (
            <div className="text-xs text-[#9CA3AF] mt-3 pt-3 border-t border-[#1F1F26] flex items-center justify-between font-mono text-[11px]">
              <span>{activeDays} logged active days</span>
              <span className="text-[#00FF66]">{readiness?.project_count || 0} projects</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Bento Grid: Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Bento: Competency & Evidence Matrix */}
        <div className="panel p-6 rounded-2xl flex flex-col justify-between h-full hover:border-[#00FF66]/30 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight m-0">
                  Competency & Evidence Matrix
                </h3>
                <p className="text-xs text-[#9CA3AF] m-0 mt-0.5">
                  Multi-dimensional readiness breakdown against {readiness?.target_role}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#18181D] border border-[#222228] text-[10px] font-mono text-[#00FF66]">
                5-Axis Matrix
              </span>
            </div>

            {/* Radar Canvas with Dark Grid & Glowing Neon Polygon */}
            <div className="flex items-center justify-center my-3">
              {radar && <RadarChart labels={radar.labels} scores={radar.scores} />}
            </div>
          </div>

          {/* Skills Breakdown */}
          <div className="mt-5 pt-5 border-t border-[#222228] flex flex-col gap-4">
            {/* Verified Matched Skills */}
            <div>
              <div className="text-[11px] font-mono font-semibold text-[#6B7280] uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Verified Evidence ({readiness?.matched_skills?.length || 0})</span>
                <span className="text-[10px] text-emerald-400">verified skills</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {readiness?.matched_skills?.length ? (
                  readiness.matched_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{skill}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#6B7280]">No verified skills logged yet.</span>
                )}
              </div>
            </div>

            {/* Target Role Skill Gaps */}
            <div>
              <div className="text-[11px] font-mono font-semibold text-[#6B7280] uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Target Role Skill Gaps ({readiness?.missing_skills?.length || 0})</span>
                <span className="text-[10px] text-[#9CA3AF] lowercase">click to add to plan</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {readiness?.missing_skills?.length ? (
                  readiness.missing_skills.map((skill, idx) => {
                    const isTargeted = !!targetedSkills[skill];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSkillGapClick(skill)}
                        className={`font-mono text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all cursor-pointer group ${
                          isTargeted
                            ? 'bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.3)]'
                            : 'bg-slate-900/40 border border-dashed border-slate-600 text-slate-300 hover:border-emerald-400 hover:text-emerald-300'
                        }`}
                        title="Click to target this skill for active preparation"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0" />
                        <span>{skill}</span>
                      </button>
                    );
                  })
                ) : (
                  <span className="text-xs text-[#00FF66] font-medium">Zero skill gaps! You are 100% matched.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Bento: AI Readiness Diagnosis Spotlight Card */}
        <div className="flex flex-col justify-between gap-6 h-full">
          {/* Spotlight Card with Neon Green Top Accent Border */}
          <div className="panel p-6 rounded-2xl border-t-2 border-t-[#00FF66] flex flex-col justify-between flex-1 relative overflow-hidden">
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse shadow-[0_0_8px_#00FF66]" />
                    <h3 className="text-base font-bold text-white tracking-tight m-0">
                      AI Readiness Diagnosis
                    </h3>
                  </div>
                  <p className="text-xs text-[#9CA3AF] m-0">
                    Context-aware intelligence diagnosis for {readiness?.target_role}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded-full border whitespace-nowrap shrink-0 font-mono ${getTierBadge(tier)}`}>
                  {tier}
                </span>
              </div>

              {/* Structured Diagnostic Callout Box with Neon Left Border */}
              <div className="text-xs text-[#E4E4E7] leading-relaxed p-4 bg-[#18181D] rounded-xl border border-[#222228] border-l-4 border-l-[#00FF66] mb-5 shadow-inner">
                Candidate demonstrates an overall readiness score of{' '}
                <strong className="font-mono tabular-nums text-[#00FF66]">{overallScore}%</strong>. Academic standing is rated at{' '}
                <span className="font-mono tabular-nums text-white font-bold">{academicPct}%</span> (35% weight) with{' '}
                <span className="font-mono tabular-nums text-white font-bold">{Math.round(readiness?.skill_index || 0)}%</span> role skill alignment (40% weight) and{' '}
                <span className="font-mono tabular-nums text-white font-bold">{Math.round(readiness?.evidence_index || 0)}%</span> project evidence (25% weight).
                {readiness?.missing_skills?.length ? (
                  <div className="mt-3 pt-2.5 border-t border-[#222228] flex flex-wrap items-center gap-1.5">
                    <span className="text-[#9CA3AF] text-[11px]">Prioritized focal areas:</span>
                    {readiness.missing_skills.slice(0, 4).map((skill, idx) => (
                      <code
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-900/80 text-emerald-300 font-mono text-[11px] border border-slate-700/80"
                      >
                        {skill}
                      </code>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {/* CTAs: Solid High-Contrast Neon Green Primary Button */}
            <div className="flex flex-col gap-3 mt-4 pt-2">
              <button
                type="button"
                onClick={() => onNavigateTab('action-plan')}
                className="w-full py-3.5 px-5 bg-[#00FF66] text-[#09090B] hover:bg-[#39FF14] transition-all rounded-xl font-extrabold text-xs flex items-center justify-between shadow-[0_0_20px_rgba(0,255,102,0.25)] hover:shadow-[0_0_28px_rgba(0,255,102,0.45)] cursor-pointer group"
              >
                <span className="text-[13px] tracking-wide">Generate & View AI Action Plan →</span>
                <ArrowRight className="w-4 h-4 text-[#09090B] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('evidence')}
                className="w-full py-2.5 px-4 bg-[#18181D] hover:bg-[#22222A] text-[#9CA3AF] hover:text-white border border-[#222228] hover:border-[#32323C] transition-all rounded-xl font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>+ Add Assessments, Projects & Certifications</span>
              </button>
            </div>
          </div>

          {/* Sub-panel: Daily Study Commitment & Streak Tracking */}
          <div className="panel p-5 rounded-2xl">
            <h4 className="text-xs font-mono font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#00FF66]" />
              <span>Daily Study Commitment & Streak Tracking</span>
            </h4>
            <p className="text-xs text-[#6B7280] mb-3">
              Adaptive pacing tuned to your registered daily study allocation ({dailyHours}h/day).
            </p>
            <div className="flex items-center justify-between gap-3 p-3.5 bg-[#18181D] border border-[#222228] rounded-xl">
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">Active Momentum Tracker</div>
                <div className="text-[11px] text-[#9CA3AF] truncate">Check off milestone sprint tasks daily</div>
              </div>
              <span className="px-3 py-1.5 text-xs font-mono font-bold rounded-full border bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/30 shadow-[0_0_12px_rgba(0,255,102,0.15)] whitespace-nowrap shrink-0">
                {streakDays} Day Streak 🔥
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
