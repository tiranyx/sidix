/**
 * SIDIX — Supabase client
 *
 * Publishable key aman di frontend karena semua tabel dilindungi RLS.
 * Secret key HANYA di backend Python (env var SUPABASE_SECRET_KEY di VPS).
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('[SIDIX] Supabase env vars tidak ditemukan. Fitur DB dinonaktifkan.');
}

export const supabase = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// ── Types ────────────────────────────────────────────────────────────────────

export type FeedbackType = 'bug' | 'saran' | 'fitur';

export interface FeedbackPayload {
  type: FeedbackType;
  message: string;
  user_id?: string; // opsional — anonim diizinkan
}

// ── Newsletter ───────────────────────────────────────────────────────────────

/**
 * Subscribe email ke newsletter SIDIX.
 * Mengembalikan { ok: true } atau { ok: false, error: string }
 */
export async function subscribeNewsletter(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Database tidak tersedia.' };

  const { error } = await supabase
    .from('newsletter')
    .insert({ email: email.trim().toLowerCase() });

  if (error) {
    // Duplikat email = sudah subscribe
    if (error.code === '23505') return { ok: true }; // unique violation = sudah ada
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

// ── Feedback ─────────────────────────────────────────────────────────────────

/**
 * Kirim feedback/bug report/fitur request ke database.
 */
export async function submitFeedbackDB(payload: FeedbackPayload): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Database tidak tersedia.' };

  const { error } = await supabase
    .from('feedback')
    .insert(payload);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ── Auth helpers (untuk nanti) ────────────────────────────────────────────────

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}
