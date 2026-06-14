'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { authClient } from '@/lib/auth-client';

type LoginFormProps = {
  githubEnabled?: boolean;
  googleEnabled?: boolean;
};

export default function LoginForm({
  githubEnabled = false,
  googleEnabled = false,
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/auth/continue';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        const res = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.split('@')[0],
          callbackURL: '/auth/continue',
        });
        if (res.error) {
          setError(res.error.message ?? 'Sign up failed');
          return;
        }
      } else {
        const res = await authClient.signIn.email({
          email: email.trim(),
          password,
          callbackURL: callbackUrl,
        });
        if (res.error) {
          setError(res.error.message ?? 'Invalid email or password');
          return;
        }
      }
      router.push(mode === 'signup' ? '/onboarding' : (callbackUrl ?? '/auth/continue'));
    } catch {
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSocial(provider: 'github' | 'google') {
    const enabled = provider === 'github' ? githubEnabled : googleEnabled;
    if (!enabled) {
      const vars =
        provider === 'github'
          ? 'GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET'
          : 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET';
      setError(
        `${provider === 'github' ? 'GitHub' : 'Google'} sign-in is not configured. Add ${vars} to .env and restart.`,
      );
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authClient.signIn.social({
        provider,
        callbackURL: '/auth/continue',
      });
      if (res.error) {
        setError(res.error.message ?? `${provider} sign-in failed`);
        setLoading(false);
      }
    } catch {
      setError(`${provider === 'github' ? 'GitHub' : 'Google'} sign-in failed`);
      setLoading(false);
    }
  }

  const showSocial = githubEnabled || googleEnabled;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="dark-card w-full max-w-md p-8 animate-fade-in">
        <Link href="/" className="font-display text-2xl text-white">
          Cortex
        </Link>
        <h1 className="mt-6 text-xl font-semibold text-white">
          {mode === 'signin' ? 'Sign in' : 'Create workspace'}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {mode === 'signin'
            ? 'Sign in with email, or use GitHub if configured'
            : 'Create your workspace with email — we set everything up automatically'}
        </p>

        <form onSubmit={handleEmailSubmit} className="mt-8 space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-400">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-dark mt-1.5"
                placeholder="Your name"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-400">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-dark mt-1.5"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-400">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-dark mt-1.5"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create workspace'}
          </button>
        </form>

        {showSocial && (
          <>
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-800" />
              <span className="text-xs text-zinc-600">or</span>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>

            {githubEnabled && (
              <button
                type="button"
                onClick={() => handleSocial('github')}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 border border-zinc-700 bg-black px-4 py-3 text-sm text-white transition-colors hover:border-zinc-500"
              >
                Continue with GitHub
              </button>
            )}

            {googleEnabled && (
              <button
                type="button"
                onClick={() => handleSocial('google')}
                disabled={loading}
                className={`flex w-full items-center justify-center gap-2 border border-zinc-700 bg-black px-4 py-3 text-sm text-white transition-colors hover:border-zinc-500${githubEnabled ? ' mt-3' : ''}`}
              >
                Continue with Google
              </button>
            )}
          </>
        )}

        {!githubEnabled && mode === 'signin' && (
          <p className="mt-4 text-xs text-zinc-600">
            Want GitHub login? Add <code className="text-zinc-500">GITHUB_CLIENT_ID</code> and{' '}
            <code className="text-zinc-500">GITHUB_CLIENT_SECRET</code> to{' '}
            <code className="text-zinc-500">.env</code> (OAuth App callback:{' '}
            <code className="text-zinc-500">http://localhost:3000/api/auth/callback/github</code>
            ).
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError('');
          }}
          className="mt-4 w-full text-center text-sm text-zinc-500 hover:text-[#14b8a6]"
        >
          {mode === 'signin' ? 'Need a workspace? Sign up' : 'Already have an account? Sign in'}
        </button>

        <Link
          href="/"
          className="mt-8 block text-center text-sm text-zinc-500 transition-colors hover:text-[#14b8a6]"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
