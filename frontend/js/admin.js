// ─────────────────────────────────────────────────────────────────────────────
// frontend/js/admin.js
// Faculty / Coordinator cohort analytics, skill-gap chart, CSV export
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
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-400">No student data available.</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => {
    const tierClass = {
      "Industry Ready": "bg-emerald-100 text-emerald-700",
      "Developing": "bg-blue-100 text-blue-700",
      "Needs Foundation": "bg-amber-100 text-amber-700",
    }[s.readiness_tier] || "bg-slate-100 text-slate-600";

    const scoreColor = s.overall_score >= 80 ? "text-emerald-600" :
                       s.overall_score >= 60 ? "text-blue-600" : "text-amber-600";

    return `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="px-4 py-3 font-medium text-slate-800">${s.name}</td>
        <td class="px-4 py-3 text-slate-500 text-xs">${s.enrollment_no || "—"}</td>
        <td class="px-4 py-3 text-slate-600">${s.target_role}</td>
        <td class="px-4 py-3 font-bold ${scoreColor}">${s.overall_score}/100</td>
        <td class="px-4 py-3">
          <span class="px-2 py-1 rounded-full text-xs font-semibold ${tierClass}">${s.readiness_tier}</span>
        </td>
        <td class="px-4 py-3 text-slate-500 text-xs">${(s.missing_skills || []).slice(0, 3).join(", ") || "—"}</td>
        <td class="px-4 py-3">
          <div class="w-full bg-slate-200 rounded-full h-2">
            <div class="h-2 rounded-full ${s.overall_score >= 80 ? 'bg-emerald-500' : s.overall_score >= 60 ? 'bg-blue-500' : 'bg-amber-500'}"
                 style="width:${s.overall_score}%"></div>
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
        label: "Students Missing Skill",
        data: data.counts || [],
        backgroundColor: "rgba(99, 102, 241, 0.75)",
        borderColor: "rgba(99, 102, 241, 1)",
        borderWidth: 1,
        borderRadius: 6,
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
            label: (ctx) => ` ${ctx.raw} student${ctx.raw !== 1 ? "s" : ""} missing this skill`,
          },
        },
      },
      scales: {
        x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: "#f1f5f9" } },
        y: { ticks: { font: { size: 11 } }, grid: { display: false } },
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
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];

  cohortBarChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: "#fff",
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "right", labels: { font: { size: 11 }, boxWidth: 12 } },
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
