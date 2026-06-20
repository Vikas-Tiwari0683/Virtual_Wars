// =============================================================================
// SECTION: Users Routes (Profile management)
// All routes are protected.
//
// GET    /api/users/profile      — fetch full profile
// PATCH  /api/users/profile      — update name, country, lifestyle
// GET    /api/users/dashboard    — aggregated dashboard stats for the current user
// DELETE /api/users/account      — permanently delete account + cascade all data
// =============================================================================

'use strict';

const express = require('express');
const { body } = require('express-validator');
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { validate }    = require('../middleware/validate');
const { VALID_COUNTRIES, VALID_LIFESTYLES } = require('../constants');

const router = express.Router();
router.use(requireAuth);

// =============================================================================
// GET /api/users/profile
// =============================================================================
router.get('/profile', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, email, first_name, last_name, country, lifestyle,
              streak, is_onboarded, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    const u = rows[0];
    res.json({
      id: u.id, email: u.email,
      firstName: u.first_name, lastName: u.last_name,
      country: u.country, lifestyle: u.lifestyle,
      streak: u.streak, isOnboarded: u.is_onboarded,
      createdAt: u.created_at,
    });
  } catch (err) {
    next(err);
  }
});

// =============================================================================
// PATCH /api/users/profile
// Body: { firstName?, lastName?, country?, lifestyle? }
// =============================================================================
const profileRules = [
  body('firstName').optional().trim().notEmpty().isLength({ max: 100 }),
  body('lastName').optional().trim().isLength({ max: 100 }),
  body('country').optional().trim().isIn(VALID_COUNTRIES).withMessage('Invalid country'),
  body('lifestyle').optional().isIn(VALID_LIFESTYLES),
];

router.patch('/profile', profileRules, validate, async (req, res, next) => {
  const { firstName, lastName, country, lifestyle } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE users SET
         first_name  = COALESCE($1, first_name),
         last_name   = COALESCE($2, last_name),
         country     = COALESCE($3, country),
         lifestyle   = COALESCE($4, lifestyle),
         updated_at  = NOW()
       WHERE id = $5
       RETURNING id, first_name, last_name, country, lifestyle`,
      [firstName || null, lastName || null, country || null, lifestyle || null, req.user.id]
    );
    const u = rows[0];
    res.json({ firstName: u.first_name, lastName: u.last_name, country: u.country, lifestyle: u.lifestyle });
  } catch (err) {
    next(err);
  }
});

// =============================================================================
// GET /api/users/dashboard
// Returns all data needed to render the dashboard in one request:
//   - today's total carbon
//   - weekly category breakdown
//   - active goals count
//   - streak
//   - recent 5 activities
// =============================================================================
router.get('/dashboard', async (req, res, next) => {
  const uid = req.user.id;
  try {
    const [userRow, todayRow, weekRow, goalsRow, recentRow] = await Promise.all([
      // User basics (streak)
      pool.query('SELECT streak FROM users WHERE id = $1', [uid]),

      // Today's total
      pool.query(
        `SELECT ROUND(COALESCE(SUM(carbon_kg),0)::numeric,3) AS today_kg
         FROM activities WHERE user_id=$1 AND logged_date=CURRENT_DATE`,
        [uid]
      ),

      // Last 7 days by category
      pool.query(
        `SELECT category, ROUND(SUM(carbon_kg)::numeric,3) AS total_kg
         FROM activities
         WHERE user_id=$1 AND logged_date >= CURRENT_DATE - INTERVAL '7 days'
         GROUP BY category`,
        [uid]
      ),

      // Active goals count
      pool.query(
        "SELECT COUNT(*) AS active FROM goals WHERE user_id=$1 AND status='active'",
        [uid]
      ),

      // Recent 5 activities
      pool.query(
        `SELECT id, category, subtype, quantity, unit, carbon_kg, logged_date
         FROM activities WHERE user_id=$1
         ORDER BY logged_date DESC, created_at DESC LIMIT 5`,
        [uid]
      ),
    ]);

    res.set('Cache-Control', 'private, max-age=30');
    res.json({
      streak:           userRow.rows[0]?.streak      || 0,
      todayKg:          parseFloat(todayRow.rows[0]?.today_kg) || 0,
      weekCategories:   weekRow.rows,
      activeGoals:      parseInt(goalsRow.rows[0]?.active)    || 0,
      recentActivities: recentRow.rows,
    });
  } catch (err) {
    next(err);
  }
});

// =============================================================================
// DELETE /api/users/account
// Permanently deletes the user and all associated data (CASCADE).
// Requires an explicit confirmation token in the body to prevent accidental
// or CSRF-triggered deletion: { confirmText: "DELETE" }.
// =============================================================================
router.delete('/account', async (req, res, next) => {
  if (req.body?.confirmText !== 'DELETE') {
    return res.status(400).json({
      error: 'Account deletion requires confirmation. Send { "confirmText": "DELETE" }.',
    });
  }
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ message: 'Account deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
