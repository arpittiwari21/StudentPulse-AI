// ─────────────────────────────────────────────────────────────────────────────
// frontend/js/admin.js
// Faculty / Coordinator cohort analytics, skill-gap chart, CSV export
// Institutional typography and layout design
// ─────────────────────────────────────────────────────────────────────────────

let cohortBarChart = null;
let skillGapChart = null;
let cohortData = [];

async function loadAdminView() {
  try {
    const [cohortRes, gapRes] = await Promise.all([
      API.getCohort(),
      API.getSkillGaps(),
    ]);
    cohortData = cohortRes.students || [];
    renderKPICards(cohortRes.kpis || {});
    renderCohortTable(cohortData);
    renderSkillGapChart(gapRes);
    renderRoleDistributionChart(cohortRes.kpis?.role_distribution || {});
  } catch (err) {
    showError(err.message);
  }
}

function renderKPICards(kpis) {
  document.getElementById("kpi-total").textContent = kpis.total_students || 0;
  document.getElementById("kpi-avg-score").textContent =
    kpis.avg_readiness_score ? `${kpis.avg_readiness_score}%` : "—";

  const tiers = kpis.tier_distribution || {};
  document.getElementById("kpi-industry-ready").textContent = tiers["Industry Ready"] || 0;
  document.getElementById("kpi-developing").textContent = tiers["Developing"] || 0;
  document.getElementById("kpi-needs-foundation").textContent = tiers["Needs Foundation"] || 0;
}

function renderCohortTable(students) {
  const tbody = document.getElementById("cohort-tbody");
  if (!tbody) return;

  if (!students.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-400 font-mono text-xs">No registered candidates in database.</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => {
    const tierBadge = {
      "Industry Ready": "bg-emerald-50 text-emerald-800 border-emerald-200",
      "Developing": "bg-blue-50 text-blue-800 border-blue-200",
      "Needs Foundation": "bg-amber-50 text-amber-800 border-amber-200",
    }[s.readiness_tier] || "bg-slate-50 text-slate-700 border-slate-200";

    const scoreColor = s.overall_score >= 80 ? "text-emerald-700" :
                       s.overall_score >= 60 ? "text-blue-700" : "text-amber-700";

    const barColor = s.overall_score >= 80 ? "bg-emerald-600" :
                     s.overall_score >= 60 ? "bg-blue-600" : "bg-amber-500";

    return `
      <tr class="hover:bg-slate-50/70 transition-colors">
        <td class="px-4 py-3 font-semibold text-slate-900">${s.name}</td>
        <td class="px-4 py-3 text-slate-500 font-mono text-[11px]">${s.enrollment_no || "—"}</td>
        <td class="px-4 py-3 text-slate-700 font-medium">${s.target_role}</td>
        <td class="px-4 py-3 font-mono font-bold ${scoreColor}">${s.overall_score}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded border text-[10px] font-mono font-semibold ${tierBadge}">${s.readiness_tier}</span>
        </td>
        <td class="px-4 py-3 text-slate-500 text-[11px] font-mono">${(s.missing_skills || []).slice(0, 3).join(", ") || "None"}</td>
        <td class="px-4 py-3">
          <div class="w-24 bg-slate-100 rounded-full h-1.5">
            <div class="h-1.5 rounded-full ${barColor}" style="width:${s.overall_score}%"></div>
          </div>
        </td>
      </tr>`;
  }).join("");
}

function renderSkillGapChart(data) {
  const ctx = document.getElementById("skill-gap-chart");
  if (!ctx) return;
  if (skillGapChart) skillGapChart.destroy();

  skillGapChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.labels || [],
      datasets: [{
        label: "Candidates with skill deficit",
        data: data.counts || [],
        backgroundColor: "rgba(37, 99, 235, 0.8)",
        borderColor: "#2563eb",
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.raw} candidate${ctx.raw !== 1 ? "s" : ""} require training in this skill`,
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { stepSize: 1, font: { family: "'JetBrains Mono', monospace", size: 10 } },
          grid: { color: "#f1f5f9" }
        },
        y: {
          ticks: { font: { family: "'Plus Jakarta Sans', sans-serif", size: 10, weight: 500 } },
          grid: { display: false }
        },
      },
    },
  });
}

function renderRoleDistributionChart(roleData) {
  const ctx = document.getElementById("role-dist-chart");
  if (!ctx) return;
  if (cohortBarChart) cohortBarChart.destroy();

  const labels = Object.keys(roleData);
  const values = Object.values(roleData);
  const colors = ["#2563eb", "#059669", "#d97706", "#475569"];

  cohortBarChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: "#ffffff",
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 10, weight: 600 },
            boxWidth: 10,
            padding: 8
          }
        },
      },
    },
  });
}

function filterCohortTable() {
  const query = (document.getElementById("cohort-search")?.value || "").toLowerCase();
  const tierFilter = document.getElementById("tier-filter")?.value || "";
  const filtered = cohortData.filter(s => {
    const matchSearch = !query ||
      s.name.toLowerCase().includes(query) ||
      (s.enrollment_no || "").toLowerCase().includes(query) ||
      s.target_role.toLowerCase().includes(query);
    const matchTier = !tierFilter || s.readiness_tier === tierFilter;
    return matchSearch && matchTier;
  });
  renderCohortTable(filtered);
}

function downloadCSV() {
  const url = API.exportCSV();
  const a = document.createElement("a");
  a.href = url;
  a.download = "studentpulse_cohort.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

window.loadAdminView = loadAdminView;
window.filterCohortTable = filterCohortTable;
window.downloadCSV = downloadCSV;
