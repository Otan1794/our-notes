'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (error) {
        setErrorMessage(error.message);
        setSubmitting(false);
        return;
      }
      // Session cookie is now set; go to the dashboard and re-run server
      // components so they see the signed-in user.
      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      // e.g. missing NEXT_PUBLIC_SUPABASE_* env vars on the deployment
      console.error('Login failed:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Unexpected error');
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-card p-8 shadow-pin">
        <h1 className="font-display text-2xl font-semibold text-ink">Our Space</h1>
        <p className="mt-1 text-sm text-muted">
          A private place to put things you don&rsquo;t want to lose.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-teal px-3 py-2 text-sm font-medium text-teal-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
          {errorMessage && <p className="text-sm text-coral">{errorMessage}</p>}
        </form>
      </div>
    </main>
  );
}