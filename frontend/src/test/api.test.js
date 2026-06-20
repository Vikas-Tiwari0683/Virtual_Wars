// =============================================================================
// SECTION: API Service Tests
// Tests the HTTP client layer — request construction, error handling,
// token attachment, and each API namespace.
// Uses vi.spyOn to intercept fetch without network calls.
// =============================================================================

import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock Firebase auth before importing api.js
vi.mock('../services/firebase/config', () => ({
  auth: { currentUser: { getIdToken: async () => 'mock-firebase-token' } },
  db: {},
  analyticsPromise: Promise.resolve(null),
  default: {},
}));

// Import after mock is set up
const { activitiesAPI, goalsAPI, recommendationsAPI } = await import('../services/api.js');

// =============================================================================
// Helper: mock a successful fetch response
// =============================================================================
function mockFetch(data, status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
    ok:   status >= 200 && status < 300,
    status,
    json: async () => data,
  });
}

function mockFetchError(errorBody, status = 400) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
    ok:   false,
    status,
    json: async () => errorBody,
  });
}

// =============================================================================
describe('API Service', () => {
  afterEach(() => vi.restoreAllMocks());

  // --------------------------------------------------------------------------
  describe('activitiesAPI', () => {
    it('list() calls GET /activities', async () => {
      const spy = mockFetch({ activities: [], total: 0 });
      const { data } = await activitiesAPI.list();
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('/activities'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(data.activities).toEqual([]);
    });

    it('create() calls POST /activities with body', async () => {
      const activity = { category: 'transport', subtype: 'bus', quantity: 10, unit: 'km', carbon_kg: 0.89 };
      const spy = mockFetch({ id: 1, ...activity });
      const { data } = await activitiesAPI.create(activity);
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('/activities'),
        expect.objectContaining({ method: 'POST', body: JSON.stringify(activity) })
      );
      expect(data.id).toBe(1);
    });

    it('remove() calls DELETE /activities/:id', async () => {
      const spy = mockFetch({ message: 'Activity deleted.' });
      await activitiesAPI.remove(42);
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('/activities/42'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('summary() passes period query param', async () => {
      const spy = mockFetch({ period: 'week', totalKg: 10, categories: [] });
      await activitiesAPI.summary('week');
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('period=week'),
        expect.anything()
      );
    });
  });

  // --------------------------------------------------------------------------
  describe('goalsAPI', () => {
    it('list() calls GET /goals with status param', async () => {
      const spy = mockFetch([]);
      await goalsAPI.list('active');
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('status=active'),
        expect.anything()
      );
    });

    it('create() sends goal data to POST /goals', async () => {
      const goal = { title: 'Test', category: 'transport', target_kg: 20, deadline: '2026-12-31' };
      const spy  = mockFetch({ id: 5, ...goal });
      const { data } = await goalsAPI.create(goal);
      expect(data.id).toBe(5);
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('/goals'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('remove() sends DELETE /goals/:id', async () => {
      const spy = mockFetch({ message: 'Goal deleted.' });
      await goalsAPI.remove(7);
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('/goals/7'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  // --------------------------------------------------------------------------
  describe('recommendationsAPI', () => {
    it('action() sends PATCH with correct body', async () => {
      const spy = mockFetch({ id: 3, is_actioned: true, action_type: 'done' });
      await recommendationsAPI.action(3, 'done');
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('/recommendations/3'),
        expect.objectContaining({
          method: 'PATCH',
          body:   JSON.stringify({ action: 'done' }),
        })
      );
    });
  });

  // --------------------------------------------------------------------------
  describe('Error handling', () => {
    it('returns { error } on non-ok response', async () => {
      mockFetchError({ error: 'Goal not found.' }, 404);
      const { data, error } = await goalsAPI.remove(999);
      expect(data).toBeNull();
      expect(error).toBe('Goal not found.');
    });

    it('returns network error message on fetch throw', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Failed to fetch'));
      const { data, error } = await activitiesAPI.list();
      expect(data).toBeNull();
      expect(error).toContain('Network error');
    });

    it('attaches Firebase Bearer token to requests', async () => {
      const spy = mockFetch({ activities: [] });
      await activitiesAPI.list();
      const [, options] = spy.mock.calls[0];
      expect(options.headers?.Authorization).toBe('Bearer mock-firebase-token');
    });
  });
});
