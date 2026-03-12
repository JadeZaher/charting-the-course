// TanStack Query hooks for ETHOS data

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { EthosSummary, EthosDetail, EthosMemberWithProfile } from '@/types/orientation';

interface EthosListResponse {
  ethos: EthosSummary[];
  total: number;
}

interface EthosDetailResponse {
  ethos: EthosDetail;
  members: EthosMemberWithProfile[];
  viewer_alignment: number | null;
}

async function fetchEthosList(sector?: string, limit = 20, offset = 0): Promise<EthosListResponse> {
  const params = new URLSearchParams();
  if (sector && sector !== 'all') params.set('sector', sector);
  params.set('limit', String(limit));
  params.set('offset', String(offset));

  const { data, error } = await supabase.functions.invoke(`ethos-list?${params.toString()}`, {
    method: 'GET',
  });

  if (error) throw new Error(error.message || 'Failed to fetch ETHOS list');
  return data as EthosListResponse;
}

async function fetchEthosDetail(slug: string): Promise<EthosDetailResponse> {
  const { data, error } = await supabase.functions.invoke(`ethos-get/${slug}`, {
    method: 'GET',
  });

  if (error) throw new Error(error.message || 'Failed to fetch ETHOS detail');
  return data as EthosDetailResponse;
}

export function useEthosList(sector?: string, limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['ethos-list', sector, limit, offset],
    queryFn: () => fetchEthosList(sector, limit, offset),
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useEthosDetail(slug: string) {
  return useQuery({
    queryKey: ['ethos-detail', slug],
    queryFn: () => fetchEthosDetail(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
}
