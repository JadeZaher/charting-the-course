import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useEcosystem } from "@/contexts/EcosystemContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useDashboardSummary } from "@/hooks/use-api";
import { useProposals } from "@/hooks/use-governance";
import { useQuery } from "@tanstack/react-query";
import { fetchEcosystemSharesNeeds, fetchEcosystemQuizzes } from "@/lib/api-client";
import {
  FileText,
  Vote,
  Users,
  Scale,
  AlertTriangle,
  Plus,
  ArrowRight,
  Compass,
  User,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  Building2,
  ArrowUpCircle,
  ArrowDownCircle,
  BookOpen,
} from "lucide-react";

export default function Dashboard() {
  const { member } = useAuth();
  const { selected, selectedIds, ecosystems: ecoList, isAll, isMulti } = useEcosystem();
  const { canManageContent } = usePermissions();

  const displayName = member?.display_name || "User";

  // Fetch proposals needing attention
  const { data: adviceProposals } = useProposals({ status: "advice" });
  const { data: consentProposals } = useProposals({ status: "consent" });
  const { data: summary } = useDashboardSummary();

  // Ecosystem-scoped shares/needs and quizzes
  const { data: sharesNeedsData } = useQuery({
    queryKey: ['ecosystem-shares-needs', selected?.id],
    queryFn: () => fetchEcosystemSharesNeeds(selected!.id),
    enabled: !!selected?.id,
  });
  const { data: quizzesData } = useQuery({
    queryKey: ['ecosystem-quizzes', selected?.id],
    queryFn: () => fetchEcosystemQuizzes(selected!.id),
    enabled: !!selected?.id,
  });

  const snItems = sharesNeedsData?.items ?? [];
  const sharesCount = snItems.filter((i: any) => i.type === 'share').length;
  const needsCount = snItems.filter((i: any) => i.type === 'need').length;
  const quizzesList = quizzesData?.quizzes ?? [];

  // Combine pending governance actions (proposals are paginated)
  const pendingActions = [
    ...(adviceProposals?.items || []).map((p: any) => ({ ...p, phase: "Advice" })),
    ...(consentProposals?.items || []).map((p: any) => ({ ...p, phase: "Consent" })),
  ];

  // Stat cards from summary data
  const statCards = summary?.cards || [];

  const statIconMap: Record<string, React.ElementType> = {
    Agreements: FileText,
    Proposals: Vote,
    Members: Users,
    Domains: Building2,
    Decisions: Scale,
  };

  const quickActions = [
    { label: "New Proposal", href: "/proposals/new", icon: Plus },
    { label: "View Agreements", href: "/agreements", icon: FileText },
    { label: "Explore Ecosystems", href: "/discover/hub", icon: Compass },
    { label: "My Profile", href: "/profile", icon: User },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Welcome back, {displayName}</h1>
        {selectedIds.length > 0 && (
          <Badge variant="secondary" className="text-sm">
            <Building2 className="h-3 w-3 mr-1" />
            {isAll
              ? 'All Ecosystems'
              : isMulti
                ? `${selectedIds.length} ecosystems`
                : selected?.name}
          </Badge>
        )}
      </div>

      {/* Action Queue */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h2 className="text-xl font-semibold">Needs Your Attention</h2>
          {pendingActions.length > 0 && (
            <Badge variant="destructive" className="ml-1">
              {pendingActions.length}
            </Badge>
          )}
        </div>

        {pendingActions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
              <p className="text-lg font-medium">You're all caught up!</p>
              <p className="text-sm text-muted-foreground">
                No pending governance actions.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingActions.map((action: any) => (
              <Link key={action.id} href={`/proposals/${action.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base line-clamp-2">
                        {action.title}
                      </CardTitle>
                      <Badge
                        variant={action.phase === "Consent" ? "destructive" : "default"}
                        className="ml-2 flex-shrink-0"
                      >
                        {action.phase}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {action.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Due {new Date(action.deadline).toLocaleDateString()}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <ArrowRight className="h-3.5 w-3.5" />
                        Review &amp; respond
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Governance Pulse */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Governance Pulse</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((card: any) => {
            const Icon = statIconMap[card.label] || Scale;
            return (
              <Link key={card.label} href={card.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-1">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {card.label}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                    {card.breakdown && Object.keys(card.breakdown).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {Object.entries(card.breakdown).map(([status, count]) => (
                          <Badge key={status} variant="secondary" className="text-xs px-1.5">
                            {status}: {String(count)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Ecosystem Activity: Shares/Needs + Quizzes */}
      {selected && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Ecosystem Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Shares & Needs card */}
            <Link href="/discover/hub">
              <Card className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Shares & Needs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <ArrowUpCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="text-2xl font-bold">{sharesCount}</div>
                        <div className="text-xs text-muted-foreground">Shares</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowDownCircle className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="text-2xl font-bold">{needsCount}</div>
                        <div className="text-xs text-muted-foreground">Needs</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    View all <ArrowRight className="h-3 w-3" />
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Quizzes card */}
            <Link href="/quizzes">
              <Card className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Quizzes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-2xl font-bold">{quizzesList.length}</div>
                      <div className="text-xs text-muted-foreground">
                        {quizzesList.length === 1 ? 'quiz' : 'quizzes'} in this ecosystem
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    View all <ArrowRight className="h-3 w-3" />
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Button variant="outline" className="rounded-full gap-2">
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            </Link>
          ))}
        </div>
      </section>

      {/* Orientation CTA */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Continue Your Orientation Journey</CardTitle>
              <CardDescription>
                Explore ecosystems, take quizzes, and deepen your governance practice.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Link href="/discover">
            <Button className="gap-2">
              Continue Orientation
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
