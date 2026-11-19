// ─────────────────────────────────────────────────────────────────────────────
// frontend/js/student.js
// 4-view Student SPA: Profile, Evidence, AI Plan, Progress
// Refactored per frontend-design guidance for distinctive institutional UX
// ─────────────────────────────────────────────────────────────────────────────

// ─── State ───────────────────────────────────────────────────────────────────
let radarChart = null;
let weeklyChart = null;
let scoreChart = null;
let currentPlanId = null;
let flashcardIndex = 0;
let flashcards = [];
let currentView = "home";

// ─── View Navigation ─────────────────────────────────────────────────────────
function showView(viewId) {
  document.querySelectorAll(".sp-view").forEach(v => v.classList.add("hidden"));
  const el = document.getElementById(`view-${viewId}`);
  if (el) el.classList.remove("hidden");
  currentView = viewId;

  // Update nav active state
  document.querySelectorAll("[data-nav]").forEach(n => {
    n.classList.toggle("nav-active", n.dataset.nav === viewId);
  });

  // Load data for view
  if (viewId === "profile" && isLoggedIn()) loadProfileView();
  if (viewId === "plan" && isLoggedIn()) loadPlanView();
  if (viewId === "progress" && isLoggedIn()) loadProgressView();
  if (viewId === "admin" && getRole() === "faculty") loadAdminView();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById("login-btn");
  btn.disabled = true;
  btn.textContent = "Verifying…";
  try {
    const data = await API.login({
      email: document.getElementById("login-email").value,
      password: document.getElementById("login-password").value,
    });
    setSession(data);
    postLoginRedirect();
  } catch (err) {
    showError(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign in";
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById("register-btn");
  btn.disabled = true;
  btn.textContent = "Registering…";
  try {
    const data = await API.register({
      name: document.getElementById("reg-name").value,
      email: document.getElementById("reg-email").value,
      enrollment_no: document.getElementById("reg-enrollment").value,
      password: document.getElementById("reg-password").value,
    });
    setSession(data);
    showSuccess("Account registered successfully.");
    postLoginRedirect();
  } catch (err) {
    showError(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Complete registration";
  }
}

async function demoLogin(role) {
  const credentials = role === "faculty"
    ? { email: "faculty@kiet.edu", password: "Faculty@KIET2024" }
    : { email: "amarjeet.2628MCA0069@kiet.edu", password: "Student@123" };
  try {
    const data = await API.login(credentials);
    setSession(data);
    showSuccess(`Signed in as ${data.name}`);
    postLoginRedirect();
  } catch (err) {
    showError(err.message);
  }
}

function postLoginRedirect() {
  updateNavForUser();
  showView(getRole() === "faculty" ? "admin" : "profile");
}

function handleLogout() {
  clearSession();
  updateNavForUser();
  showView("home");
  showSuccess("Signed out.");
}

function updateNavForUser() {
  const loggedIn = isLoggedIn();
  const role = getRole();

  document.getElementById("nav-auth-links").classList.toggle("hidden", loggedIn);
  document.getElementById("nav-user-menu").classList.toggle("hidden", !loggedIn);
  document.getElementById("nav-name").textContent = loggedIn ? getUserName() : "";

  // Show/hide nav items
  document.querySelectorAll("[data-auth-required]").forEach(el => {
    el.classList.toggle("hidden", !loggedIn);
  });
  document.querySelectorAll("[data-role='faculty']").forEach(el => {
    el.classList.toggle("hidden", role !== "faculty");
  });
}

// ─── View 2: Profile & Evidence ───────────────────────────────────────────────
async function loadProfileView() {
  try {
    const user = await API.me();
    // Populate context form
    document.getElementById("ctx-role").value = user.target_role || "Full-Stack Developer";
    document.getElementById("ctx-hours").value = user.daily_hours || 2;
    document.getElementById("ctx-focus").value = user.focus_area || "Projects";
    document.getElementById("profile-name").textContent = user.name;
    document.getElementById("profile-email").textContent = user.email;
    document.getElementById("profile-enrollment").textContent = user.enrollment_no ? `ID: ${user.enrollment_no}` : "Student Candidate";

    // Set initials monogram
    const initials = user.name
      ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
      : "ST";
    const initialsEl = document.getElementById("profile-initials");
    if (initialsEl) initialsEl.textContent = initials;

    // Load all evidence in parallel
    const [assessments, projects, certs] = await Promise.all([
      API.getAssessments(),
      API.getProjects(),
      API.getCerts(),
    ]);
    renderAssessments(assessments);
    renderProjects(projects);
    renderCerts(certs);
  } catch (err) {
    showError(err.message);
  }
}

async function saveContext(e) {
  e.preventDefault();
  try {
    await API.updateContext({
      target_role: document.getElementById("ctx-role").value,
      daily_hours: parseFloat(document.getElementById("ctx-hours").value),
      focus_area: document.getElementById("ctx-focus").value,
    });
    showSuccess("Learning context updated.");
  } catch (err) {
    showError(err.message);
  }
}

// ── Assessments ──
function renderAssessments(list) {
  const el = document.getElementById("assessment-list");
  if (!el) return;
  el.innerHTML = list.length ? list.map(a => {
    const pct = Math.round((a.score / a.max_score) * 100);
    const scoreColor = pct >= 75 ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
                       pct >= 60 ? "text-blue-700 bg-blue-50 border-blue-200" :
                       "text-amber-700 bg-amber-50 border-amber-200";

    return `
    <div class="evidence-card flex items-center justify-between gap-3 bg-white rounded-lg p-2.5 border border-slate-200">
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-xs text-slate-900 truncate">${a.subject}</p>
        <p class="text-[11px] text-slate-500 font-mono mt-0.5">${a.type} · ${a.score}/${a.max_score}</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs font-mono font-bold px-2 py-0.5 rounded border ${scoreColor}">
          ${pct}%
        </span>
        <button onclick="deleteAssessment(${a.id})" title="Delete assessment" class="text-slate-400 hover:text-red-500 transition-colors p-1">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>`;
  }).join("") :
  `<p class="text-slate-400 text-xs text-center py-4 font-mono">No assessments recorded in ledger.</p>`;
  if (window.lucide) lucide.createIcons();
}

async function addAssessment(e) {
  e.preventDefault();
  try {
    await API.addAssessment({
      subject: document.getElementById("a-subject").value,
      score: document.getElementById("a-score").value,
      max_score: document.getElementById("a-max").value || 100,
      type: document.getElementById("a-type").value,
    });
    e.target.reset();
    document.getElementById("a-max").value = "100";
    renderAssessments(await API.getAssessments());
    showSuccess("Assessment recorded.");
  } catch (err) { showError(err.message); }
}

async function deleteAssessment(id) {
  try {
    await API.deleteAssessment(id);
    renderAssessments(await API.getAssessments());
  } catch (err) { showError(err.message); }
}

// ── Projects ──
function renderProjects(list) {
  const el = document.getElementById("project-list");
  if (!el) return;
  const complexityBadge = {
    Beginner: "bg-slate-100 text-slate-700 border-slate-200",
    Intermediate: "bg-blue-50 text-blue-700 border-blue-200",
    Advanced: "bg-purple-50 text-purple-700 border-purple-200"
  };

  el.innerHTML = list.length ? list.map(p => `
    <div class="evidence-card bg-white rounded-lg p-3 border border-slate-200 space-y-2">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="font-semibold text-xs text-slate-900 truncate">${p.title}</p>
            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${complexityBadge[p.complexity] || "bg-slate-100 text-slate-700 border-slate-200"}">${p.complexity}</span>
          </div>
          <p class="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">${p.description || "No description provided."}</p>
          <div class="flex flex-wrap gap-1 mt-2">
            ${p.tech_stack ? p.tech_stack.split(",").map(t => `<span class="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[10px] font-mono font-medium">${t.trim()}</span>`).join("") : ""}
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0 ml-2">
          ${p.github_url ? `<a href="${p.github_url}" target="_blank" rel="noopener" class="text-slate-400 hover:text-slate-700 p-1" title="View repository"><i data-lucide="external-link" class="w-3.5 h-3.5"></i></a>` : ""}
          <button onclick="deleteProject(${p.id})" title="Delete project" class="text-slate-400 hover:text-red-500 transition-colors p-1">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    </div>`).join("") :
  `<p class="text-slate-400 text-xs text-center py-4 font-mono">No project evidence recorded yet.</p>`;
  if (window.lucide) lucide.createIcons();
}

async function addProject(e) {
  e.preventDefault();
  try {
    await API.addProject({
      title: document.getElementById("p-title").value,
      description: document.getElementById("p-desc").value,
      tech_stack: document.getElementById("p-tech").value,
      complexity: document.getElementById("p-complexity").value,
      github_url: document.getElementById("p-github").value,
    });
    e.target.reset();
    renderProjects(await API.getProjects());
    showSuccess("Project deliverable documented.");
  } catch (err) { showError(err.message); }
}

async function deleteProject(id) {
  try {
    await API.deleteProject(id);
    renderProjects(await API.getProjects());
  } catch (err) { showError(err.message); }
}

// ── Certifications ──
function renderCerts(list) {
  const el = document.getElementById("cert-list");
  if (!el) return;
  el.innerHTML = list.length ? list.map(c => `
    <div class="evidence-card flex items-center justify-between gap-3 bg-white rounded-lg p-2.5 border border-slate-200">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <p class="font-semibold text-xs text-slate-900 truncate">${c.title}</p>
          <span class="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200">${c.type}</span>
        </div>
        <p class="text-[11px] text-slate-500 mt-0.5 font-mono">${c.issuer || "Verified"}${c.issued_date ? " · " + c.issued_date : ""}</p>
      </div>
      <button onclick="deleteCert(${c.id})" title="Delete certification" class="text-slate-400 hover:text-red-500 transition-colors p-1 shrink-0">
        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
      </button>
    </div>`).join("") :
  `<p class="text-slate-400 text-xs text-center py-4 font-mono">No external credentials recorded.</p>`;
  if (window.lucide) lucide.createIcons();
}

async function addCert(e) {
  e.preventDefault();
  try {
    await API.addCert({
      title: document.getElementById("c-title").value,
      issuer: document.getElementById("c-issuer").value,
      type: document.getElementById("c-type").value,
      issued_date: document.getElementById("c-date").value,
    });
    e.target.reset();
    renderCerts(await API.getCerts());
    showSuccess("Credential documented.");
  } catch (err) { showError(err.message); }
}

async function deleteCert(id) {
  try {
    await API.deleteCert(id);
    renderCerts(await API.getCerts());
  } catch (err) { showError(err.message); }
}

// ─── View 3: AI Readiness & Action Plan ──────────────────────────────────────
async function loadPlanView() {
  document.getElementById("plan-loading").classList.remove("hidden");
  document.getElementById("plan-content").classList.add("hidden");
  try {
    const [readRes, planRes] = await Promise.all([
      API.getReadiness(),
      API.getPlan(),
    ]);
    renderReadinessScore(readRes.readiness);
    renderRadarChart(readRes.radar);
    if (planRes.plan) {
      currentPlanId = planRes.plan.id;
      document.getElementById("ai-diagnosis").textContent = planRes.plan.diagnosis || "Generate your AI plan to see a personalised diagnosis.";
      renderMilestones(planRes.tasks || []);
      flashcards = planRes.plan.interview_questions || [];
      flashcardIndex = 0;
      renderFlashcard();
      document.getElementById("ai-source-badge").textContent = "Saved Plan";
    } else {
      document.getElementById("ai-diagnosis").textContent = "Select 'Regenerate AI plan' above to trigger hybrid diagnostic evaluation and build your 90-day action plan.";
      renderMilestones([]);
    }
    document.getElementById("plan-loading").classList.add("hidden");
    document.getElementById("plan-content").classList.remove("hidden");
  } catch (err) {
    showError(err.message);
    document.getElementById("plan-loading").classList.add("hidden");
  }
}

async function generatePlan() {
  const btn = document.getElementById("generate-plan-btn");
  btn.disabled = true;
  btn.innerHTML = `<svg class="animate-spin w-3.5 h-3.5 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/></svg>Computing…`;
  document.getElementById("plan-loading").classList.remove("hidden");
  document.getElementById("plan-content").classList.add("hidden");

  try {
    const res = await API.generatePlan();
    currentPlanId = res.plan_id;
    renderReadinessScore(res.readiness);
    renderRadarChart(res.radar);
    document.getElementById("ai-diagnosis").textContent = res.diagnosis;
    renderMilestones(flattenTasks(res.action_plan, res.plan_id));
    flashcards = res.interview_questions || [];
    flashcardIndex = 0;
    renderFlashcard();
    const sourceLabels = {
      "gemini-4-hydrogen": "Gemini 4 Hydrogen",
      "agy-agent": "Antigravity Agent",
      "groq": "Groq LLaMA-3",
      "offline_fallback": "Offline Deterministic"
    };
    document.getElementById("ai-source-badge").textContent = sourceLabels[res.ai_source] || res.ai_source;
    document.getElementById("plan-loading").classList.add("hidden");
    document.getElementById("plan-content").classList.remove("hidden");
    showSuccess("Plan generated and saved.");
  } catch (err) {
    showError(err.message);
    document.getElementById("plan-loading").classList.add("hidden");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="refresh-cw" class="w-3.5 h-3.5 inline mr-1.5"></i> Regenerate AI plan`;
    if (window.lucide) lucide.createIcons();
  }
}

function flattenTasks(actionPlan, planId) {
  const tasks = [];
  (actionPlan || []).forEach(m => {
    (m.tasks || []).forEach((t, i) => {
      tasks.push({
        id: null,
        plan_id: planId,
        milestone: m.milestone,
        title: t.title,
        description: t.description,
        priority: t.priority,
        target_days: t.target_days,
        completed: 0,
        sort_order: i,
      });
    });
  });
  return tasks;
}

function renderReadinessScore(report) {
  if (!report) return;
  const score = report.overall_score || 0;
  document.getElementById("score-value").textContent = score.toFixed(1);
  
  const tierEl = document.getElementById("score-tier");
  tierEl.textContent = report.readiness_tier || "";
  tierEl.className = {
    "Industry Ready": "font-mono text-xs font-bold px-2 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-800",
    "Developing": "font-mono text-xs font-bold px-2 py-0.5 rounded border border-blue-300 bg-blue-50 text-blue-800",
    "Needs Foundation": "font-mono text-xs font-bold px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-800",
  }[report.readiness_tier] || "font-mono text-xs font-bold px-2 py-0.5 rounded border border-slate-300 bg-slate-50 text-slate-800";

  document.getElementById("score-academic").textContent = `${report.academic_index?.toFixed(0)}%`;
  document.getElementById("score-skill").textContent = `${report.skill_index?.toFixed(0)}%`;
  document.getElementById("score-evidence").textContent = `${report.evidence_index?.toFixed(0)}%`;
  document.getElementById("score-match-pct").textContent = `${report.skill_match_pct || 0}%`;

  // Matched and Missing skill tags
  const matchEl = document.getElementById("matched-skills");
  const missEl = document.getElementById("missing-skills");
  if (matchEl) matchEl.innerHTML = (report.matched_skills || []).slice(0, 12).map(s =>
    `<span class="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-[11px] font-mono">${s}</span>`).join("");
  if (missEl) missEl.innerHTML = (report.missing_skills || []).slice(0, 12).map(s =>
    `<span class="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-900 rounded text-[11px] font-mono">${s}</span>`).join("");
}

function renderRadarChart(radar) {
  const ctx = document.getElementById("radar-chart");
  if (!ctx || !radar) return;
  if (radarChart) radarChart.destroy();

  radarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: radar.labels || [],
      datasets: [{
        label: "Candidate profile",
        data: radar.scores || [],
        backgroundColor: "rgba(37, 99, 235, 0.12)",
        borderColor: "#2563eb",
        pointBackgroundColor: "#2563eb",
        pointBorderColor: "#ffffff",
        pointHoverBackgroundColor: "#ffffff",
        pointHoverBorderColor: "#2563eb",
        borderWidth: 2,
        pointRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` ${context.dataset.label}: ${context.raw}%`
          }
        }
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          beginAtZero: true,
          ticks: {
            stepSize: 25,
            font: { family: "'JetBrains Mono', monospace", size: 9 },
            backdropColor: 'transparent',
            color: '#94a3b8'
          },
          grid: { color: "#e2e8f0" },
          pointLabels: {
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 10, weight: 600 },
            color: '#475569'
          },
        },
      },
    },
  });
}

// ── Milestones & Editable Tasks ──
function renderMilestones(tasks) {
  const container = document.getElementById("milestones-container");
  if (!container) return;

  if (!tasks.length) {
    container.innerHTML = `<div class="text-center py-10 text-slate-400 font-mono text-xs col-span-2">No active action plan loaded. Select "Regenerate AI plan" to build milestones.</div>`;
    return;
  }

  const byMilestone = { 1: [], 2: [], 3: [], 4: [] };
  tasks.forEach(t => { if (byMilestone[t.milestone]) byMilestone[t.milestone].push(t); });

  const phaseNames = [
    "Phase 1: Foundation & Core Gaps",
    "Phase 2: Full-Stack Architecture",
    "Phase 3: Deep Systems & Evidence",
    "Phase 4: Interview & Placement Sprint"
  ];

  const priorityStyles = {
    High: "bg-red-50 text-red-700 border-red-200",
    Medium: "bg-slate-50 text-slate-700 border-slate-200",
    Low: "bg-slate-50 text-slate-500 border-slate-200",
  };

  container.innerHTML = [1, 2, 3, 4].map(m => {
    const mTasks = byMilestone[m];
    const done = mTasks.filter(t => t.completed).length;
    const pct = mTasks.length ? Math.round((done / mTasks.length) * 100) : 0;
    
    return `
    <div class="border border-slate-200 rounded-xl p-4 bg-white flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-2">
          <div>
            <span class="text-[10px] font-mono text-slate-400 uppercase tracking-tight">Milestone ${m} of 4</span>
            <h4 class="font-bold text-xs text-slate-900 mt-0.5">${phaseNames[m - 1]}</h4>
          </div>
          <div class="text-right">
            <span class="text-xs font-mono font-semibold text-slate-700">${done}/${mTasks.length}</span>
            <div class="w-16 bg-slate-100 rounded-full h-1 mt-1">
              <div class="h-1 rounded-full bg-blue-600" style="width:${pct}%"></div>
            </div>
          </div>
        </div>

        <div class="space-y-2 mt-3">
          ${mTasks.map(t => `
            <div class="task-row flex items-start gap-2.5 p-2 rounded-lg border border-slate-100 group" id="task-${t.id}">
              <input type="checkbox" ${t.completed ? "checked" : ""}
                onchange="toggleTask(${t.id}, this.checked)"
                class="mt-0.5 w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer shrink-0">
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-slate-800 ${t.completed ? 'line-through text-slate-400' : ''} task-title leading-snug">${t.title}</p>
                <p class="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">${t.description || ""}</p>
                ${t.target_date ? `<p class="text-[10px] font-mono text-slate-400 mt-1">Target: ${t.target_date}</p>` : ""}
              </div>
              <div class="flex items-center gap-1 shrink-0 ml-1">
                <span class="px-1.5 py-0.2 rounded border text-[10px] font-mono font-semibold ${priorityStyles[t.priority] || 'bg-slate-50 text-slate-600 border-slate-200'}">${t.priority}</span>
                <button onclick="openEditTask(${t.id})" class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-800 transition-opacity p-0.5" title="Edit task">
                  <i data-lucide="pencil" class="w-3 h-3"></i>
                </button>
                <button onclick="deleteTask(${t.id})" class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-0.5" title="Delete task">
                  <i data-lucide="trash-2" class="w-3 h-3"></i>
                </button>
              </div>
            </div>`).join("")}
        </div>
      </div>

      <button onclick="showAddTaskModal(${m})"
        class="mt-3 w-full text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg py-1.5 border border-dashed border-slate-300 transition-colors flex items-center justify-center gap-1 font-medium">
        <i data-lucide="plus" class="w-3.5 h-3.5"></i> Append task
      </button>
    </div>`;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

async function toggleTask(id, completed) {
  if (!id) return;
  try {
    await API.updateTask(id, { completed });
    const titleEl = document.querySelector(`#task-${id} .task-title`);
    if (titleEl) titleEl.classList.toggle("line-through", completed);
    if (completed) showSuccess("Task marked complete.");
  } catch (err) { showError(err.message); }
}

async function deleteTask(id) {
  if (!id || !confirm("Delete this plan task?")) return;
  try {
    await API.deleteTask(id);
    document.getElementById(`task-${id}`)?.remove();
    showSuccess("Task deleted.");
  } catch (err) { showError(err.message); }
}

function showAddTaskModal(milestone) {
  document.getElementById("modal-milestone").value = milestone;
  document.getElementById("add-task-modal").classList.remove("hidden");
}

function hideAddTaskModal() {
  document.getElementById("add-task-modal").classList.add("hidden");
  document.getElementById("add-task-form").reset();
}

async function submitAddTask(e) {
  e.preventDefault();
  try {
    await API.addTask({
      milestone: parseInt(document.getElementById("modal-milestone").value),
      title: document.getElementById("modal-task-title").value,
      description: document.getElementById("modal-task-desc").value,
      priority: document.getElementById("modal-task-priority").value,
      target_date: document.getElementById("modal-task-date").value,
    });
    hideAddTaskModal();
    const planRes = await API.getPlan();
    renderMilestones(planRes.tasks || []);
    showSuccess("Task added to milestone.");
  } catch (err) { showError(err.message); }
}

function openEditTask(id) {
  const taskEl = document.getElementById(`task-${id}`);
  if (!taskEl) return;
  const title = taskEl.querySelector(".task-title")?.textContent || "";
  document.getElementById("edit-task-id").value = id;
  document.getElementById("edit-task-title").value = title;
  document.getElementById("edit-task-modal").classList.remove("hidden");
}

function hideEditTaskModal() {
  document.getElementById("edit-task-modal").classList.add("hidden");
}

async function submitEditTask(e) {
  e.preventDefault();
  const id = document.getElementById("edit-task-id").value;
  try {
    await API.updateTask(id, {
      title: document.getElementById("edit-task-title").value,
      priority: document.getElementById("edit-task-priority").value,
      target_date: document.getElementById("edit-task-date").value,
    });
    hideEditTaskModal();
    const planRes = await API.getPlan();
    renderMilestones(planRes.tasks || []);
    showSuccess("Task updated.");
  } catch (err) { showError(err.message); }
}

// ── Flashcard Interview Prep ──
function renderFlashcard() {
  const el = document.getElementById("flashcard-text");
  const counter = document.getElementById("flashcard-counter");
  if (!el) return;
  if (!flashcards.length) {
    el.textContent = "Generate your AI plan to unlock role-specific interview rehearsal questions.";
    if (counter) counter.textContent = "";
    return;
  }
  el.textContent = flashcards[flashcardIndex];
  if (counter) counter.textContent = `${flashcardIndex + 1} / ${flashcards.length}`;
  const card = document.getElementById("flashcard");
  if (card) { card.classList.remove("flipped"); }
}

function prevFlashcard() {
  flashcardIndex = (flashcardIndex - 1 + flashcards.length) % flashcards.length;
  renderFlashcard();
}

function nextFlashcard() {
  flashcardIndex = (flashcardIndex + 1) % flashcards.length;
  renderFlashcard();
}

function flipFlashcard() {
  document.getElementById("flashcard")?.classList.toggle("flipped");
}

// ─── View 4: Progress & Streaks ───────────────────────────────────────────────
async function loadProgressView() {
  try {
    const data = await API.getProgress();
    document.getElementById("streak-count").textContent = data.streak;
    document.getElementById("active-days").textContent = data.active_days;
    document.getElementById("tasks-done").textContent = `${data.completed_tasks} / ${data.total_tasks}`;
    document.getElementById("completion-pct").textContent = `${data.completion_pct}%`;

    renderWeeklyChart(data.weekly_data || []);
    renderScoreChart(data.score_history || []);
  } catch (err) {
    showError(err.message);
  }
}

function renderWeeklyChart(weeklyData) {
  const ctx = document.getElementById("weekly-chart");
  if (!ctx) return;
  if (weeklyChart) weeklyChart.destroy();

  const labels = weeklyData.map(d => {
    const dt = new Date(d.date);
    return dt.toLocaleDateString("en-IN", { weekday: "short" });
  });

  weeklyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Deliverables Completed",
        data: weeklyData.map(d => d.tasks_done),
        backgroundColor: weeklyData.map(d =>
          d.tasks_done > 0 ? "#2563eb" : "#e2e8f0"),
        borderRadius: 4,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` ${context.raw} deliverables completed`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, font: { family: "'JetBrains Mono', monospace", size: 10 } },
          grid: { color: "#f1f5f9" }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } }
        },
      },
    },
  });
}

function renderScoreChart(history) {
  const ctx = document.getElementById("score-chart");
  if (!ctx || !history.length) return;
  if (scoreChart) scoreChart.destroy();

  scoreChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: history.map(h => h.date),
      datasets: [{
        label: "Readiness Index",
        data: history.map(h => h.score),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.05)",
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointBackgroundColor: "#2563eb",
        pointBorderColor: "#ffffff",
        pointRadius: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` Readiness: ${context.raw}%`
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: { font: { family: "'JetBrains Mono', monospace", size: 10 } },
          grid: { color: "#f1f5f9" }
        },
        x: {
          ticks: { maxTicksLimit: 8, font: { family: "'JetBrains Mono', monospace", size: 10 } },
          grid: { display: false }
        },
      },
    },
  });
}

// ─── Initialisation ───────────────────────────────────────────────────────────
window.addEventListener("sp:logout", () => {
  updateNavForUser();
  showView("home");
});

window.addEventListener("DOMContentLoaded", () => {
  updateNavForUser();
  showView(isLoggedIn() ? (getRole() === "faculty" ? "admin" : "profile") : "home");
  if (window.lucide) lucide.createIcons();
});

// Expose all functions globally for inline HTML handlers
Object.assign(window, {
  showView, handleLogin, handleRegister, demoLogin, handleLogout,
  saveContext, addAssessment, deleteAssessment, addProject, deleteProject, addCert, deleteCert,
  generatePlan, toggleTask, deleteTask,
  showAddTaskModal, hideAddTaskModal, submitAddTask,
  openEditTask, hideEditTaskModal, submitEditTask,
  prevFlashcard, nextFlashcard, flipFlashcard,
});
