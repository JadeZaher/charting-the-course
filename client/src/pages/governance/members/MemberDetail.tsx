import { Link, useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useMember, useMemberOnboarding } from '@/hooks/use-governance';
import { Pencil, ArrowLeft } from 'lucide-react';

const statusVariant = (status: string) => {
  switch (status) {
    case 'active': return 'default' as const;
    case 'prospective': return 'secondary' as const;
    case 'inactive': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

export default function MemberDetail() {
  const [, params] = useRoute('/members/:id');
  const id = params?.id ?? '';
  const [, navigate] = useLocation();
  const { data, isLoading, error } = useMember(id);
  const { data: onboarding } = useMemberOnboarding(id);

  if (isLoading) return <LoadingState message="Loading member..." />;

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load member</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message || 'Not found'}</p>
        <Link href="/members">
          <Button variant="outline" className="mt-4">Back to Members</Button>
        </Link>
      </div>
    );
  }

  const onboardingProgress = onboarding?.sections
    ? Math.round((onboarding.sections.filter((s: any) => s.completed).length / onboarding.sections.length) * 100)
    : null;

  return (
    <div className="space-y-6">
      <Link href="/members">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Members
        </Button>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{data.display_name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(data.current_status)}>{data.current_status}</Badge>
            <Badge variant="outline">{data.profile}</Badge>
            <span className="text-sm text-muted-foreground">{data.member_id}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/members/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-medium">{data.phone || '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Profile</dt>
              <dd className="font-medium">{data.profile}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">{new Date(data.created_at).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last Updated</dt>
              <dd className="font-medium">{new Date(data.updated_at).toLocaleDateString()}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {data.skills_offered && data.skills_offered.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Skills Offered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.skills_offered.map((skill: string) => (
                <Badge key={skill} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.skills_needed && data.skills_needed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Skills Needed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.skills_needed.map((skill: string) => (
                <Badge key={skill} variant="outline">{skill}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.interests && data.interests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.interests.map((interest: string) => (
                <Badge key={interest} variant="secondary">{interest}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {onboarding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Onboarding Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {onboardingProgress !== null && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{onboardingProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${onboardingProgress}%` }}
                  />
                </div>
              </div>
            )}
            {onboarding.sections?.map((section: any) => (
              <div key={section.name} className="flex items-center justify-between border-b pb-2 last:border-0">
                <span className="text-sm">{section.name}</span>
                <Badge variant={section.completed ? 'default' : 'outline'}>
                  {section.completed ? 'Complete' : 'Pending'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
