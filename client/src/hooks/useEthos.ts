import { useQuery } from '@tanstack/react-query';
import { keys } from '@/lib/query-keys';
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
  stewards: { display_name: string; role: string }[];
  callerRole: string | null;
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function mapStewards(value: unknown): { display_name: string; role: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const record = row as { display_name?: unknown; name?: unknown; role?: unknown };
    const displayName = toOptionalString(record.display_name) ?? toOptionalString(record.name);
    if (!displayName) return [];
    return [{ display_name: displayName, role: toOptionalString(record.role) ?? 'steward' }];
  });
}

function toStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function mapEthosSummary(ecosystem: Record<string, any>): EthosSummary {
  const alignment = toOptionalNumber(ecosystem.alignment_score);

  return {
    id: String(ecosystem.id),
    slug: toOptionalString(ecosystem.slug) ?? String(ecosystem.id),
    name: toOptionalString(ecosystem.name) ?? 'Untitled ecosystem',
    tagline: toOptionalString(ecosystem.tagline) ?? toOptionalString(ecosystem.description),
    description: toOptionalString(ecosystem.description),
    sector: toOptionalString(ecosystem.sector),
    ethos_type: toOptionalString(ecosystem.ethos_type) ?? 'ecosystem',
    image_url: toOptionalString(ecosystem.logo_url) ?? toOptionalString(ecosystem.image_url),
    member_count: Number.isFinite(Number(ecosystem.member_count)) ? Number(ecosystem.member_count) : 0,
    member_avatars: toStringList(ecosystem.member_avatars),
    alignment_score: alignment,
    status: toOptionalString(ecosystem.status),
    location: toOptionalString(ecosystem.location),
    tags: toStringList(ecosystem.tags),
    website: toOptionalString(ecosystem.website),
    founded_date: toOptionalString(ecosystem.founded_date),
  };
}

export function useEthosList(sector?: string, limit = 20, offset = 0) {
  return useQuery({
    // Shares keys.ecosystems.list({}) with the admin panel; mapping, filtering and paging happen in `select`.
    queryKey: keys.ecosystems.list(),
    queryFn: () => fetchEcosystems(),
    select: (result): EthosListResponse => {
      const ecosystems = (result as any).ecosystems || (result as any).items || [];
      const mapped = ecosystems.map((ecosystem: Record<string, any>) => mapEthosSummary(ecosystem));
      const filtered = sector && sector !== 'all'
        ? mapped.filter((ethos: EthosSummary) => ethos.sector?.toLowerCase() === sector.toLowerCase())
        : mapped;
      const ethos = filtered.slice(offset, offset + limit);

      return {
        ethos,
        total: sector && sector !== 'all' ? filtered.length : ((result as any).total ?? filtered.length),
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useEthosDetail(id: string) {
  return useQuery({
    queryKey: keys.ecosystems.detail(id),
    queryFn: () => fetchEcosystem(id),
    select: (detail): EthosDetailResponse => {
      const result = detail as unknown as Record<string, any>;
      const summary = mapEthosSummary(result);
      const status = toOptionalString(result.status);
      const members: EthosMemberWithProfile[] = Array.isArray(result.members) ? result.members : [];
      const externalLinks = Array.isArray(result.external_links)
        ? result.external_links.filter((item): item is { label: string; url: string } => (
            typeof item?.label === 'string' && typeof item?.url === 'string'
          ))
        : [];

      const ethos: EthosDetail = {
        ...summary,
        mission: toOptionalString(result.mission),
        external_url: toOptionalString(result.website) ?? toOptionalString(result.external_url),
        is_active: status ? status === 'active' : true,
        is_public: result.visibility ? result.visibility === 'public' : true,
        created_at: toOptionalString(result.created_at) ?? '',
        governance_summary: toOptionalString(result.governance_summary),
        phase: toOptionalString(result.phase),
        map_url: toOptionalString(result.map_url),
        map_type: toOptionalString(result.map_type),
        map_title: toOptionalString(result.map_title),
        external_links: externalLinks,
      };

      return {
        ethos,
        members,
        viewer_alignment: toOptionalNumber(result.viewer_alignment) ?? null,
        stewards: mapStewards(result.stewards),
        callerRole: toOptionalString(result.caller_role) ?? null,
      };
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
