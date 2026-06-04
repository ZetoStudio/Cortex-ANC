'use client';

import { UserButton, useUser } from '@clerk/nextjs';

export default function ClerkUserInner() {
  const { user, isLoaded } = useUser();
  if (!isLoaded) return null;
  return (
    <div className="flex items-center gap-3 text-sm text-[#94a3b8]">
      <span>{user?.firstName ?? user?.emailAddresses[0]?.emailAddress}</span>
      <UserButton />
    </div>
  );
}
