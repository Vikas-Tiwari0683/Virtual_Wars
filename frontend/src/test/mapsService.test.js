// =============================================================================
// SECTION: mapsService Tests
// Covers autocomplete and getRouteDistance — input guards, success parsing,
// and error handling. fetch is mocked; no real network calls.
// =============================================================================

import { describe, it, expect, vi, afterEach } from 'vitest';

// Provide the API key the module reads at import time
vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key');

const { autocomplete, getRouteDistance } = await import('../services/mapsService');

function mockFetchOnce(body, ok = true, status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
    ok,
    status,
    json: async () => body,
  });
}

describe('autocomplete', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns empty for inputs shorter than 3 chars without calling fetch', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    const { data, error } = await autocomplete('ab');
    expect(data).toEqual([]);
    expect(error).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it('maps suggestions to { placeId, description }', async () => {
    mockFetchOnce({
      suggestions: [
        { placePrediction: { placeId: 'p1', text: { text: 'London, UK' } } },
        { placePrediction: { placeId: 'p2', text: { text: 'Berlin, DE' } } },
      ],
    });
    const { data, error } = await autocomplete('lon');
    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual({ placeId: 'p1', description: 'London, UK' });
  });

  it('filters out suggestions without a placeId', async () => {
    mockFetchOnce({
      suggestions: [
        { placePrediction: { placeId: '', text: { text: 'No id' } } },
        { placePrediction: { placeId: 'p2', text: { text: 'Valid' } } },
      ],
    });
    const { data } = await autocomplete('test');
    expect(data).toHaveLength(1);
    expect(data[0].placeId).toBe('p2');
  });

  it('returns the API error message on a non-ok response', async () => {
    mockFetchOnce({ error: { message: 'Quota exceeded' } }, false, 429);
    const { data, error } = await autocomplete('paris');
    expect(data).toEqual([]);
    expect(error).toBe('Quota exceeded');
  });

  it('returns a network error message when fetch throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('boom'));
    const { data, error } = await autocomplete('paris');
    expect(data).toEqual([]);
    expect(error).toBe('boom');
  });
});

describe('getRouteDistance', () => {
  afterEach(() => vi.restoreAllMocks());

  it('computes distanceKm and durationMin from the first route', async () => {
    mockFetchOnce({
      routes: [{ distanceMeters: 12345, duration: '420s' }],
    });
    const { data, error } = await getRouteDistance('o1', 'd1', 'DRIVE');
    expect(error).toBeNull();
    expect(data.distanceKm).toBe(12.3);  // 12345m → 12.3km
    expect(data.durationMin).toBe(7);    // 420s → 7min
    expect(data.mode).toBe('DRIVE');
  });

  it('returns an error when no route is found', async () => {
    mockFetchOnce({ routes: [] });
    const { data, error } = await getRouteDistance('o1', 'd1');
    expect(data).toBeNull();
    expect(error).toMatch(/no route/i);
  });

  it('surfaces the API error message on non-ok response', async () => {
    mockFetchOnce({ error: { message: 'Invalid place ID' } }, false, 400);
    const { data, error } = await getRouteDistance('bad', 'bad');
    expect(data).toBeNull();
    expect(error).toBe('Invalid place ID');
  });

  it('returns a network error when fetch throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('offline'));
    const { data, error } = await getRouteDistance('o1', 'd1');
    expect(data).toBeNull();
    expect(error).toBe('offline');
  });
});
