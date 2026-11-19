// ─────────────────────────────────────────────────────────────────────────────
// frontend/js/api.js
// Centralised JWT fetch client with human-readable error handling
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("sp_token") || "";
}

function setSession(data) {
  localStorage.setItem("sp_token", data.token);
  localStorage.setItem("sp_user_id", data.user_id);
  localStorage.setItem("sp_role", data.role);
  localStorage.setItem("sp_name", data.name);
}

function clearSession() {
  ["sp_token", "sp_user_id", "sp_role", "sp_name"].forEach(k => localStorage.removeItem(k));
}

function isLoggedIn() {
  return !!getToken();
}

function getRole() {
  return localStorage.getItem("sp_role") || "student";
}

function getUserName() {
  return localStorage.getItem("sp_name") || "Student";
}

// Human-readable HTTP error messages
const ERROR_MESSAGES = {
  400: "Invalid input. Please check the provided values.",
  401: "Session expired or invalid credentials. Please sign in again.",
  403: "Access restricted. Institutional permission required.",
  404: "Requested record not found.",
  500: "Server error occurred. Please try again shortly.",
};

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 — auto logout
    if (res.status === 401) {
      clearSession();
      window.dispatchEvent(new CustomEvent("sp:logout"));
      throw new Error("Session expired. Please sign in again.");
    }

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const msg = (isJson && data.error) ? data.error : (ERROR_MESSAGES[res.status] || `Request error (${res.status})`);
      throw new Error(msg);
    }

    return data;
  } catch (err) {
    if (err.name === "TypeError") {
      throw new Error("Unable to connect to service. Verify the server is running.");
    }
    throw err;
  }
}

// Convenience wrappers
const API = {
  get: (endpoint) => apiFetch(endpoint, { method: "GET" }),
  post: (endpoint, body) => apiFetch(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: (endpoint, body) => apiFetch(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  patch: (endpoint, body) => apiFetch(endpoint, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (endpoint) => apiFetch(endpoint, { method: "DELETE" }),

  // Auth
  register: (d) => API.post("/auth/register", d),
  login: (d) => API.post("/auth/login", d),
  me: () => API.get("/auth/me"),

  // Student
  updateContext: (d) => API.put("/student/context", d),
  getAssessments: () => API.get("/student/assessments"),
  addAssessment: (d) => API.post("/student/assessments", d),
  deleteAssessment: (id) => API.delete(`/student/assessments/${id}`),
  getProjects: () => API.get("/student/projects"),
  addProject: (d) => API.post("/student/projects", d),
  deleteProject: (id) => API.delete(`/student/projects/${id}`),
  getCerts: () => API.get("/student/certifications"),
  addCert: (d) => API.post("/student/certifications", d),
  deleteCert: (id) => API.delete(`/student/certifications/${id}`),
  getReadiness: () => API.get("/student/readiness"),
  generatePlan: () => API.post("/student/generate-plan", {}),
  getPlan: () => API.get("/student/plan"),
  addTask: (d) => API.post("/student/plan/tasks", d),
  updateTask: (id, d) => API.patch(`/student/plan/tasks/${id}`, d),
  deleteTask: (id) => API.delete(`/student/plan/tasks/${id}`),
  getProgress: () => API.get("/student/progress"),

  // Admin
  getCohort: () => API.get("/admin/cohort"),
  getSkillGaps: () => API.get("/admin/skill-gaps"),
  exportCSV: () => `${API_BASE}/admin/export-csv`,
};

// Global feedback banner matching design system
function showBanner(msg, type = "error") {
  const banner = document.getElementById("global-banner");
  if (!banner) return;
  banner.textContent = msg;
  banner.className = `fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-sm text-xs font-semibold border transition-all duration-200 ${
    type === "error" 
      ? "bg-red-50 text-red-800 border-red-200" 
      : "bg-emerald-50 text-emerald-900 border-emerald-200"
  }`;
  banner.classList.remove("hidden");
  clearTimeout(banner._timer);
  banner._timer = setTimeout(() => banner.classList.add("hidden"), 3500);
}

function showSuccess(msg) { showBanner(msg, "success"); }
function showError(msg) { showBanner(msg, "error"); }

window.API = API;
window.setSession = setSession;
window.clearSession = clearSession;
window.isLoggedIn = isLoggedIn;
window.getRole = getRole;
window.getUserName = getUserName;
window.showSuccess = showSuccess;
window.showError = showError;
