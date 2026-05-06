import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';

/**
 * Seeds the default admin account and commission settings.
 * Safe to call multiple times — fully idempotent.
 *
 * Returns { created: boolean, message: string }
 * Throws on unexpected Supabase errors.
 */
export async function seedAdmin() {
  const email    = (process.env.ADMIN_EMAIL    || 'admin@lms.com').trim().toLowerCase();
  const password =  process.env.ADMIN_PASSWORD || 'Admin@123';
  const name     = 'System Administrator';

  // ── 1. Idempotency check ──────────────────────────────────────────────────
  // maybeSingle() returns { data: null, error: null } when 0 rows found,
  // unlike single() which returns an error for 0 rows.
  const { data: existing, error: lookupError } = await supabase
    .from('admins')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Admin lookup failed: ${lookupError.message}`);
  }

  if (existing) {
    return { created: false, message: 'Admin already exists' };
  }

  // ── 2. Hash password (never store plain text) ─────────────────────────────
  const hashedPassword = await bcrypt.hash(password, 12);

  // ── 3. Insert admin row ───────────────────────────────────────────────────
  // The admins table is separate from users — login checks admins first.
  // Columns: id (uuid, default), email, password, name (optional — add if schema has it)
  const { error: insertError } = await supabase
    .from('admins')
    .insert([{ name, email, password: hashedPassword }]);

  if (insertError) {
    // "column does not exist" means the admins table has no name column — retry without it
    if (insertError.message?.includes('name')) {
      const { error: retryError } = await supabase
        .from('admins')
        .insert([{ email, password: hashedPassword }]);
      if (retryError) throw new Error(`Admin insert failed: ${retryError.message}`);
    } else {
      throw new Error(`Admin insert failed: ${insertError.message}`);
    }
  }

  // ── 4. Seed commission settings if not already present ────────────────────
  const { data: settings } = await supabase
    .from('commission_settings')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (!settings) {
    await supabase
      .from('commission_settings')
      .insert([{ platform_percentage: 20.00 }]);
  }

  return { created: true, message: 'Admin created successfully' };
}
