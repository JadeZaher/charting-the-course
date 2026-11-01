// Exit reads and writes on the shared key factory and feedback contract.
// See pages/governance/AGENTS.md "Emergency and exit": failures render inline (silent), successes toast here.
import { useQuery } from '@tanstack/react-query';
import { useApiMutation } from '@/hooks/use-api-mutation';
import * as api from '@/lib/api-client';
import { exitStatusLabel } from '@/lib/exit-status';
import { affects, keys } from '@/lib/query-keys';
import type { ExitFiling, PortableRecord } from '@/types/api';

export function useExitList(params?: Record<string, string>) {
  return useQuery({ queryKey: keys.exits.list(params), queryFn: () => api.fetchExits(params), staleTime: 30_000 });
}

export function useExitView(id: string) {
  return useQuery({ queryKey: keys.exits.detail(id), queryFn: () => api.fetchExitView(id), enabled: !!id, staleTime: 30_000 });
}

/** The form navigates and confirms itself, so no success toast here. */
export function useFileExit() {
  return useApiMutation({ mutationFn: (data: ExitFiling) => api.fileExit(data), invalidates: affects.exits, silent: true });
}

export function useMoveExit(id: string) {
  return useApiMutation({
    mutationFn: (newStatus: string) => api.moveExit(id, newStatus),
    invalidates: affects.exits,
    silent: true,
    success: (exit) => `Exit is now: ${exitStatusLabel(exit.status).toLowerCase()}`,
  });
}

function saveJson(record: PortableRecord, filename: string): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Fetches the leaver's portable record, saves it as a JSON file and refreshes the "downloaded" date. */
export function usePortableRecordDownload(exitId: string) {
  return useApiMutation({
    mutationFn: async () => {
      const record = await api.fetchPortableRecord(exitId);
      saveJson(record, `neos-governance-record-${record.generated_at.slice(0, 10)}.json`);
      return record;
    },
    invalidates: affects.exits,
    silent: true,
    success: { title: 'Record downloaded', description: 'Your governance record was saved as a JSON file.' },
  });
}
