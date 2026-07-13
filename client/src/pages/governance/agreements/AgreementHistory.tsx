import { useMemo, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useAgreementHistory, useRollbackAgreement } from '@/hooks/use-governance';
import { ArrowLeft, FileEdit, Search, RotateCcw, GitBranch } from 'lucide-react';
import type { AmendmentRecord, ReviewRecord, AgreementVersionRecord } from '@/types/api';

type TimelineItem =
  | { kind: 'amendment'; date: string | null; data: AmendmentRecord }
  | { kind: 'review'; date: string | null; data: ReviewRecord }
  | { kind: 'version'; date: string | null; data: AgreementVersionRecord };

export default function AgreementHistory() {
  const [, params] = useRoute('/agreements/:id/history');
  const id = params?.id ?? '';
  const { data, isLoading, error } = useAgreementHistory(id);
  const rollbackMutation = useRollbackAgreement(id);
  const [rollingBack, setRollingBack] = useState<string | null>(null);

  const timeline = useMemo<TimelineItem[]>(() => {
    if (!data) return [];
    const items: TimelineItem[] = [
      ...data.amendments.map((a) => ({ kind: 'amendment' as const, date: a.date, data: a })),
      ...data.reviews.map((r) => ({ kind: 'review' as const, date: r.date, data: r })),
      ...(data.versions || []).map((v) => ({ kind: 'version' as const, date: v.created_at, data: v })),
    ];
    items.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da; // newest first
    });
    return items;
  }, [data]);

  const handleRollback = async (versionId: string) => {
    if (!confirm('Are you sure you want to rollback to this version? The current state will be saved as a snapshot first.')) return;
    setRollingBack(versionId);
    try {
      await rollbackMutation.mutateAsync(versionId);
    } finally {
      setRollingBack(null);
    }
  };

  if (isLoading) return <LoadingState message="Loading history..." />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load history</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/agreements/${id}`}>Back to Agreement</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/agreements/${id}`}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Agreement
        </Link>
      </Button>

      <h1 className="text-3xl font-bold">Agreement History</h1>

      {timeline.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No history records found
          </CardContent>
        </Card>
      ) : (
        <div className="relative border-l-2 border-muted ml-4 space-y-6">
          {timeline.map((item) => {
            const isAmendment = item.kind === 'amendment';
            const isVersion = item.kind === 'version';
            const Icon = isVersion ? GitBranch : isAmendment ? FileEdit : Search;
            return (
              <div key={item.data.id} className="relative pl-8">
                <div className="absolute -left-[11px] top-1 flex h-5 w-5 items-center justify-center border-2 border-background bg-muted">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                </div>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={isVersion ? 'outline' : isAmendment ? 'default' : 'secondary'}>
                        {isVersion ? 'Version Snapshot' : isAmendment ? 'Amendment' : 'Review'}
                      </Badge>
                      {item.kind !== 'version' && (
                        <Badge variant="outline">
                          {item.kind === 'amendment' ? item.data.status : item.data.outcome ?? '-'}
                        </Badge>
                      )}
                      {isVersion && (
                        <Badge variant="outline">v{(item.data as AgreementVersionRecord).version}</Badge>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {item.date ? new Date(item.date).toLocaleDateString() : 'No date'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    {isVersion ? (
                      <>
                        <p><span className="text-muted-foreground">Title:</span> {(item.data as AgreementVersionRecord).title}</p>
                        <p><span className="text-muted-foreground">Status:</span> {(item.data as AgreementVersionRecord).status}</p>
                        {(item.data as AgreementVersionRecord).change_reason && (
                          <p><span className="text-muted-foreground">Reason:</span> {(item.data as AgreementVersionRecord).change_reason}</p>
                        )}
                        {(item.data as AgreementVersionRecord).changed_by && (
                          <p><span className="text-muted-foreground">Changed by:</span> {(item.data as AgreementVersionRecord).changed_by}</p>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          disabled={rollingBack === item.data.id}
                          onClick={() => handleRollback(item.data.id)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          {rollingBack === item.data.id ? 'Rolling back...' : 'Rollback to this version'}
                        </Button>
                      </>
                    ) : isAmendment ? (
                      <>
                        <p><span className="text-muted-foreground">Type:</span> {(item.data as AmendmentRecord).amendment_type}</p>
                        {(item.data as AmendmentRecord).proposed_by && (
                          <p><span className="text-muted-foreground">Proposed by:</span> {(item.data as AmendmentRecord).proposed_by}</p>
                        )}
                        {(item.data as AmendmentRecord).rationale && (
                          <p><span className="text-muted-foreground">Rationale:</span> {(item.data as AmendmentRecord).rationale}</p>
                        )}
                        {(item.data as AmendmentRecord).new_agreement_version && (
                          <p><span className="text-muted-foreground">New version:</span> {(item.data as AmendmentRecord).new_agreement_version}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p><span className="text-muted-foreground">Type:</span> {(item.data as ReviewRecord).review_type}</p>
                        {(item.data as ReviewRecord).trigger && (
                          <p><span className="text-muted-foreground">Trigger:</span> {(item.data as ReviewRecord).trigger}</p>
                        )}
                        {(item.data as ReviewRecord).outcome && (
                          <p><span className="text-muted-foreground">Outcome:</span> {(item.data as ReviewRecord).outcome}</p>
                        )}
                        {(item.data as ReviewRecord).next_review_date && (
                          <p><span className="text-muted-foreground">Next review:</span> {new Date((item.data as ReviewRecord).next_review_date!).toLocaleDateString()}</p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
