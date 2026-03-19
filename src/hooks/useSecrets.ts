'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Secret {
  id: string;
  key: string;
  value?: string;
  version: number;
  envId: string;
  folderId: string;
  projectId: string;
  expiresAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SecretsResponse {
  data: Secret[];
  pagination: Pagination;
}

async function fetchSecrets(
  projectId: string,
  envId: string,
  page: number,
  limit: number
): Promise<SecretsResponse> {
  const res = await fetch(
    `/api/projects/${projectId}/secrets?envId=${envId}&page=${page}&limit=${limit}`
  );
  if (!res.ok) throw new Error('Failed to fetch secrets');
  const json = await res.json();
  return json?.data ?? json;
}

export function useSecrets(
  projectId: string,
  envId: string,
  page = 1,
  limit = 50,
  autoFetch = true
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['secrets', projectId, envId, page, limit],
    queryFn: () => fetchSecrets(projectId, envId, page, limit),
    enabled: autoFetch && !!projectId && !!envId,
    staleTime: 30 * 1000, // 30 seconds
  });

  const createMutation = useMutation({
    mutationFn: async ({
      key,
      value,
      folderId,
    }: {
      key: string;
      value: string;
      folderId?: string;
    }) => {
      const res = await fetch(`/api/projects/${projectId}/secrets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, envId, folderId }),
      });
      if (!res.ok) throw new Error('Failed to create secret');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secrets', projectId, envId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      secretId,
      key,
      value,
    }: {
      secretId: string;
      key: string;
      value: string;
    }) => {
      const res = await fetch(`/api/secrets/${secretId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error('Failed to update secret');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secrets', projectId, envId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (secretId: string) => {
      const res = await fetch(`/api/secrets/${secretId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete secret');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secrets', projectId, envId] });
    },
  });

  return {
    secrets: query.data?.data ?? [],
    pagination: query.data?.pagination ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    isFetching: query.isFetching,
    refetch: query.refetch,
    createSecret: createMutation.mutateAsync,
    updateSecret: updateMutation.mutateAsync,
    deleteSecret: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
