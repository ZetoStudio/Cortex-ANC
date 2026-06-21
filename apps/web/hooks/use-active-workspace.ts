'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useCortexUser } from '@/hooks/use-cortex-user';

export type WorkspaceProject = {
  id: string;
  name: string;
  slug: string;
  githubRepos: string[];
};

const STORAGE_KEY = 'cortex-active-workspace-id';
export const TENANT_WORKSPACE_RENAMED_EVENT = 'cortex:tenant-workspace-renamed';

export function useActiveWorkspace() {
  const { projectIds } = useCortexUser();
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveIdState] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [projectsRes, workspaceRes] = await Promise.all([
      fetch('/api/projects'),
      fetch('/api/panel/workspace'),
    ]);

    if (projectsRes.ok) {
      const data = (await projectsRes.json()) as { projects?: WorkspaceProject[] };
      setProjects(data.projects ?? []);
    }

    if (workspaceRes.ok) {
      const data = (await workspaceRes.json()) as { name?: string };
      setCompanyName(data.name?.trim() || null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refresh();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    const onRenamed = () => {
      void refresh();
    };
    window.addEventListener(TENANT_WORKSPACE_RENAMED_EVENT, onRenamed);
    return () => window.removeEventListener(TENANT_WORKSPACE_RENAMED_EVENT, onRenamed);
  }, [refresh]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && projectIds.includes(stored)) {
      setActiveIdState(stored);
      return;
    }
    if (projects.length === 1) {
      setActiveIdState(projects[0]!.id);
    }
  }, [projectIds, projects]);

  const setActiveId = useCallback(
    (id: string | null) => {
      if (id && !projectIds.includes(id)) return;
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
      setActiveIdState(id);
    },
    [projectIds],
  );

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeId) ?? null,
    [projects, activeId],
  );

  const effectiveProjectIds = useMemo(() => {
    if (activeId && projectIds.includes(activeId)) return [activeId];
    return projectIds;
  }, [activeId, projectIds]);

  return {
    projects,
    companyName,
    loading,
    activeId,
    activeProject,
    setActiveId,
    effectiveProjectIds,
    canSwitch: projects.length > 1,
  };
}
