'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/executive-desk';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError('Invalid email or password');
      return;
    }
    router.push(callbackUrl);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-4">
      <div className="paper-card w-full max-w-md p-8 animate-fade-in">
        <Link href="/" className="font-display text-2xl text-[#111111]">
          Cortex
        </Link>
        <h1 className="mt-6 text-xl font-semibold text-[#111111]">Sign in</h1>
        <p className="mt-1 text-sm text-gray-500">
          Demo credentials — password is &quot;password&quot;
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input-light mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cortex.anc"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input-light mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 space-y-1 font-mono text-xs text-gray-400">
          <p>admin@cortex.anc — full access</p>
          <p>ceo@cortex.anc — all company projects</p>
          <p>client@cortex.anc — BetaCorp only</p>
        </div>
        <Link href="/" className="mt-6 block text-center text-sm text-gray-500 hover:text-teal-600">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
