// TanStack Query hooks for ETHOS data via Sanic BFF API

import { useQuery } from '@tanstack/react-query';
import { fetchEcosystems, fetchEcosystem } from '@/lib/api-client';
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

export function useEthosList(sector?: string, _limit = 20, _offset = 0) {
  return useQuery({
    queryKey: ['ethos-list', sector, _limit, _offset],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (sector && sector !== 'all') params.sector = sector;
      params.limit = String(_limit);
      params.offset = String(_offset);

      // fetchEcosystems maps to ethos — adapter layer
      const result = await fetchEcosystems();
      // Map ecosystem shape to ethos shape expected by components
      const ecosystems = (result as any).ecosystems || (result as any).items || [];
      const ethos: EthosSummary[] = ecosystems.map((e: any) => ({
        id: e.id,
        name: e.name,
        slug: e.slug || e.id,
        description: e.description,
        sector: e.sector,
        member_count: e.member_count ?? 0,
        banner_url: e.banner_url ?? null,
        icon_url: e.icon_url ?? null,
      }));
      return { ethos, total: (result as any).total ?? ethos.length } as EthosListResponse;
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useEthosDetail(slug: string) {
  return useQuery({
    queryKey: ['ethos-detail', slug],
    queryFn: async () => {
      if (!slug) return null;
      const result = await fetchEcosystem(slug);
      // Map ecosystem detail to ethos detail shape
      const ethos: EthosDetail = {
        id: (result as any).id,
        name: (result as any).name,
        slug: (result as any).slug || (result as any).id,
        description: (result as any).description,
        sector: (result as any).sector,
        member_count: (result as any).member_count ?? 0,
        banner_url: (result as any).banner_url ?? null,
        icon_url: (result as any).icon_url ?? null,
        long_description: (result as any).long_description ?? null,
        principles: (result as any).principles ?? [],
        tags: (result as any).tags ?? [],
        created_at: (result as any).created_at,
      } as unknown as EthosDetail;
      const members: EthosMemberWithProfile[] = (result as any).members ?? [];
      return {
        ethos,
        members,
        viewer_alignment: (result as any).viewer_alignment ?? null,
      } as EthosDetailResponse;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
}
