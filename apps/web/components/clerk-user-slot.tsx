'use client';

import dynamic from 'next/dynamic';

const ClerkUserInner = dynamic(() => import('./clerk-user-inner'), { ssr: false });

export function ClerkUserSlot() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <span className="text-xs text-[#94a3b8]">Auth: set Clerk keys in .env</span>;
  }
  return <ClerkUserInner />;
}
