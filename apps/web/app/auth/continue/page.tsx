'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthContinuePage() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/onboarding/connected-check')
      .then((r) => r.json())
      .then((d: { redirectTo?: string }) => {
        router.replace(d.redirectTo ?? '/onboarding');
      })
      .catch(() => router.replace('/onboarding'));
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
      Signing you in…
    </div>
  );
}
