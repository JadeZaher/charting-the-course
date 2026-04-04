import { Link, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useEcosystemDetail } from '@/hooks/use-governance';
import { Pencil, ArrowLeft } from 'lucide-react';

const statusVariant = (status: string) => {
  switch (status) {
    case 'active': return 'default' as const;
    case 'forming': return 'secondary' as const;
    case 'inactive': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

export default function EcosystemDetail() {
  const [, params] = useRoute('/ecosystems/:id');
  const id = params?.id ?? '';
  const { data, isLoading, error } = useEcosystemDetail(id);

  if (isLoading) return <LoadingState message="Loading ecosystem..." />;

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load ecosystem</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message || 'Not found'}</p>
        <Link href="/ecosystems">
          <Button variant="outline" className="mt-4">Back to Ecosystems</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/ecosystems">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Ecosystems
        </Button>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{data.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(data.status)}>{data.status}</Badge>
            {data.visibility && <Badge variant="outline">{data.visibility}</Badge>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/ecosystems/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {data.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.description}</div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Location</dt>
              <dd className="font-medium">{data.location || '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Website</dt>
              <dd className="font-medium">
                {data.website ? (
                  <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    {data.website}
                  </a>
                ) : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Founded</dt>
              <dd className="font-medium">{data.founded_date ? new Date(data.founded_date).toLocaleDateString() : '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Member Count</dt>
              <dd className="font-medium">{data.member_count ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Contact Email</dt>
              <dd className="font-medium">
                {data.contact_email ? (
                  <a href={`mailto:${data.contact_email}`} className="text-primary underline">
                    {data.contact_email}
                  </a>
                ) : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Visibility</dt>
              <dd className="font-medium">{data.visibility || '-'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {data.tags && data.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.governance_summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Governance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.governance_summary}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
