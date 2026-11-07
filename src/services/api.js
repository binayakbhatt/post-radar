// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Helper function for authenticated API requests.
 * @param {string} endpoint - API route (e.g. '/api/auth/me')
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Response JSON
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`API returned non-JSON response from ${url}. Check VITE_API_BASE_URL configuration.`);
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'API request failed');
  }
  return data;
}
