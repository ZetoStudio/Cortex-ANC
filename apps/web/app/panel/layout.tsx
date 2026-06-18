import { Suspense } from 'react';

import { PanelLayoutClient } from './panel-layout-client';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-[#0a0a0a] text-zinc-500">
          Loading panel…
        </div>
      }
    >
      <PanelLayoutClient>{children}</PanelLayoutClient>
    </Suspense>
  );
}
