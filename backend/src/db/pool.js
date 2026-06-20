// =============================================================================
// SECTION: Database Pool
// Creates a single pg Pool instance using the Neon connection string from .env.
// SSL is always enabled with full certificate-chain verification — Neon's
// managed TLS certificates validate correctly against the public CA bundle.
// All other modules import { pool } from here — never create their own Pool.
// =============================================================================

'use strict';

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Enforce TLS with certificate-chain verification (no downgrade).
  ssl: { rejectUnauthorized: true },
  // Connection pool sizing
  max: 10,          // max simultaneous clients
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Log the first successful connection only (avoids 10x noise on pool warm-up)
let connectionLogged = false;
pool.on('connect', () => {
  if (!connectionLogged) {
    console.log('[db] Connected to Neon PostgreSQL');
    connectionLogged = true;
  }
});

pool.on('error', (err) => {
  console.error('[db] Unexpected pool error:', err.message);
});

module.exports = { pool };
