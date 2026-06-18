'use client';

import { useSearchParams } from 'next/navigation';

import { PanelDashboard } from '@/components/panel/panel-dashboard';

export function PanelPageClient() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const initialTab =
    tab === 'connections' || tab === 'logs' || tab === 'improvements' ? tab : undefined;

  return <PanelDashboard initialTab={initialTab} view="overview" />;
}
