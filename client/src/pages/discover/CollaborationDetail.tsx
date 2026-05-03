import { Link, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ArrowRight, Calendar, Clock, FileText, Link2 } from 'lucide-react';
import { useCollaboration } from '@/hooks/use-discover';

const statusVariant = (status: string) => {
  switch (status) {
    case 'active': return 'default' as const;
    case 'proposed': return 'secondary' as const;
    case 'completed': return 'outline' as const;
    case 'dissolved': return 'destructive' as const;
    default: return 'secondary' as const;
  }
};

const tierVariant = (tier: string) => {
  switch (tier) {
    case 'deep': return 'default' as const;
    case 'formal': return 'secondary' as const;
    default: return 'outline' as const;
  }
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function CollaborationDetail() {
  const [, params] = useRoute('/discover/collaborations/:id');
  const id = params?.id ?? '';

  const { data: collab, isLoading, error } = useCollaboration(id);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  if (error || !collab) {
    return (
      <div className="space-y-4">
        <Link href="/discover">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Discover
          </Button>
        </Link>
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load collaboration</p>
          {error && <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>}
        </div>
      </div>
    );
  }

  const linkedItems = collab.linked_shares_needs
    ? Object.entries(collab.linked_shares_needs)
    : [];

  const termsText = typeof collab.terms?.text === 'string' ? collab.terms.text : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/discover">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Discover
        </Button>
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold">{collab.title}</h1>
          <Badge variant={statusVariant(collab.status)} className="capitalize text-sm px-3 py-1">
            {collab.status}
          </Badge>
          <Badge variant={tierVariant(collab.engagement_tier)} className="capitalize text-sm px-3 py-1">
            {collab.engagement_tier}
          </Badge>
        </div>

        {/* Domain path */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="font-medium text-foreground">
            {collab.source_domain_name ?? collab.source_domain_id}
          </span>
          {collab.source_ecosystem_name && (
            <span className="text-xs">({collab.source_ecosystem_name})</span>
          )}
          <ArrowRight className="h-4 w-4 shrink-0" />
          <span className="font-medium text-foreground">
            {collab.target_domain_name ?? collab.target_domain_id}
          </span>
          {collab.target_ecosystem_name && (
            <span className="text-xs">({collab.target_ecosystem_name})</span>
          )}
        </div>
      </div>

      {/* Overview card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {collab.description && (
            <p className="text-sm leading-relaxed">{collab.description}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Started</p>
                <p className="text-sm font-medium">{formatDate(collab.started_date)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Review Date</p>
                <p className="text-sm font-medium">{formatDate(collab.review_date)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{formatDate(collab.created_at)}</p>
              </div>
            </div>
          </div>

          {collab.version_fingerprint && (
            <p className="text-xs text-muted-foreground">Version: {collab.version_fingerprint}</p>
          )}
        </CardContent>
      </Card>

      {/* Terms card */}
      {termsText && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{termsText}</p>
          </CardContent>
        </Card>
      )}

      {/* Linked Shares & Needs */}
      {linkedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Linked Shares & Needs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {linkedItems.map(([key, value]) => (
                <li key={key} className="text-sm flex items-center gap-2">
                  <span className="text-muted-foreground font-mono text-xs">{key}</span>
                  <span className="text-muted-foreground">—</span>
                  <span>{String(value)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Raw terms JSON if not plain text */}
      {collab.terms && !termsText && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted rounded p-3 overflow-auto whitespace-pre-wrap">
              {JSON.stringify(collab.terms, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
