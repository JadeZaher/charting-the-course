import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  ArrowRight,
  BookOpen,
  UserPlus,
  ShieldCheck,
  Clock,
  Globe2,
  Building2,
  FileEdit,
  History,
  ClipboardList,
} from "lucide-react";
import { fetchQuizzes, fetchOnboardings } from "@/lib/api-client";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  visibility: string;
  is_published: boolean;
  is_entry_quiz: boolean;
  time_limit: number | null;
  ecosystem_id: string | null;
  domain_id: string | null;
  created_at: string;
}

interface OnboardingItem {
  member_id: string;
  member_name?: string;
  display_name?: string;
  status: string;
  current_step?: string;
  completed_at?: string;
}

export default function QuizzesOnboardingHub() {
  const [searchQuery, setSearchQuery] = useState("");
  const { canManageContent } = usePermissions();
  const { member } = useAuth();

  const { data: quizzes, isLoading: quizzesLoading } = useQuery<Quiz[]>({
    queryKey: ["quizzes-hub", canManageContent],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (!canManageContent) params.is_published = "true";
      const result = await fetchQuizzes(params);
      const items = (result as any).items || (result as any).quizzes || [];
      return items.map((q: any) => ({
        id: q.id,
        title: q.title,
        description: q.description ?? null,
        visibility: q.visibility ?? "public",
        is_published: q.is_published ?? false,
        is_entry_quiz: q.is_entry_quiz ?? false,
        time_limit: q.time_limit ?? null,
        ecosystem_id: q.ecosystem_id ?? null,
        domain_id: q.domain_id ?? null,
        created_at: q.created_at,
      }));
    },
  });

  const { data: onboardings, isLoading: onboardingLoading } = useQuery<OnboardingItem[]>({
    queryKey: ["onboarding-hub"],
    queryFn: async () => {
      const result = await fetchOnboardings();
      return (result.items ?? []).map((o: any) => ({
        member_id: o.member_id,
        member_name: o.member_name || o.display_name || o.member_id,
        display_name: o.display_name,
        status: o.status ?? "pending",
        current_step: o.current_step,
        completed_at: o.completed_at,
      }));
    },
  });

  const entryQuizzes = quizzes?.filter((q) => q.is_entry_quiz) ?? [];
  const regularQuizzes = quizzes?.filter((q) => !q.is_entry_quiz) ?? [];

  const filteredRegular = regularQuizzes.filter(
    (q) =>
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColor = (status: string) => {
    switch (status) {
      case "completed": return "default" as const;
      case "in_progress": return "secondary" as const;
      default: return "outline" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quizzes & Onboarding</h1>
          <p className="text-muted-foreground mt-1">
            Take quizzes, track onboarding progress, and manage learning paths
          </p>
        </div>
        <div className="flex gap-2">
          {canManageContent && (
            <Link href="/quiz/manage">
              <Button variant="outline" size="sm">
                <FileEdit className="h-4 w-4 mr-2" />
                Manage Quizzes
              </Button>
            </Link>
          )}
          <Link href="/my-quiz-history">
            <Button variant="outline" size="sm">
              <History className="h-4 w-4 mr-2" />
              My History
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="quizzes" className="w-full">
        <TabsList>
          <TabsTrigger value="quizzes" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Quizzes
          </TabsTrigger>
          <TabsTrigger value="entry" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Entry Quizzes
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Onboarding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quizzes" className="space-y-4 mt-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quizzes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid gap-4">
            {quizzesLoading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Loading quizzes...</p>
                </CardContent>
              </Card>
            ) : filteredRegular.length > 0 ? (
              filteredRegular.map((quiz) => (
                <Card key={quiz.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle>{quiz.title}</CardTitle>
                        <CardDescription>{quiz.description}</CardDescription>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary">{quiz.visibility}</Badge>
                          {!quiz.is_published && <Badge variant="outline">Draft</Badge>}
                          {quiz.time_limit && (
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              {quiz.time_limit} min
                            </Badge>
                          )}
                          {quiz.ecosystem_id && (
                            <Badge variant="outline" className="text-xs">
                              <Globe2 className="h-3 w-3 mr-1" />
                              Ecosystem
                            </Badge>
                          )}
                          {quiz.domain_id && (
                            <Badge variant="outline" className="text-xs">
                              <Building2 className="h-3 w-3 mr-1" />
                              Domain
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Link href={`/quiz/take/${quiz.id}`}>
                        <Button>
                          Take Quiz
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    {searchQuery ? "No quizzes match your search" : "No quizzes available yet."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="entry" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Entry quizzes are required to join or participate in specific ecosystems or domains.
          </p>
          <div className="grid gap-4">
            {quizzesLoading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Loading entry quizzes...</p>
                </CardContent>
              </Card>
            ) : entryQuizzes.length > 0 ? (
              entryQuizzes.map((quiz) => (
                <Card key={quiz.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-primary" />
                          {quiz.title}
                        </CardTitle>
                        <CardDescription>{quiz.description}</CardDescription>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {quiz.ecosystem_id && (
                            <Badge variant="outline" className="text-xs">
                              <Globe2 className="h-3 w-3 mr-1" />
                              Ecosystem
                            </Badge>
                          )}
                          {quiz.domain_id && (
                            <Badge variant="outline" className="text-xs">
                              <Building2 className="h-3 w-3 mr-1" />
                              Domain
                            </Badge>
                          )}
                          {quiz.time_limit && (
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              {quiz.time_limit} min
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Link href={`/quiz/take/${quiz.id}`}>
                        <Button>
                          Take Quiz
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No entry quizzes available.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Track onboarding ceremonies and member orientation progress.
            </p>
            <Link href="/onboarding">
              <Button variant="outline" size="sm">
                <ClipboardList className="h-4 w-4 mr-2" />
                Full Onboarding List
              </Button>
            </Link>
          </div>

          <div className="grid gap-4">
            {onboardingLoading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Loading onboarding data...</p>
                </CardContent>
              </Card>
            ) : onboardings && onboardings.length > 0 ? (
              onboardings.slice(0, 10).map((o) => (
                <Card key={o.member_id}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {o.display_name || o.member_name}
                        </CardTitle>
                        {o.current_step && (
                          <CardDescription className="text-xs">
                            Current step: {o.current_step}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusColor(o.status)}>{o.status}</Badge>
                        <Link href={`/onboarding/${o.member_id}/ceremony`}>
                          <Button variant="outline" size="sm">
                            View
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No onboarding processes found.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
