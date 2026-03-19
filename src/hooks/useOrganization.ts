'use client';

import { useQuery } from '@tanstack/react-query';

interface Organization {
  id: string;
  name: string;
  slug: string;
}

async function fetchOrganization(slug: string): Promise<Organization> {
  const res = await fetch(`/api/organizations/${slug}`);
  if (!res.ok) throw new Error('Failed to fetch organization');
  const json = await res.json();
  return json?.data ?? json;
}

export function useOrganization(slug: string, autoFetch = true) {
  return useQuery({
    queryKey: ['organization', slug],
    queryFn: () => fetchOrganization(slug),
    enabled: autoFetch && !!slug,
    staleTime: 60 * 1000, // 1 minute
  });
}
