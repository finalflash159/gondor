'use client';

import { useQuery } from '@tanstack/react-query';

interface Project {
  id: string;
  name: string;
}

async function fetchProjects(organizationSlug: string): Promise<Project[]> {
  const res = await fetch(`/api/organizations/${organizationSlug}`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  const json = await res.json();
  return json?.data?.projects || [];
}

export function useProjects(organizationSlug: string, autoFetch = true) {
  return useQuery({
    queryKey: ['projects', organizationSlug],
    queryFn: () => fetchProjects(organizationSlug),
    enabled: autoFetch && !!organizationSlug,
    staleTime: 60 * 1000, // 1 minute
  });
}
