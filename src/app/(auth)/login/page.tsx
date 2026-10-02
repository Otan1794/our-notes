'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    setStatus(error ? 'error' : 'sent');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-card p-8 shadow-pin">
        <h1 className="font-display text-2xl font-semibold text-ink">Our Space</h1>
        <p className="mt-1 text-sm text-muted">
          A private place to put things you don&rsquo;t want to lose.
        </p>

        {status === 'sent' ? (
          <p className="mt-6 rounded-lg bg-teal/10 p-3 text-sm text-ink">
            Check {email} for a sign-in link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal"
            />
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full rounded-lg bg-teal px-3 py-2 text-sm font-medium text-teal-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {status === 'sending' ? 'Sending link…' : 'Send sign-in link'}
            </button>
            {status === 'error' && (
              <p className="text-sm text-coral">Something went wrong. Try again.</p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
