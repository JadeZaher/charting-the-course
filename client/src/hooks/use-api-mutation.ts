// Mutation with the app's feedback contract: refresh what changed, confirm success, never fail silently.
// See client/src/AGENTS.md "Shared data and feedback contracts"; the behaviour lives in lib/api-mutation-options.ts.
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { apiMutationOptions, type ApiMutationOptions } from '@/lib/api-mutation-options';

export type { ApiMutationOptions, ToastCopy } from '@/lib/api-mutation-options';

/** useMutation that invalidates `invalidates`, toasts `success`, and toasts every error unless `silent`. */
export function useApiMutation<TData = unknown, TVariables = void, TContext = unknown>(
  options: ApiMutationOptions<TData, TVariables, TContext>,
): UseMutationResult<TData, Error, TVariables, TContext> {
  const queryClient = useQueryClient();
  return useMutation(apiMutationOptions(options, { queryClient, toast }));
}
