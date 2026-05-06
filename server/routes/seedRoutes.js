import express from 'express';
import { seedAdmin } from '../seed/adminSeeder.js';

const seedRouter = express.Router();

/**
 * POST /api/seed/admin
 *
 * One-time setup endpoint for creating the default admin account.
 * Protected by SEED_SECRET env variable — set this in Vercel dashboard,
 * delete or rotate it after first use.
 *
 * Authorization: Bearer <SEED_SECRET>
 */
seedRouter.post('/admin', async (req, res) => {
  // ── Guard: endpoint disabled if SEED_SECRET is not configured ─────────────
  if (!process.env.SEED_SECRET) {
    return res.status(503).json({
      success: false,
      message: 'Seed endpoint is disabled: SEED_SECRET is not configured',
    });
  }

  // ── Guard: validate the secret ────────────────────────────────────────────
  const authHeader = req.headers.authorization || '';
  const provided   = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!provided || provided !== process.env.SEED_SECRET) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: invalid or missing seed secret',
    });
  }

  // ── Guard: Supabase must be reachable ────────────────────────────────────
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({
      success: false,
      message: 'Supabase is not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
    });
  }

  try {
    const result = await seedAdmin();

    const statusCode = result.created ? 201 : 200;
    return res.status(statusCode).json({
      success: true,
      message: result.message,
      ...(result.created && {
        credentials: {
          email: process.env.ADMIN_EMAIL || 'admin@lms.com',
          note: 'Password is the value of ADMIN_PASSWORD env var (default: Admin@123). Change it after first login.',
        },
      }),
    });
  } catch (err) {
    console.error('[Seed] Admin seed failed:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Admin seeding failed',
    });
  }
});

export default seedRouter;
