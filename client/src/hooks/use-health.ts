// Agreement review outcomes and the computed health snapshot. See client/src/AGENTS.md "Maintenance and health (G-Maint)".
// Forms render failures inline (silent), like the other governance hooks.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiMutation } from '@/hooks/use-api-mutation';
import * as api from '@/lib/api-client';
import { affects, healthKeys, keys } from '@/lib/query-keys';
import { agreementStatusLabel } from '@/lib/agreement-status';
import type { AgreementStatusChange, AuditResponseRequest } from '@/types/api';

/** Start, finish (keep or sunset) or archive: one status move on an agreement in force. */
export function useChangeAgreementStatus(id: string) {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: (data: AgreementStatusChange) => api.changeAgreementStatus(id, data),
    onSuccess: (data) => { queryClient.setQueryData(keys.agreements.detail(id), data); },
    invalidates: affects.agreements,
    success: (data) => `Agreement is now ${agreementStatusLabel(data.status)}`,
    silent: true,
  });
}

/** FX-Maint (F6): abandon a draft audit with a recorded reason; it stops holding the "audit due" reminder. */
export function useAbandonAudit(id: string) {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: (reason: string) => api.abandonAudit(id, reason),
    onSuccess: (data) => { queryClient.setQueryData(keys.audits.detail(id), data); },
    invalidates: affects.audits,
    success: 'Draft abandoned',
    silent: true,
  });
}

/** FX-Maint (F7): the stewards' recorded response to a published audit; it clears "Respond to the critical health indicators". */
export function useRespondToAudit(id: string) {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: (data: AuditResponseRequest) => api.respondToAudit(id, data),
    onSuccess: (data) => { queryClient.setQueryData(keys.audits.detail(id), data); },
    invalidates: affects.audits,
    success: 'Response recorded',
    silent: true,
  });
}

/** Computed indicator values and "needs attention" counts for one ecosystem; the server defaults to the 90 days ending today. */
export function useHealthSnapshot(params: { ecosystem_id?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: healthKeys.snapshot(params),
    queryFn: () => api.fetchHealthSnapshot({ ...params, ecosystem_id: params.ecosystem_id! }),
    enabled: !!params.ecosystem_id,
    staleTime: 60_000,
  });
}
