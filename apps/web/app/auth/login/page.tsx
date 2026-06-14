import { Suspense } from 'react';

import { githubAuthEnabled, googleAuthEnabled } from '@/lib/auth-config';

import LoginForm from './login-form';

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-screen items-center justify-center">Loading…</div>}
    >
      <LoginForm githubEnabled={githubAuthEnabled} googleEnabled={googleAuthEnabled} />
    </Suspense>
  );
}
