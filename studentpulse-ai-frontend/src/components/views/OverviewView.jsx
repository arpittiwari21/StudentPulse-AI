import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getReadiness, getProgress } from '../../api/student';
import {
  Award,
  BookOpen,
  Flame,
  Check,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Chart, registerables } from 'chart.js';

// Register Chart.js elements
Chart.register(...registerables);

function CircularProgressRing({ percentage, size = 36, strokeWidth = 3.5 }) {
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
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#10b981"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-[10px] font-mono font-bold text-slate-700">
        {Math.round(clamped)}
      </span>
    </div>
  );
}

function ActivityStrip({ streakDays, activeDays }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const activeCount = Math.min(7, Math.max(streakDays, activeDays > 0 ? (activeDays % 7 || 7) : 0));

  return (
    <div className="flex items-center gap-1.5 mt-2.5">
      {days.map((day, idx) => {
        const isActive = idx >= 7 - activeCount;
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`h-1.5 w-full rounded-full transition-colors ${
                isActive ? 'bg-blue-600' : 'bg-slate-200'
              }`}
              title={`${day}: ${isActive ? 'Active' : 'Rest'}`}
            />
            <span className="text-[9px] font-mono text-slate-400 leading-none">{day}</span>
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
            label: 'Readiness Score',
            data: scores,
            backgroundColor: 'rgba(37, 99, 235, 0.12)',
            borderColor: '#2563eb',
            borderWidth: 2,
            pointBackgroundColor: '#2563eb',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 16,
            bottom: 24, // Generous padding so 'Projects' and 'Consistency' labels are never clipped
            left: 20,
            right: 20,
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
              color: '#e2e8f0',
            },
            angleLines: {
              color: '#e2e8f0',
            },
            pointLabels: {
              font: {
                family: "'Inter', -apple-system, sans-serif",
                size: 11,
                weight: '600',
              },
              color: '#475569',
              padding: 16, // Generous padding to prevent clipping
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { family: "'Inter', sans-serif", size: 12, weight: '600' },
            bodyFont: { family: "'JetBrains Mono', monospace", size: 12 },
            padding: 10,
            cornerRadius: 6,
            displayColors: false,
            callbacks: {
              label: (context) => ` Score: ${context.raw}%`,
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
    <div className="w-full h-[280px] relative px-2 py-1">
      <canvas ref={canvasRef} />
    </div>
  );
}

export default function OverviewView({ onNavigateTab }) {
  const { token } = useAuth();
  const [readiness, setReadiness] = useState(null);
  const [radar, setRadar] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addedSkills, setAddedSkills] = useState({});
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

  const handleAddSkillToFocus = (skill) => {
    setAddedSkills((prev) => ({
      ...prev,
      [skill]: !prev[skill],
    }));
    setToastMessage(`"${skill}" ${addedSkills[skill] ? 'removed from' : 'added to'} targeted study focus.`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="panel skeleton h-[110px]" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="panel skeleton h-[380px]" />
          <div className="panel skeleton h-[380px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-semibold mb-1">Could not load overview</p>
          <p className="text-sm m-0">{error}</p>
          <button
            type="button"
            className="btn-secondary mt-3"
            onClick={loadData}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const overallScore = Math.round(readiness?.overall_score || 0);
  const tier = readiness?.readiness_tier || 'Developing';

  // Standardized semantic status badges: amber for Needs Foundation
  const getTierBadge = (t) => {
    if (t === 'Industry Ready') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (t === 'Developing') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const streakDays = progress?.streak_days || 0;
  const activeDays = progress?.active_days || 0;
  const academicPct = Math.round(readiness?.academic_index || 0);

  return (
    <div className="p-6 flex flex-col gap-6 bg-zinc-50 min-h-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-3.5 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. 4-Card KPI Strip: Balanced 4-Column Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Overall Readiness */}
        <div className="panel p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-slate-500">
                Overall Readiness
              </span>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border whitespace-nowrap ${getTierBadge(tier)}`}>
                {tier}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {overallScore}%
              </span>
              <span className="text-xs text-slate-400">composite score</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallScore >= 75
                    ? 'bg-emerald-600'
                    : overallScore >= 50
                    ? 'bg-blue-600'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${overallScore}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
              <span>Benchmark target</span>
              <span className="font-mono tabular-nums">75%</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Skill Alignment */}
        <div className="panel p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-slate-500">
                Skill Alignment Index
              </span>
              <Award className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {Math.round(readiness?.skill_index || 0)}%
              </span>
              <span className="text-xs text-slate-400">40% weight</span>
            </div>
          </div>
          <div className="text-xs text-slate-600 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>
              <strong className="font-mono tabular-nums text-slate-900">{readiness?.matched_skills?.length || 0}</strong> matched
            </span>
            <span className="text-slate-300">•</span>
            <span>
              <strong className="font-mono tabular-nums text-amber-700">{readiness?.missing_skills?.length || 0}</strong> skill gaps
            </span>
          </div>
        </div>

        {/* KPI 3: Academic Index (with compact circular progress ring) */}
        <div className="panel p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-slate-500">
                Academic & Exams Index
              </span>
              <BookOpen className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                  {academicPct}%
                </span>
                <span className="text-xs text-slate-400">35% weight</span>
              </div>
              <CircularProgressRing percentage={academicPct} size={34} strokeWidth={3} />
            </div>
          </div>
          <div className="text-xs mt-3 pt-2 border-t border-slate-100">
            {readiness?.weak_subjects?.length ? (
              <span className="text-amber-700 font-medium truncate block">
                Needs review: {readiness.weak_subjects.join(', ')}
              </span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>All subjects above threshold</span>
              </span>
            )}
          </div>
        </div>

        {/* KPI 4: Evidence & Streak (with 7-day mini activity strip and zero-streak framing) */}
        <div className="panel p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs font-medium text-slate-500">
                Study Streak & Consistency
              </span>
              <Flame className={`w-4 h-4 ${streakDays > 0 ? 'text-amber-500' : 'text-slate-300'}`} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {streakDays}
              </span>
              <span className="text-xs font-medium text-slate-500">days streak</span>
            </div>
            {/* 7-Day Activity Strip */}
            <ActivityStrip streakDays={streakDays} activeDays={activeDays} />
          </div>

          {/* Zero-Streak Framing */}
          {streakDays === 0 ? (
            <div className="mt-2.5 text-[11px] text-amber-700 bg-amber-50/90 border border-amber-200/90 rounded px-2 py-1 flex items-center gap-1.5 leading-snug">
              <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
              <span>Complete 1 milestone today to ignite your streak</span>
            </div>
          ) : (
            <div className="text-xs text-slate-500 mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="font-mono tabular-nums">{activeDays} active days logged</span>
              <span className="font-mono text-[11px] text-slate-400">{readiness?.project_count || 0} projects</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Competency & Evidence Matrix (with Chart.js radar & interactive skill pills) */}
        <div className="panel p-5 flex flex-col">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-900 m-0">
              Competency & Evidence Matrix
            </h3>
            <p className="text-xs text-slate-500 m-0 mt-0.5">
              Multi-dimensional readiness breakdown against {readiness?.target_role}
            </p>
          </div>

          {/* Chart.js Radar Canvas with unclipped axis labels */}
          <div className="flex-1 flex items-center justify-center my-2">
            {radar && <RadarChart labels={radar.labels} scores={radar.scores} />}
          </div>

          {/* Interactive Skill Pills */}
          <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col gap-3.5">
            {/* Verified Matched Skills */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>Verified Matched Skills ({readiness?.matched_skills?.length || 0})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {readiness?.matched_skills?.length ? (
                  readiness.matched_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs"
                    >
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{skill}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No matched skills recorded yet.</span>
                )}
              </div>
            </div>

            {/* Target Role Skill Gaps (Interactive Clickable Pills) */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Target Role Skill Gaps ({readiness?.missing_skills?.length || 0})</span>
                <span className="text-[10px] text-slate-400 lowercase font-normal">click to target</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {readiness?.missing_skills?.length ? (
                  readiness.missing_skills.map((skill, idx) => {
                    const isSelected = !!addedSkills[skill];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddSkillToFocus(skill)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-all cursor-pointer group shadow-2xs ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-300'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                        title="Click to add/remove this skill from targeted learning focus"
                      >
                        {isSelected ? (
                          <Check className="w-3 h-3 text-blue-600 shrink-0" />
                        ) : (
                          <Plus className="w-3 h-3 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
                        )}
                        <span>{skill}</span>
                      </button>
                    );
                  })
                ) : (
                  <span className="text-xs text-emerald-600 font-medium">Zero skill gaps identified! You are fully aligned.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Readiness Diagnosis & Next Actions */}
        <div className="flex flex-col gap-5">
          <div className="panel p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">AI Readiness Diagnosis</h3>
                <p className="text-xs text-slate-500 m-0 mt-0.5">
                  Context-aware readiness evaluation for {readiness?.target_role}
                </p>
              </div>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border whitespace-nowrap ${getTierBadge(tier)}`}>
                {tier}
              </span>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed p-3.5 bg-slate-50 rounded-lg border border-slate-200 mb-4">
              Candidate demonstrates an overall readiness score of{' '}
              <strong className="font-mono tabular-nums text-slate-900">{overallScore}%</strong>. Academic standing is rated at{' '}
              <span className="font-mono tabular-nums text-slate-900">{academicPct}%</span> with{' '}
              <span className="font-mono tabular-nums text-slate-900">{Math.round(readiness?.skill_index || 0)}%</span> role skill alignment.
              {readiness?.missing_skills?.length ? (
                <> Key focal gaps include <strong className="text-slate-800">{readiness.missing_skills.slice(0, 3).join(', ')}</strong>.</>
              ) : null}
            </div>

            {/* Clear CTA Hierarchy */}
            <div className="flex flex-col gap-2 mt-4">
              {/* Primary Prominent Solid Dark Button */}
              <button
                type="button"
                onClick={() => onNavigateTab('action-plan')}
                className="w-full py-2.5 px-4 bg-slate-900 text-white hover:bg-slate-800 transition-colors rounded-lg font-semibold text-xs flex items-center justify-between shadow-xs cursor-pointer"
              >
                <span>Generate & View AI Action Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Secondary Clean Ghost Button / Subtle Inline Link */}
              <button
                type="button"
                onClick={() => onNavigateTab('evidence')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors py-1.5 px-2 rounded-md hover:bg-slate-100 cursor-pointer w-fit mt-1"
              >
                <span>+ Add assessments, projects & certifications</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Daily Commitment & Consistency Card */}
          <div className="panel p-5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Daily Study Commitment
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Action plans and milestone deadlines adapt dynamically to your daily available study allocation.
            </p>
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div>
                <div className="text-xs font-semibold text-slate-900">Active Streak Target</div>
                <div className="text-[11px] text-slate-500">Log task completions daily to build placement momentum</div>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-amber-50 text-amber-700 border-amber-200 font-mono tabular-nums whitespace-nowrap">
                {streakDays} Day Streak 🔥
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
