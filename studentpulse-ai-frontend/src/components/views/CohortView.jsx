import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCohort, downloadExportCsv } from '../../api/admin';
import {
  Users,
  Download,
  Search,
  RefreshCw,
  Sparkles,
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
      <div className="p-8 flex flex-col gap-6 bg-[#09090B] min-h-screen">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="panel skeleton h-[120px] rounded-2xl" />
          ))}
        </div>
        <div className="panel skeleton h-[420px] rounded-2xl" />
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
    <div className="p-8 flex flex-col gap-6 bg-[#09090B] min-h-screen">
      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="panel p-5 rounded-2xl flex flex-col justify-between hover:border-[#00FF66]/40 transition-all">
          <div className="text-xs font-mono font-semibold uppercase tracking-wider text-[#9CA3AF] mb-1">
            Total Cohort Candidates
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums">
            {cohortData?.total_students || 0}
          </div>
          <div className="text-xs text-[#6B7280] font-mono mt-1">
            KIET MCA AI & Python Program
          </div>
        </div>

        <div className="panel p-5 rounded-2xl flex flex-col justify-between hover:border-[#00FF66]/40 transition-all">
          <div className="text-xs font-mono font-semibold uppercase tracking-wider text-[#9CA3AF] mb-1">
            Cohort Average Readiness
          </div>
          <div className="text-3xl font-extrabold text-[#00FF66] font-mono tabular-nums drop-shadow-[0_0_8px_rgba(0,255,102,0.3)]">
            {Math.round(cohortData?.average_readiness || 0)}%
          </div>
          <div className="text-xs text-[#6B7280] font-mono mt-1">
            Across active evaluated students
          </div>
        </div>

        <div className="panel p-5 rounded-2xl flex flex-col justify-between hover:border-[#00FF66]/40 transition-all">
          <div className="text-xs font-mono font-semibold uppercase tracking-wider text-[#9CA3AF] mb-1">
            Readiness Tier Distribution
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30">
              Ready: {tierCounts['Industry Ready'] || 0}
            </span>
            <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Dev: {tierCounts['Developing'] || 0}
            </span>
            <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Gap: {tierCounts['Needs Foundation'] || 0}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#18181D] border border-red-500/30 rounded-xl text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Cohort Table & Controls */}
      <div className="panel overflow-hidden rounded-2xl">
        {/* Controls Toolbar */}
        <div className="p-5 border-b border-[#222228] flex justify-between items-center flex-wrap gap-4 bg-[#0C0C0F]">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-56">
              <Search size={14} className="absolute left-3 top-3 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9 bg-[#111114] border-[#222228]"
              />
            </div>

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="text-xs h-9 w-auto px-3 bg-[#111114] border-[#222228]"
            >
              <option value="ALL">All Readiness Tiers</option>
              <option value="Industry Ready">Industry Ready</option>
              <option value="Developing">Developing</option>
              <option value="Needs Foundation">Needs Foundation</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs h-9 w-auto px-3 bg-[#111114] border-[#222228]"
            >
              <option value="ALL">All Target Roles</option>
              <option value="Full-Stack Developer">Full-Stack Developer</option>
              <option value="AI/ML Engineer">AI/ML Engineer</option>
              <option value="Backend Python Developer">Backend Python Developer</option>
              <option value="Data Analyst">Data Analyst</option>
            </select>
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              className="btn-secondary h-9 px-3"
              onClick={loadCohort}
              title="Refresh roster telemetry"
            >
              <RefreshCw size={13} />
            </button>
            <button
              type="button"
              className="btn-primary h-9 px-4 text-xs font-bold"
              onClick={handleExportCsv}
              disabled={downloading}
            >
              <Download size={13} />
              <span>{downloading ? 'Exporting...' : 'Export Cohort CSV'}</span>
            </button>
          </div>
        </div>

        {/* Student Roster Table */}
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Candidate</th>
                <th>Roll Number</th>
                <th>Target Role</th>
                <th>Readiness Score</th>
                <th>Academic Avg</th>
                <th>Skill Alignment</th>
                <th>Tier</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[#6B7280] font-mono">
                    No candidates matched query filters.
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
                        <div className="font-semibold text-white">{s.name}</div>
                        <div className="text-[11px] text-[#9CA3AF] font-mono">{s.email}</div>
                      </td>
                      <td className="font-mono tabular-nums text-white text-xs">
                        {s.enrollment_no || 'N/A'}
                      </td>
                      <td className="text-[#9CA3AF]">
                        {s.target_role || 'Full-Stack Developer'}
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono tabular-nums font-bold text-white w-8 text-xs">
                            {score}%
                          </span>
                          <div className="w-20 h-1.5 bg-[#18181D] rounded-full overflow-hidden border border-[#222228]">
                            <div
                              className={`h-full rounded-full ${
                                score >= 75 ? 'bg-[#00FF66]' : score >= 50 ? 'bg-[#60A5FA]' : 'bg-[#F59E0B]'
                              }`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="font-mono tabular-nums text-white text-xs">
                        {Math.round(s.academic_index || 0)}%
                      </td>
                      <td className="font-mono tabular-nums text-white text-xs">
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
