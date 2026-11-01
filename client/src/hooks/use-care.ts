// Conflict, repair and audit queries and mutations; pages/governance/{conflicts,safeguards} read from here.
// Forms and modals render their failures inline (silent), like the rest of the governance hooks.
import { useQuery } from '@tanstack/react-query';
import { useApiMutation } from '@/hooks/use-api-mutation';
import * as api from '@/lib/api-client';
import { affects, keys } from '@/lib/query-keys';
import type { AuditDraftFields } from '@/types/api';

export function useConflicts(params?: Record<string, string>) {
  return useQuery({ queryKey: keys.conflicts.list(params), queryFn: () => api.fetchConflicts(params), staleTime: 30_000 });
}
export function useConflict(id: string) {
  return useQuery({ queryKey: keys.conflicts.detail(id), queryFn: () => api.fetchConflict(id), enabled: !!id, staleTime: 30_000 });
}
export function useReportConflict() {
  return useApiMutation({ mutationFn: api.createConflict, invalidates: affects.conflicts, silent: true });
}
/** Triage, move a case along, or (as the reporter) correct or withdraw it. */
export function useUpdateConflict() {
  return useApiMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => api.updateConflict(id, data),
    invalidates: affects.conflicts,
    silent: true,
  });
}
export function useCreateRepairAgreement(conflictId: string) {
  return useApiMutation({
    mutationFn: (data: Record<string, unknown>) => api.createRepairAgreement(conflictId, data),
    invalidates: affects.conflicts,
    success: { title: 'Repair agreement saved', description: 'Check-ins are scheduled at 30, 60 and 90 days.' },
    silent: true,
  });
}
export function useRecordRepairCheckin(conflictId: string) {
  return useApiMutation({
    mutationFn: ({ repairId, data }: { repairId: string; data: Record<string, unknown> }) => api.updateRepairAgreement(conflictId, repairId, data),
    invalidates: affects.conflicts,
    success: 'Check-in saved',
    silent: true,
  });
}

export function useSafeguards() {
  return useQuery({ queryKey: keys.safeguards.overview(), queryFn: () => api.fetchSafeguards(), staleTime: 30_000 });
}
export function useAudits(params?: Record<string, string>) {
  return useQuery({ queryKey: keys.audits.list(params), queryFn: () => api.fetchAudits(params), staleTime: 30_000 });
}
export function useAudit(id: string) {
  return useQuery({ queryKey: keys.audits.detail(id), queryFn: () => api.fetchAudit(id), enabled: !!id, staleTime: 30_000 });
}
/** Starts a draft with the caller as auditor; the form renders failures inline. */
export function useStartAudit() {
  return useApiMutation({ mutationFn: api.requestAudit, invalidates: affects.audits, silent: true });
}
export function useSaveAuditDraft() {
  return useApiMutation({
    mutationFn: ({ id, data }: { id: string; data: AuditDraftFields }) => api.updateAudit(id, data),
    invalidates: affects.audits,
    silent: true,
  });
}
export function usePublishAudit() {
  return useApiMutation({
    mutationFn: (id: string) => api.publishAudit(id),
    invalidates: affects.audits,
    success: { title: 'Audit published', description: 'The health score now reflects it.' },
    silent: true,
  });
}
