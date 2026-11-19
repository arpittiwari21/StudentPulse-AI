import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getReadiness, getProgress } from '../../api/student';
import {
  TrendingUp,
  Award,
  BookOpen,
  FolderGit2,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

function RadarChart({ labels, scores }) {
  if (!labels || !scores || labels.length === 0) return null;

  const size = 260;
  const center = size / 2;
  const radius = 90;
  const count = labels.length;

  const getCoordinates = (value, index) => {
    const angle = (Math.PI * 2 / count) * index - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const getLabelCoordinates = (index) => {
    const angle = (Math.PI * 2 / count) * index - Math.PI / 2;
    const r = radius + 22;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const rings = [0.25, 0.5, 0.75, 1.0];

  const polygonPoints = scores
    .map((s, i) => {
      const { x, y } = getCoordinates(s, i);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} style={{ overflow: 'visible' }}>
        {/* Concentric rings */}
        {rings.map((factor, idx) => {
          const ringPoints = Array.from({ length: count })
            .map((_, i) => {
              const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
              const r = radius * factor;
              return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
            })
            .join(' ');
          return (
            <polygon
              key={idx}
              points={ringPoints}
              fill="none"
              stroke="#e4e4e7"
              strokeWidth="1"
            />
          );
        })}

        {/* Spokes */}
        {Array.from({ length: count }).map((_, i) => {
          const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#e4e4e7"
              strokeWidth="1"
            />
          );
        })}

        {/* Value Polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(37, 99, 235, 0.15)"
          stroke="#2563eb"
          strokeWidth="1.5"
        />

        {/* Point markers */}
        {scores.map((s, i) => {
          const { x, y } = getCoordinates(s, i);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3.5"
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Axis Labels */}
        {labels.map((label, i) => {
          const { x, y } = getLabelCoordinates(i);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fontWeight="500"
              fill="#71717a"
            >
              {label}
            </text>
          );
        })}
      </svg>
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

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="panel skeleton" style={{ height: '90px' }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="panel skeleton" style={{ height: '360px' }} />
          <div className="panel skeleton" style={{ height: '360px' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c' }}>
          <p style={{ fontWeight: 600, margin: '0 0 6px 0' }}>Could not load overview</p>
          <p style={{ margin: 0, fontSize: '13px' }}>{error}</p>
          <button type="button" className="btn-secondary" onClick={loadData} style={{ marginTop: '12px' }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const overallScore = Math.round(readiness?.overall_score || 0);
  const tier = readiness?.readiness_tier || 'Developing';
  const tierClass =
    tier === 'Industry Ready' ? 'pill-ready' : tier === 'Developing' ? 'pill-developing' : 'pill-gap';

  const streakDays = progress?.streak_days || 0;
  const activeDays = progress?.active_days || 0;

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 4-Card KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* KPI 1: Overall Readiness */}
        <div className="panel" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>
              Overall Readiness
            </span>
            <span className={`pill ${tierClass}`}>{tier}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }} className="tabular-nums">
              {overallScore}%
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>composite score</span>
          </div>
          <div style={{ height: '4px', backgroundColor: '#f4f4f5', borderRadius: '2px', marginTop: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${overallScore}%`,
                height: '100%',
                backgroundColor: overallScore >= 75 ? '#059669' : overallScore >= 50 ? '#2563eb' : '#dc2626',
                borderRadius: '2px',
              }}
            />
          </div>
        </div>

        {/* KPI 2: Skill Alignment */}
        <div className="panel" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>
              Skill Alignment Index
            </span>
            <Award size={15} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }} className="tabular-nums">
              {Math.round(readiness?.skill_index || 0)}%
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>40% weight</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            <span className="font-mono tabular-nums">{readiness?.matched_skills?.length || 0}</span> matched •{' '}
            <span className="font-mono tabular-nums">{readiness?.missing_skills?.length || 0}</span> gaps
          </div>
        </div>

        {/* KPI 3: Academic Index */}
        <div className="panel" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>
              Academic & Exams Index
            </span>
            <BookOpen size={15} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }} className="tabular-nums">
              {Math.round(readiness?.academic_index || 0)}%
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>35% weight</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            {readiness?.weak_subjects?.length ? (
              <span style={{ color: '#b91c1c' }}>Weak: {readiness.weak_subjects.join(', ')}</span>
            ) : (
              <span style={{ color: '#047857' }}>All subjects above threshold</span>
            )}
          </div>
        </div>

        {/* KPI 4: Evidence & Streak */}
        <div className="panel" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>
              Study Streak & Consistency
            </span>
            <Flame size={15} style={{ color: '#ea580c' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }} className="tabular-nums">
              {streakDays} <span style={{ fontSize: '16px', fontWeight: 500 }}>days</span>
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({activeDays} active days)</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            <span className="font-mono tabular-nums">{readiness?.project_count || 0}</span> projects •{' '}
            <span className="font-mono tabular-nums">{readiness?.cert_count || 0}</span> certifications
          </div>
        </div>
      </div>

      {/* Main 2-Column Split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.2fr)', gap: '20px' }}>
        {/* Left Column: Radar & Skills Alignment */}
        <div className="panel" style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Competency & Evidence Matrix</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Multi-dimensional readiness breakdown against {readiness?.target_role}
            </p>
          </div>

          {radar && <RadarChart labels={radar.labels} scores={radar.scores} />}

          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                Verified Matched Skills ({readiness?.matched_skills?.length || 0})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {readiness?.matched_skills?.length ? (
                  readiness.matched_skills.map((skill, idx) => (
                    <span key={idx} className="pill pill-ready">
                      <CheckCircle2 size={10} />
                      {skill}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No matched skills yet.</span>
                )}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                Target Role Skill Gaps ({readiness?.missing_skills?.length || 0})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {readiness?.missing_skills?.length ? (
                  readiness.missing_skills.map((skill, idx) => (
                    <span key={idx} className="pill pill-gap">
                      <AlertTriangle size={10} />
                      {skill}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Zero skill gaps identified!</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Readiness Diagnosis & Next Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>AI Readiness Diagnosis</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Context-aware readiness evaluation for {readiness?.target_role}
                </p>
              </div>
              <span className={`pill ${tierClass}`}>{tier}</span>
            </div>

            <div
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                padding: '12px 14px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: '6px',
                border: '1px solid var(--border-default)',
                marginBottom: '16px',
              }}
            >
              Candidate demonstrates an overall readiness score of{' '}
              <strong className="font-mono tabular-nums">{overallScore}%</strong>. Academic standing is rated at{' '}
              <span className="font-mono tabular-nums">{Math.round(readiness?.academic_index || 0)}%</span> with{' '}
              <span className="font-mono tabular-nums">{Math.round(readiness?.skill_index || 0)}%</span> role skill alignment.
              {readiness?.missing_skills?.length ? (
                <> Key focal gaps include <strong>{readiness.missing_skills.slice(0, 3).join(', ')}</strong>.</>
              ) : null}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => onNavigateTab('action-plan')}
                style={{ padding: '10px 16px', width: '100%', justifyContent: 'space-between' }}
              >
                <span>Generate & View AI Action Plan</span>
                <ArrowRight size={14} />
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => onNavigateTab('evidence')}
                style={{ padding: '9px 16px', width: '100%', justifyContent: 'space-between' }}
              >
                <span>Add Assessments, Projects & Certifications</span>
                <FolderGit2 size={14} />
              </button>
            </div>
          </div>

          {/* Quick Consistency & Daily Commitment Card */}
          <div className="panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 8px 0' }}>Daily Study Commitment</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              Based on your context, the recommended pacing is tailored to your allocated hours.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#fafafa', border: '1px solid var(--border-default)', borderRadius: '6px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Active Streak Target</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Complete daily milestone tasks to build consistency</div>
              </div>
              <span className="pill pill-developing font-mono tabular-nums">
                {streakDays} Day Streak 🔥
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
