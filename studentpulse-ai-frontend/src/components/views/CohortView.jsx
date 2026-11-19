import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCohort, downloadExportCsv } from '../../api/admin';
import {
  Users,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  GraduationCap,
} from 'lucide-react';

export default function CohortView() {
  const { token } = useAuth();
  const [cohortData, setCohortData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const loadCohort = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCohort(token);
      setCohortData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch cohort data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCohort();
  }, [token]);

  const handleExportCsv = async () => {
    setDownloading(true);
    try {
      await downloadExportCsv(token);
    } catch (err) {
      alert(err.message || 'Failed to download cohort CSV.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="panel skeleton" style={{ height: '90px' }} />
          ))}
        </div>
        <div className="panel skeleton" style={{ height: '400px' }} />
      </div>
    );
  }

  const students = cohortData?.students || [];

  const filteredStudents = students.filter((s) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      (s.name && s.name.toLowerCase().includes(query)) ||
      (s.email && s.email.toLowerCase().includes(query)) ||
      (s.enrollment_no && s.enrollment_no.toLowerCase().includes(query));

    const matchesTier = tierFilter === 'ALL' || s.readiness_tier === tierFilter;
    const matchesRole = roleFilter === 'ALL' || s.target_role === roleFilter;

    return matchesSearch && matchesTier && matchesRole;
  });

  const tierCounts = cohortData?.tier_distribution || {};

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* KPI Cards Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="panel" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
            Total Cohort Candidates
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }} className="tabular-nums">
            {cohortData?.total_students || 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            MCA AI & Python Programming
          </div>
        </div>

        <div className="panel" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
            Cohort Average Readiness
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }} className="tabular-nums">
            {Math.round(cohortData?.average_readiness || 0)}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Across all active student submissions
          </div>
        </div>

        <div className="panel" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
            Readiness Tier Distribution
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
            <span className="pill pill-ready font-mono tabular-nums">
              Ready: {tierCounts['Industry Ready'] || 0}
            </span>
            <span className="pill pill-developing font-mono tabular-nums">
              Developing: {tierCounts['Developing'] || 0}
            </span>
            <span className="pill pill-gap font-mono tabular-nums">
              Gaps: {tierCounts['Needs Foundation'] || 0}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Cohort Table & Controls */}
      <div className="panel" style={{ overflow: 'hidden' }}>
        {/* Controls Toolbar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: '#a1a1aa' }} />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '30px', fontSize: '12px', height: '32px' }}
              />
            </div>

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              style={{ fontSize: '12px', height: '32px', width: 'auto', padding: '4px 10px' }}
            >
              <option value="ALL">All Readiness Tiers</option>
              <option value="Industry Ready">Industry Ready</option>
              <option value="Developing">Developing</option>
              <option value="Needs Foundation">Needs Foundation</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ fontSize: '12px', height: '32px', width: 'auto', padding: '4px 10px' }}
            >
              <option value="ALL">All Target Roles</option>
              <option value="Full-Stack Developer">Full-Stack Developer</option>
              <option value="AI/ML Engineer">AI/ML Engineer</option>
              <option value="Backend Python Developer">Backend Python Developer</option>
              <option value="Data Analyst">Data Analyst</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={loadCohort}
              title="Refresh roster"
              style={{ padding: '6px 10px' }}
            >
              <RefreshCw size={13} />
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleExportCsv}
              disabled={downloading}
              style={{ padding: '6px 12px' }}
            >
              <Download size={13} />
              <span>{downloading ? 'Exporting...' : 'Export Cohort CSV'}</span>
            </button>
          </div>
        </div>

        {/* Student Roster Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Candidate</th>
                <th>Roll Number</th>
                <th>Target Role</th>
                <th>Readiness Score</th>
                <th>Academic Avg</th>
                <th>Skill Alignment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No students match the current filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const score = Math.round(s.overall_score || 0);
                  const tier = s.readiness_tier || 'Developing';
                  const tierClass =
                    tier === 'Industry Ready' ? 'pill-ready' : tier === 'Developing' ? 'pill-developing' : 'pill-gap';

                  return (
                    <tr key={s.user_id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.email}</div>
                      </td>
                      <td className="font-mono tabular-nums" style={{ fontSize: '12px' }}>
                        {s.enrollment_no || 'N/A'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {s.target_role || 'Full-Stack Developer'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="font-mono tabular-nums" style={{ fontWeight: 600, width: '32px' }}>
                            {score}%
                          </span>
                          <div style={{ width: '80px', height: '4px', backgroundColor: '#f4f4f5', borderRadius: '2px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${score}%`,
                                height: '100%',
                                backgroundColor: score >= 75 ? '#059669' : score >= 50 ? '#2563eb' : '#dc2626',
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="font-mono tabular-nums">
                        {Math.round(s.academic_index || 0)}%
                      </td>
                      <td className="font-mono tabular-nums">
                        {Math.round(s.skill_index || 0)}%
                      </td>
                      <td>
                        <span className={`pill ${tierClass}`}>{tier}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
