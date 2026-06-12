import { Suspense } from 'react';

import OnboardingClient from './onboarding-client';

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
          Loading…
        </div>
      }
    >
      <OnboardingClient />
    </Suspense>
  );
}
