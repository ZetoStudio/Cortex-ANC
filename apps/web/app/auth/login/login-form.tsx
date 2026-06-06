'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import type { DemoRole } from '@cortex/auth';

const ROLES: {
  role: DemoRole;
  title: string;
  description: string;
  primary?: boolean;
}[] = [
  {
    role: 'ceo',
    title: 'Sign in as CEO',
    description: 'Acme Corp & Global Dynamics — all internal projects',
    primary: true,
  },
  {
    role: 'client',
    title: 'Sign in as Client',
    description: 'BetaCorp only — your company dashboard & tickets',
    primary: true,
  },
  {
    role: 'admin',
    title: 'Platform admin',
    description: 'Full access, connectors, and brain debug',
  },
];

const DEMO_PASSWORD = 'password';

const EMAIL_BY_ROLE: Record<DemoRole, string> = {
  admin: 'admin@cortex.anc',
  ceo: 'ceo@cortex.anc',
  client: 'client@cortex.anc',
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/executive-desk';
  const [error, setError] = useState('');
  const [loadingRole, setLoadingRole] = useState<DemoRole | null>(null);

  async function signInAsRole(role: DemoRole) {
    setLoadingRole(role);
    setError('');
    const result = await signIn('credentials', {
      email: EMAIL_BY_ROLE[role],
      password: DEMO_PASSWORD,
      redirect: false,
    });
    setLoadingRole(null);
    if (result?.error) {
      setError('Could not sign in. Try again.');
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
        <h1 className="mt-6 text-xl font-semibold text-[#111111]">Choose your view</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pick a role to explore Cortex with the right data scope.
        </p>

        <div className="mt-8 space-y-3">
          {ROLES.filter((r) => r.primary).map(({ role, title, description }) => (
            <button
              key={role}
              type="button"
              onClick={() => signInAsRole(role)}
              disabled={loadingRole !== null}
              className="paper-card w-full p-4 text-left transition-colors hover:border-teal-300 hover:bg-teal-50/50 disabled:opacity-60"
            >
              <p className="font-medium text-[#111111]">
                {loadingRole === role ? 'Signing in…' : title}
              </p>
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => signInAsRole('admin')}
          disabled={loadingRole !== null}
          className="mt-4 w-full text-center text-sm text-gray-500 hover:text-teal-700 disabled:opacity-60"
        >
          {loadingRole === 'admin' ? 'Signing in…' : 'Platform admin →'}
        </button>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <Link href="/" className="mt-8 block text-center text-sm text-gray-500 hover:text-teal-600">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
