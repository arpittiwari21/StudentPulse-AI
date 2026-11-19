// Zero hardcoded localhost URL — uses VITE_API_URL if set, or relative '/api' fallback
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Handle API responses with informative error messages
 */
async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errorMessage = 'An unexpected error occurred.';
    if (data.error) {
      errorMessage = data.error;
    } else if (data.detail) {
      errorMessage = typeof data.detail === 'string'
        ? data.detail
        : data.detail.map((err) => `${err.loc?.slice(-1)}: ${err.msg}`).join(', ');
    } else if (data.message) {
      errorMessage = data.message;
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Check backend connection status
 */
export async function checkServerHealth() {
  try {
    const res = await fetch(`${BASE_URL}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Sign in existing user with email & password
 */
export async function loginUser(credentials) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  return handleResponse(response);
}

/**
 * Register a new student user
 */
export async function registerUser(userData) {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  return handleResponse(response);
}

/**
 * Fetch authenticated user profile using Bearer JWT token
 */
export async function fetchCurrentUser(token) {
  const response = await fetch(`${BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(response);
}

/**
 * Logout notification
 */
export async function logoutUser() {
  // Client-side JWT invalidation
  return true;
}
