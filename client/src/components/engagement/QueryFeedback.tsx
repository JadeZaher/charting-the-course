import { Button } from '@/components/ui/button';

export function QueryFeedback({ pending, error, retry }: { pending: boolean; error: Error | null; retry: () => unknown }) {
  if (pending) return <p role="status" className="py-6 text-muted-foreground">Loading…</p>;
  if (error) return <div role="alert" className="space-y-3 border border-destructive p-4"><p>{error.message || 'This information could not be loaded.'}</p><Button variant="outline" onClick={() => retry()}>Try again</Button></div>;
  return null;
}
export function MutationFeedback({ error, success, successText = 'Saved.' }: { error: Error | null; success?: boolean; successText?: string }) {
  if (error) return <p role="alert" className="text-sm text-destructive">{error.message}</p>;
  return success ? <p role="status" className="text-sm text-success">{successText}</p> : null;
}
