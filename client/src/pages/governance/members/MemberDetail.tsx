import { Link, useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useQuery } from '@tanstack/react-query';
import { fetchMemberProfile } from '@/lib/api-client';
import { Pencil, ArrowLeft, CheckCircle, Clock, AlertCircle, BookOpen, Award, Tag, User, Shield } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toStringList } from '@/lib/utils';

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

  const { data, isLoading, error } = useQuery({
    queryKey: ['member-profile', id],
    queryFn: () => fetchMemberProfile(id),
    enabled: !!id,
  });

  if (isLoading) return <LoadingState message="Loading member profile..." />;

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load member</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message || 'Not found'}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/members">Back to Members</Link>
        </Button>
      </div>
    );
  }

  const quiz = data.quiz_summary;
  const completionPct = quiz.total_available > 0 ? Math.round((quiz.completed / quiz.total_available) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/members">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Members
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{data.display_name}</h1>
          {data.user_display_name && data.user_display_name !== data.display_name && (
            <p className="text-sm text-muted-foreground">Platform name: {data.user_display_name}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(data.current_status)}>{data.current_status}</Badge>
            {data.profile && <Badge variant="outline">{data.profile}</Badge>}
            <span className="text-sm text-muted-foreground">{data.member_id}</span>
            {data.username && <span className="text-sm text-muted-foreground">@{data.username}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/members/${id}/edit`}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-medium">{data.phone || '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Profile Type</dt>
              <dd className="font-medium">{data.profile || '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">KYC Status</dt>
              <dd className="font-medium">{data.kyc_status || '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Onboarding</dt>
              <dd className="font-medium">{data.onboarding_status || '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">{new Date(data.created_at).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last Updated</dt>
              <dd className="font-medium">{new Date(data.updated_at).toLocaleDateString()}</dd>
            </div>
            {data.last_governance_activity_date && (
              <div>
                <dt className="text-muted-foreground">Last Governance Activity</dt>
                <dd className="font-medium">{new Date(data.last_governance_activity_date).toLocaleDateString()}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Quiz Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Quiz Progress
          </CardTitle>
          <CardDescription>
            {quiz.completed} of {quiz.total_available} quizzes completed ({quiz.passed} passed)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Completion</span>
              <span className="font-medium">{completionPct}%</span>
            </div>
            <Progress value={completionPct} className="h-2" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="border border-strong-border bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold">{quiz.total_available}</p>
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
            <div className="border border-success bg-success/10 p-4 text-center">
              <p className="text-2xl font-bold tabular-nums text-success">{quiz.passed}</p>
              <p className="text-xs text-muted-foreground">Passed</p>
            </div>
            <div className="border border-warning bg-warning/10 p-4 text-center">
              <p className="text-2xl font-bold tabular-nums text-warning">{quiz.in_progress}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
            <div className="border border-strong-border bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold">{quiz.not_started}</p>
              <p className="text-xs text-muted-foreground">Not Started</p>
            </div>
          </div>

          {quiz.quizzes.length > 0 && (
            <div className="space-y-2 mt-4">
              {quiz.quizzes.map((q) => (
                <div key={q.quiz_id} className="flex items-center justify-between border border-strong-border p-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {q.status === 'completed' ? (
                      q.is_passed ? (
                        <CheckCircle className="h-5 w-5 flex-shrink-0 text-success" />
                      ) : (
                        <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
                      )
                    ) : q.status === 'in_progress' ? (
                      <Clock className="h-5 w-5 flex-shrink-0 text-warning" />
                    ) : (
                      <BookOpen className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{q.quiz_title}</p>
                      {q.completed_at && (
                        <p className="text-xs text-muted-foreground">
                          Completed {new Date(q.completed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {q.score !== null && (
                      <Badge variant={q.is_passed ? 'default' : 'destructive'}>
                        {q.score}%
                      </Badge>
                    )}
                    {q.status === 'in_progress' && (
                      <Badge variant="secondary">In Progress</Badge>
                    )}
                    {q.status === 'not_started' && (
                      <Badge variant="outline">Not Started</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills & Interests */}
      {(() => {
        const skillsOffered = toStringList(data.skills_offered);
        const skillsNeeded = toStringList(data.skills_needed);
        const interests = toStringList(data.interests);
        if (!skillsOffered.length && !skillsNeeded.length && !interests.length) return null;
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {skillsOffered.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Skills Offered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {skillsOffered.map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {skillsNeeded.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Skills Needed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {skillsNeeded.map((skill) => (
                      <Badge key={skill} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {interests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Interests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest) => (
                      <Badge key={interest} variant="secondary">{interest}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      })()}

      {/* Badges */}
      {data.badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5" />
              Badges ({data.badges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.badges.map((badge) => (
                <div key={badge.id} className="flex items-center gap-3 border border-strong-border p-4">
                  {badge.badge_icon && <span className="text-2xl">{badge.badge_icon}</span>}
                  <div>
                    <p className="font-medium">{badge.badge_name}</p>
                    {badge.badge_description && (
                      <p className="text-xs text-muted-foreground">{badge.badge_description}</p>
                    )}
                    {badge.earned_at && (
                      <p className="text-xs text-muted-foreground">
                        Earned {new Date(badge.earned_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {data.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Profile Tags ({data.tags.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.tag_key}: {tag.tag_value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onboarding */}
      {data.onboarding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Onboarding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {data.onboarding.facilitator && (
                <div>
                  <dt className="text-muted-foreground">Facilitator</dt>
                  <dd className="font-medium">{data.onboarding.facilitator}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Completion</dt>
                <dd className="font-medium">{data.onboarding.completion_percentage}%</dd>
              </div>
              {data.onboarding.consent_date && (
                <div>
                  <dt className="text-muted-foreground">Consent Date</dt>
                  <dd className="font-medium">{new Date(data.onboarding.consent_date).toLocaleDateString()}</dd>
                </div>
              )}
              {data.onboarding.cooling_off_end && (
                <div>
                  <dt className="text-muted-foreground">Cooling Off Ends</dt>
                  <dd className="font-medium">{new Date(data.onboarding.cooling_off_end).toLocaleDateString()}</dd>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
