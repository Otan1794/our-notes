'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Signs in on the SERVER so the session cookie is set by an HTTP response
 * header instead of by browser JavaScript. Safari (iPhone) caps cookies
 * written by JavaScript at about 7 days, which would mean typing the password
 * weekly; server-set cookies last far longer (400 days).
 */
export async function signInWithPassword(email: string, password: string): Promise<{ error?: string }> {
  if (!email.trim() || !password) return { error: 'Enter your email and password.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return error ? { error: error.message } : {};
}
