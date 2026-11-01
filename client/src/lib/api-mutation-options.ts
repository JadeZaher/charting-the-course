// Mutation options with the app's feedback contract; useApiMutation is the React wrapper.
// See client/src/AGENTS.md "Shared data and feedback contracts".
import type { QueryClient, QueryKey, UseMutationOptions } from '@tanstack/react-query';
import { apiErrorMessage } from './api-error-message';

/** Toast copy; a bare string is the title. */
export type ToastCopy = string | { title: string; description?: string };

/** A value, or a function deriving it from the mutation result and its variables. */
type FromResult<Value, TData, TVariables> = Value | ((data: TData, variables: TVariables) => Value);

export interface ApiMutationOptions<TData, TVariables, TContext>
  extends Omit<UseMutationOptions<TData, Error, TVariables, TContext>, 'mutationFn'> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Key prefixes to invalidate on success, usually `affects.<domain>` from lib/query-keys.ts. */
  invalidates?: FromResult<readonly QueryKey[], TData, TVariables>;
  /** Success toast; the function form may return null to stay quiet. */
  success?: FromResult<ToastCopy | null, TData, TVariables>;
  /** Error toast title; the description comes from apiErrorMessage. */
  error?: string;
  /** Skip the error toast because the caller renders the error inline. */
  silent?: boolean;
}

/** The toast call the options make; the hook passes hooks/use-toast's `toast`. */
export type ShowToast = (toast: { title: string; description?: string; variant?: 'destructive' }) => unknown;

/** Collaborators injected so the options run outside React (and under node:test). */
export interface MutationFeedback {
  queryClient: QueryClient;
  toast: ShowToast;
}

const DEFAULT_ERROR_TITLE = "That didn't go through";

/** Options that invalidate `invalidates`, toast `success`, and toast every error unless `silent`. */
export function apiMutationOptions<TData, TVariables, TContext>(
  {
    invalidates,
    success,
    error: errorTitle = DEFAULT_ERROR_TITLE,
    silent = false,
    onSuccess,
    onError,
    ...options
  }: ApiMutationOptions<TData, TVariables, TContext>,
  { queryClient, toast }: MutationFeedback,
): UseMutationOptions<TData, Error, TVariables, TContext> {
  return {
    ...options,
    onSuccess: async (data, variables, context) => {
      try {
        await onSuccess?.(data, variables, context);
      } catch (callbackError) {
        // The write already succeeded: a throwing follow-up must not toast failure or run the caller's rollback.
        console.error('useApiMutation: onSuccess threw after a successful mutation', callbackError);
      }
      const copy = typeof success === 'function' ? success(data, variables) : success;
      if (copy) toast(typeof copy === 'string' ? { title: copy } : copy);
      const prefixes = typeof invalidates === 'function' ? invalidates(data, variables) : invalidates ?? [];
      // Awaited so mutateAsync resolves (and isPending clears) only once the refreshed data is in.
      await Promise.all(prefixes.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
    onError: async (error, variables, context) => {
      if (!silent) toast({ variant: 'destructive', title: errorTitle, description: apiErrorMessage(error) });
      await onError?.(error, variables, context);
    },
  };
}
