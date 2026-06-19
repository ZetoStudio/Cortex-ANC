import { Suspense } from 'react';

import RoleContinueClient from './role-continue-client';

export default function AuthContinuePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
          Signing you in…
        </div>
      }
    >
      <RoleContinueClient />
    </Suspense>
  );
}
