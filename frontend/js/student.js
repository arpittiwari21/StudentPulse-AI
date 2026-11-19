// ─────────────────────────────────────────────────────────────────────────────
// frontend/js/student.js
// 4-view Student SPA: Profile, Evidence, AI Plan, Progress
// Editable roadmap, flashcard carousel, Chart.js radar + bar charts
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
  btn.textContent = "Signing in…";
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
    btn.textContent = "Sign In";
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById("register-btn");
  btn.disabled = true;
  btn.textContent = "Creating account…";
  try {
    const data = await API.register({
      name: document.getElementById("reg-name").value,
      email: document.getElementById("reg-email").value,
      enrollment_no: document.getElementById("reg-enrollment").value,
      password: document.getElementById("reg-password").value,
    });
    setSession(data);
    showSuccess("Account created! Welcome to StudentPulse AI.");
    postLoginRedirect();
  } catch (err) {
    showError(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Create Account";
  }
}

async function demoLogin(role) {
  const credentials = role === "faculty"
    ? { email: "faculty@kiet.edu", password: "Faculty@KIET2024" }
    : { email: "amarjeet.2628MCA0069@kiet.edu", password: "Student@123" };
  try {
    const data = await API.login(credentials);
    setSession(data);
    showSuccess(`Demo login as ${data.name} ✓`);
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
  showSuccess("Logged out successfully.");
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
    document.getElementById("profile-enrollment").textContent = user.enrollment_no || "—";

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
    showSuccess("Learning context saved ✓");
  } catch (err) {
    showError(err.message);
  }
}

// ── Assessments ──
function renderAssessments(list) {
  const el = document.getElementById("assessment-list");
  if (!el) return;
  el.innerHTML = list.length ? list.map(a => `
    <div class="evidence-card flex items-center justify-between gap-2 bg-white rounded-xl p-3 shadow-sm border border-slate-100">
      <div class="flex-1 min-w-0">
        <p class="font-medium text-slate-800 truncate">${a.subject}</p>
        <p class="text-xs text-slate-400 mt-0.5">${a.type} · ${a.score}/${a.max_score}</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-bold ${(a.score/a.max_score)*100 >= 70 ? 'text-emerald-600' : 'text-amber-500'}">
          ${Math.round((a.score/a.max_score)*100)}%
        </span>
        <button onclick="deleteAssessment(${a.id})" class="text-slate-300 hover:text-red-400 transition-colors">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    </div>`).join("") :
    `<p class="text-slate-400 text-sm text-center py-4">No assessments recorded yet.</p>`;
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
    renderAssessments(await API.getAssessments());
    showSuccess("Assessment recorded ✓");
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
  const complexityColor = { Beginner: "bg-slate-100 text-slate-600", Intermediate: "bg-blue-100 text-blue-600", Advanced: "bg-purple-100 text-purple-600" };
  el.innerHTML = list.length ? list.map(p => `
    <div class="evidence-card bg-white rounded-xl p-3 shadow-sm border border-slate-100">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <p class="font-medium text-slate-800 truncate">${p.title}</p>
          <p class="text-xs text-slate-400 mt-0.5 line-clamp-2">${p.description || ""}</p>
          <div class="flex flex-wrap gap-1 mt-2">
            ${p.tech_stack ? p.tech_stack.split(",").map(t => `<span class="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs">${t.trim()}</span>`).join("") : ""}
          </div>
        </div>
        <div class="flex flex-col items-end gap-1 shrink-0">
          <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${complexityColor[p.complexity] || "bg-slate-100 text-slate-600"}">${p.complexity}</span>
          <button onclick="deleteProject(${p.id})" class="text-slate-300 hover:text-red-400 transition-colors mt-1">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    </div>`).join("") :
    `<p class="text-slate-400 text-sm text-center py-4">No projects added yet.</p>`;
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
    showSuccess("Project added ✓");
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
  const typeIcon = { certification: "🏅", hackathon: "🏆", course: "📚" };
  el.innerHTML = list.length ? list.map(c => `
    <div class="evidence-card flex items-center justify-between gap-2 bg-white rounded-xl p-3 shadow-sm border border-slate-100">
      <div class="flex-1 min-w-0">
        <p class="font-medium text-slate-800 truncate">${typeIcon[c.type] || "🏅"} ${c.title}</p>
        <p class="text-xs text-slate-400 mt-0.5">${c.issuer || ""} ${c.issued_date ? "· " + c.issued_date : ""}</p>
      </div>
      <button onclick="deleteCert(${c.id})" class="text-slate-300 hover:text-red-400 transition-colors shrink-0">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
      </button>
    </div>`).join("") :
    `<p class="text-slate-400 text-sm text-center py-4">No certifications added yet.</p>`;
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
    showSuccess("Certification added ✓");
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
      document.getElementById("ai-diagnosis").textContent = "Click 'Generate AI Plan' to get your personalised readiness diagnosis and 90-day action plan.";
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
  btn.innerHTML = `<svg class="animate-spin w-4 h-4 inline mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/></svg>Generating…`;
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
    const sourceLabels = { "gemini-4-hydrogen": "Gemini 4 Hydrogen", "agy-agent": "AGY Agent", "groq": "Groq AI", "offline_fallback": "Offline Engine" };
    document.getElementById("ai-source-badge").textContent = sourceLabels[res.ai_source] || res.ai_source;
    document.getElementById("plan-loading").classList.add("hidden");
    document.getElementById("plan-content").classList.remove("hidden");
    showSuccess("AI plan generated ✓");
  } catch (err) {
    showError(err.message);
    document.getElementById("plan-loading").classList.add("hidden");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="zap" class="w-4 h-4 inline mr-1"></i> Generate AI Plan`;
    if (window.lucide) lucide.createIcons();
  }
}

function flattenTasks(actionPlan, planId) {
  const tasks = [];
  (actionPlan || []).forEach(m => {
    (m.tasks || []).forEach((t, i) => {
      tasks.push({
        id: null, // DB IDs loaded on getPlan()
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
  document.getElementById("score-tier").textContent = report.readiness_tier || "";
  document.getElementById("score-academic").textContent = `${report.academic_index?.toFixed(0)}%`;
  document.getElementById("score-skill").textContent = `${report.skill_index?.toFixed(0)}%`;
  document.getElementById("score-evidence").textContent = `${report.evidence_index?.toFixed(0)}%`;
  document.getElementById("score-match-pct").textContent = `${report.skill_match_pct || 0}%`;

  const tierEl = document.getElementById("score-tier");
  tierEl.className = {
    "Industry Ready": "text-emerald-600 font-bold text-lg",
    "Developing": "text-blue-600 font-bold text-lg",
    "Needs Foundation": "text-amber-600 font-bold text-lg",
  }[report.readiness_tier] || "font-bold text-lg";

  // Skill chips
  const matchEl = document.getElementById("matched-skills");
  const missEl = document.getElementById("missing-skills");
  if (matchEl) matchEl.innerHTML = (report.matched_skills || []).slice(0, 10).map(s =>
    `<span class="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">${s}</span>`).join("");
  if (missEl) missEl.innerHTML = (report.missing_skills || []).slice(0, 10).map(s =>
    `<span class="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">${s}</span>`).join("");
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
        label: "Your Profile",
        data: radar.scores || [],
        backgroundColor: "rgba(99, 102, 241, 0.15)",
        borderColor: "rgba(99, 102, 241, 1)",
        pointBackgroundColor: "rgba(99, 102, 241, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(99, 102, 241, 1)",
        borderWidth: 2,
        pointRadius: 5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          min: 0, max: 100, beginAtZero: true,
          ticks: { stepSize: 20, font: { size: 10 } },
          grid: { color: "#e2e8f0" },
          pointLabels: { font: { size: 11 } },
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
    container.innerHTML = `<div class="text-center py-12 text-slate-400"><p class="text-lg font-medium">No plan yet</p><p class="text-sm mt-1">Generate your AI plan to see your personalised 90-day roadmap.</p></div>`;
    return;
  }

  const byMilestone = { 1: [], 2: [], 3: [], 4: [] };
  tasks.forEach(t => { if (byMilestone[t.milestone]) byMilestone[t.milestone].push(t); });

  const milestoneNames = ["Foundation Sprint", "Core Skills Build", "Advanced Application", "Interview Ready"];
  const milestoneColors = [
    "border-indigo-400 bg-indigo-50",
    "border-blue-400 bg-blue-50",
    "border-purple-400 bg-purple-50",
    "border-emerald-400 bg-emerald-50",
  ];
  const priorityBadge = {
    High: "bg-red-100 text-red-600",
    Medium: "bg-amber-100 text-amber-600",
    Low: "bg-slate-100 text-slate-500",
  };

  container.innerHTML = [1, 2, 3, 4].map(m => {
    const mTasks = byMilestone[m];
    const done = mTasks.filter(t => t.completed).length;
    const pct = mTasks.length ? Math.round((done / mTasks.length) * 100) : 0;
    return `
    <div class="milestone-card border-l-4 ${milestoneColors[m - 1]} rounded-xl p-4 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <div>
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Milestone ${m}</span>
          <h4 class="font-semibold text-slate-700 mt-0.5">${milestoneNames[m - 1]}</h4>
        </div>
        <div class="text-right">
          <span class="text-sm font-bold text-slate-600">${done}/${mTasks.length} done</span>
          <div class="w-20 bg-slate-200 rounded-full h-1.5 mt-1">
            <div class="h-1.5 rounded-full bg-indigo-500" style="width:${pct}%"></div>
          </div>
        </div>
      </div>
      <div class="space-y-2">
        ${mTasks.map(t => `
          <div class="task-row flex items-start gap-3 bg-white rounded-lg p-2.5 shadow-xs border border-slate-100 group" id="task-${t.id}">
            <input type="checkbox" ${t.completed ? "checked" : ""}
              onchange="toggleTask(${t.id}, this.checked)"
              class="mt-0.5 w-4 h-4 rounded accent-indigo-500 cursor-pointer shrink-0">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-700 ${t.completed ? 'line-through text-slate-400' : ''} task-title">${t.title}</p>
              <p class="text-xs text-slate-400 mt-0.5 line-clamp-2">${t.description || ""}</p>
              ${t.target_date ? `<p class="text-xs text-slate-300 mt-1">📅 Due: ${t.target_date}</p>` : ""}
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <span class="px-1.5 py-0.5 rounded text-xs font-semibold ${priorityBadge[t.priority] || 'bg-slate-100 text-slate-500'}">${t.priority}</span>
              <button onclick="openEditTask(${t.id})" class="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-indigo-500 transition-all">
                <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="deleteTask(${t.id})" class="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>`).join("")}
      </div>
      <button onclick="showAddTaskModal(${m})"
        class="mt-3 w-full text-sm text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg py-2 border border-dashed border-indigo-200 transition-colors flex items-center justify-center gap-1">
        <i data-lucide="plus" class="w-4 h-4"></i> Add Custom Task
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
    if (completed) showSuccess("Task completed! 🎉");
  } catch (err) { showError(err.message); }
}

async function deleteTask(id) {
  if (!id || !confirm("Delete this task?")) return;
  try {
    await API.deleteTask(id);
    document.getElementById(`task-${id}`)?.remove();
    showSuccess("Task removed.");
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
    const res = await API.addTask({
      milestone: parseInt(document.getElementById("modal-milestone").value),
      title: document.getElementById("modal-task-title").value,
      description: document.getElementById("modal-task-desc").value,
      priority: document.getElementById("modal-task-priority").value,
      target_date: document.getElementById("modal-task-date").value,
    });
    hideAddTaskModal();
    // Reload tasks
    const planRes = await API.getPlan();
    renderMilestones(planRes.tasks || []);
    showSuccess("Custom task added ✓");
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
    showSuccess("Task updated ✓");
  } catch (err) { showError(err.message); }
}

// ── Flashcard Interview Prep ──
function renderFlashcard() {
  const el = document.getElementById("flashcard-text");
  const counter = document.getElementById("flashcard-counter");
  if (!el) return;
  if (!flashcards.length) {
    el.textContent = "Generate your AI plan to unlock personalised interview questions.";
    if (counter) counter.textContent = "";
    return;
  }
  el.textContent = flashcards[flashcardIndex];
  if (counter) counter.textContent = `${flashcardIndex + 1} / ${flashcards.length}`;
  // Flip animation reset
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
    document.getElementById("tasks-done").textContent = `${data.completed_tasks}/${data.total_tasks}`;
    document.getElementById("completion-pct").textContent = `${data.completion_pct}%`;

    // Completion progress ring
    const ring = document.getElementById("completion-ring");
    if (ring) {
      const pct = data.completion_pct || 0;
      ring.style.background = `conic-gradient(#6366f1 ${pct * 3.6}deg, #e2e8f0 0deg)`;
    }

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
        label: "Tasks Completed",
        data: weeklyData.map(d => d.tasks_done),
        backgroundColor: weeklyData.map(d =>
          d.tasks_done > 0 ? "rgba(99, 102, 241, 0.8)" : "rgba(226, 232, 240, 0.8)"),
        borderRadius: 8,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: "#f1f5f9" } },
        x: { grid: { display: false } },
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
        label: "Readiness Score",
        data: history.map(h => h.score),
        borderColor: "#6366f1",
        backgroundColor: "rgba(99, 102, 241, 0.08)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#6366f1",
        pointRadius: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 0, max: 100, grid: { color: "#f1f5f9" } },
        x: { ticks: { maxTicksLimit: 10 }, grid: { display: false } },
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
