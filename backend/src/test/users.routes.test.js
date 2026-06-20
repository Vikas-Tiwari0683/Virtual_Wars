// =============================================================================
// SECTION: Users Routes — Backend Tests
// Tests profile fetch, profile update validation, dashboard aggregates,
// and account deletion.
// =============================================================================

'use strict';

const request = require('supertest');

const mockQuery = jest.fn();
jest.mock('../db/pool', () => ({
  pool: { query: jest.fn() },
}));

jest.mock('firebase-admin', () => ({
  apps:          [],
  initializeApp: jest.fn(),
  auth: () => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: 'test-uid', email: 'test@test.com', name: 'Test User',
    }),
  }),
}));

const { pool } = require('../db/pool');
const app = require('../server');

const AUTH = { Authorization: 'Bearer mock-token' };

function mockAuth(userId = 1) {
  pool.query.mockResolvedValueOnce({
    rowCount: 1,
    rows: [{ id: userId, first_name: 'Test', is_onboarded: true }],
  });
}

describe('Users Routes', () => {
  beforeEach(() => pool.query.mockReset());

  // --------------------------------------------------------------------------
  describe('GET /api/users/profile', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/users/profile');
      expect(res.status).toBe(401);
    });

    it('returns profile for authenticated user', async () => {
      mockAuth(1);
      pool.query.mockResolvedValueOnce({ rows: [{
        id: 1, email: 'test@test.com', first_name: 'Test', last_name: 'User',
        country: 'United States', lifestyle: 'transit', streak: 3,
        is_onboarded: true, created_at: new Date().toISOString(),
      }]});
      const res = await request(app).get('/api/users/profile').set(AUTH);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe('test@test.com');
      expect(res.body.streak).toBe(3);
    });

    it('returns 404 when user row not found', async () => {
      mockAuth(1);
      pool.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/users/profile').set(AUTH);
      expect(res.status).toBe(404);
    });
  });

  // --------------------------------------------------------------------------
  describe('PATCH /api/users/profile — validation', () => {
    it('rejects invalid lifestyle value', async () => {
      mockAuth(1);
      const res = await request(app)
        .patch('/api/users/profile')
        .set(AUTH)
        .send({ lifestyle: 'invalid' });
      expect(res.status).toBe(422);
    });

    it('rejects invalid country', async () => {
      mockAuth(1);
      const res = await request(app)
        .patch('/api/users/profile')
        .set(AUTH)
        .send({ country: 'Mars' });
      expect(res.status).toBe(422);
    });

    it('accepts valid profile update', async () => {
      mockAuth(1);
      pool.query.mockResolvedValueOnce({ rows: [{
        id: 1, first_name: 'Updated', last_name: 'Name',
        country: 'United Kingdom', lifestyle: 'cyclist',
      }]});
      const res = await request(app)
        .patch('/api/users/profile')
        .set(AUTH)
        .send({ firstName: 'Updated', country: 'United Kingdom', lifestyle: 'cyclist' });
      expect(res.status).toBe(200);
      expect(res.body.country).toBe('United Kingdom');
    });

    it('accepts empty body (all fields optional)', async () => {
      mockAuth(1);
      pool.query.mockResolvedValueOnce({ rows: [{
        id: 1, first_name: 'Test', last_name: '', country: 'United States', lifestyle: 'transit',
      }]});
      const res = await request(app)
        .patch('/api/users/profile')
        .set(AUTH)
        .send({});
      expect(res.status).toBe(200);
    });
  });

  // --------------------------------------------------------------------------
  describe('GET /api/users/dashboard', () => {
    it('returns all dashboard aggregates', async () => {
      mockAuth(1);
      // Mock 5 parallel queries: streak, today, week, goals, recent
      pool.query
        .mockResolvedValueOnce({ rows: [{ streak: 7 }] })
        .mockResolvedValueOnce({ rows: [{ today_kg: '4.500' }] })
        .mockResolvedValueOnce({ rows: [{ category: 'transport', total_kg: '3.200' }] })
        .mockResolvedValueOnce({ rows: [{ active: '2' }] })
        .mockResolvedValueOnce({ rows: [
          { id: 1, category: 'diet', subtype: 'beef', quantity: 1, unit: 'serving', carbon_kg: '6.61', logged_date: '2026-06-16' },
        ]});

      const res = await request(app).get('/api/users/dashboard').set(AUTH);
      expect(res.status).toBe(200);
      expect(res.body.streak).toBe(7);
      expect(res.body.todayKg).toBe(4.5);
      expect(res.body.activeGoals).toBe(2);
      expect(res.body.recentActivities).toHaveLength(1);
    });
  });

  // --------------------------------------------------------------------------
  describe('DELETE /api/users/account', () => {
    it('deletes account and returns 200 with confirmation', async () => {
      mockAuth(1);
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      const res = await request(app)
        .delete('/api/users/account')
        .set(AUTH)
        .send({ confirmText: 'DELETE' });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted/i);
    });

    it('returns 400 when confirmation text is missing', async () => {
      mockAuth(1);
      const res = await request(app)
        .delete('/api/users/account')
        .set(AUTH)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/confirmation/i);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).delete('/api/users/account');
      expect(res.status).toBe(401);
    });
  });
});
