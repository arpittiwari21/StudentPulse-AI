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

export async function getCohort(token) {
  const res = await fetch(`${BASE_URL}/admin/cohort`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function getSkillGaps(token) {
  const res = await fetch(`${BASE_URL}/admin/skill-gaps`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function downloadExportCsv(token) {
  const res = await fetch(`${BASE_URL}/admin/export-csv`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to download cohort CSV');
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'studentpulse_cohort.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
