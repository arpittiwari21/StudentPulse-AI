const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.error || data.detail || data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function updateContext(token, contextData) {
  const res = await fetch(`${BASE_URL}/student/context`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(contextData),
  });
  return handleResponse(res);
}

export async function getAssessments(token) {
  const res = await fetch(`${BASE_URL}/student/assessments`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function addAssessment(token, data) {
  const res = await fetch(`${BASE_URL}/student/assessments`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteAssessment(token, id) {
  const res = await fetch(`${BASE_URL}/student/assessments/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function getProjects(token) {
  const res = await fetch(`${BASE_URL}/student/projects`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function addProject(token, data) {
  const res = await fetch(`${BASE_URL}/student/projects`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteProject(token, id) {
  const res = await fetch(`${BASE_URL}/student/projects/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function getCertifications(token) {
  const res = await fetch(`${BASE_URL}/student/certifications`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function addCertification(token, data) {
  const res = await fetch(`${BASE_URL}/student/certifications`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteCertification(token, id) {
  const res = await fetch(`${BASE_URL}/student/certifications/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function getReadiness(token) {
  const res = await fetch(`${BASE_URL}/student/readiness`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function generateAiPlan(token) {
  const res = await fetch(`${BASE_URL}/student/generate-plan`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({}),
  });
  return handleResponse(res);
}

export async function getPlan(token) {
  const res = await fetch(`${BASE_URL}/student/plan`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function addTask(token, data) {
  const res = await fetch(`${BASE_URL}/student/plan/tasks`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateTask(token, id, data) {
  const res = await fetch(`${BASE_URL}/student/plan/tasks/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteTask(token, id) {
  const res = await fetch(`${BASE_URL}/student/plan/tasks/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function getProgress(token) {
  const res = await fetch(`${BASE_URL}/student/progress`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}
