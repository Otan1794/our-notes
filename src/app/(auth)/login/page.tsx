'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { signInWithPassword } from '@/services/auth';

/**
 * Asks Chrome / Edge / Android to offer saving the password. (Safari and
 * Firefox show their own "Save password?" prompt after a normal form
 * submit, which this form is shaped to trigger.)
 */
async function offerToSavePassword(email: string, password: string) {
  try {
    const PasswordCredential = (
      window as unknown as {
        PasswordCredential?: new (data: { id: string; password: string; name?: string }) => Credential;
      }
    ).PasswordCredential;
    if (PasswordCredential && navigator.credentials?.store) {
      await navigator.credentials.store(new PasswordCredential({ id: email, password, name: email }));
    }
  } catch {
    // purely a convenience; never block signing in
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      const result = await signInWithPassword(email, password);
      if (result.error) {
        setErrorMessage(result.error);
        setSubmitting(false);
        return;
      }
      await offerToSavePassword(email.trim(), password);
      // A full page load (not a client-side transition) is what makes
      // browsers treat this as a completed login and offer to save it.
      window.location.assign('/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Unexpected error');
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="glass w-full max-w-sm rounded-[28px] p-8">
        <h1 className="font-display text-2xl font-semibold text-ink">Our Space</h1>
        <p className="mt-1 text-sm text-muted">A private place to put things you don&rsquo;t want to lose.</p>

        {/* id/name/autocomplete values are what password managers look for:
            "username" + "current-password" is the pair that triggers save and autofill. */}
        <form id="login-form" onSubmit={handleSubmit} className="mt-6 space-y-3">
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full glass-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal"
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full glass-input py-2 pl-3 pr-11 text-sm outline-none focus:ring-2 focus:ring-teal"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-muted"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full glass-btn-primary px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
          {errorMessage && (
            <p role="alert" className="text-sm text-coral">
              {errorMessage}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}