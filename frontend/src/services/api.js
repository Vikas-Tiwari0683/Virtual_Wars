// =============================================================================
// SECTION: API Service — Central HTTP Client
// All calls to the Express backend go through this file.
// Base URL is read from the Vite env variable VITE_API_URL (defaults to
// http://localhost:5000/api so dev works with zero config).
//
// Pattern:
//   Every exported function returns { data, error }.
//   Callers never need to try/catch — they check if (error) instead.
//   This keeps UI components clean and consistent.
// =============================================================================

import { auth } from './firebase/config';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// =============================================================================
// SECTION: Core fetch wrapper
// Gets a fresh Firebase ID token on every request (Firebase caches it and
// only calls the network when the token is within 5 minutes of expiry).
// Returns { data } on success, { error } on failure.
// Accepts an optional AbortSignal so callers can cancel in-flight requests
// when a component unmounts or the user navigates away.
// =============================================================================
async function request(method, path, body = null, signal = null) {
  const headers = { 'Content-Type': 'application/json' };

  // Attach Firebase ID token if user is signed in
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const idToken = await currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${idToken}`;
    } catch {
      // token fetch failed — send request without auth (will get 401)
    }
  }

  const options = { method, headers };
  if (body)   options.body   = JSON.stringify(body);
  if (signal) options.signal = signal;

  try {
    const res  = await fetch(`${BASE_URL}${path}`, options);
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { data: null, error: json.error || `Request failed (${res.status})` };
    }

    return { data: json, error: null };
  } catch (err) {
    // AbortError is not a real failure — return a silent null result
    if (err.name === 'AbortError') return { data: null, error: null };
    return { data: null, error: 'Network error — is the server running?' };
  }
}

// Convenience helpers
const get    = (path, signal)        => request('GET',    path, null,  signal);
const post   = (path, body)          => request('POST',   path, body);
const patch  = (path, body)          => request('PATCH',  path, body);
const put    = (path, body)          => request('PUT',    path, body);
const del    = (path, body)          => request('DELETE', path, body);
// =============================================================================
// SECTION: Auth API
// login/register are handled by Firebase Auth — these endpoints handle
// onboarding and profile fetching only.
// =============================================================================
export const authAPI = {
  /** Fetch the currently authenticated user's profile from Neon. */
  me: () => get('/auth/me'),

  /** Complete the onboarding wizard. */
  onboard: (body) => patch('/auth/onboard', body),
};

// =============================================================================
// SECTION: Activities API
// =============================================================================
export const activitiesAPI = {
  /**
   * Fetch paginated activities.
   * @param {{ page?, limit?, category?, date_from?, date_to? }} params
   * @param {AbortSignal} [signal]
   */
  list: (params = {}, signal) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/activities${qs ? '?' + qs : ''}`, signal);
  },

  /** Summary totals by category for a given period. */
  summary: (period = 'month', signal) => get(`/activities/summary?period=${period}`, signal),

  /** Daily totals for the last N days (sparkline data). */
  trend: (days = 7, signal) => get(`/activities/trend?days=${days}`, signal),

  /** Log a new activity. */
  create: (body) => post('/activities', body),

  /** Update an existing activity. */
  update: (id, body) => put(`/activities/${id}`, body),

  /** Delete an activity. */
  remove: (id) => del(`/activities/${id}`),
};

// =============================================================================
// SECTION: Goals API
// =============================================================================
export const goalsAPI = {
  /** Fetch goals. status = 'active' | 'completed' | 'failed' | 'all' */
  list: (status = 'active') => get(`/goals?status=${status}`),

  /** Create a new goal. */
  create: (body) => post('/goals', body),

  /** Update progress or status. */
  update: (id, body) => patch(`/goals/${id}`, body),

  /** Delete a goal. */
  remove: (id) => del(`/goals/${id}`),
};

// =============================================================================
// SECTION: Challenges API
// =============================================================================
export const challengesAPI = {
  /** List all active challenges with user join status. */
  list: () => get('/challenges'),

  /** Join a challenge. */
  join: (id) => post(`/challenges/${id}/join`),

  /** Get leaderboard for a challenge. */
  leaderboard: (id) => get(`/challenges/${id}/leaderboard`),
};

// =============================================================================
// SECTION: Recommendations API
// =============================================================================
export const recommendationsAPI = {
  /** Fetch today's recommendations (auto-seeded if empty). */
  list: () => get('/recommendations'),

  /** Mark a recommendation as done or skip. */
  action: (id, action) => patch(`/recommendations/${id}`, { action }),
};

// =============================================================================
// SECTION: Users API
// =============================================================================
export const usersAPI = {
  /** Full profile. */
  profile: () => get('/users/profile'),

  /** Update profile fields. */
  updateProfile: (body) => patch('/users/profile', body),

  /** All dashboard aggregates in one request. */
  dashboard: () => get('/users/dashboard'),

  /** Permanently delete the account. Requires explicit confirmation. */
  deleteAccount: () => del('/users/account', { confirmText: 'DELETE' }),
};
