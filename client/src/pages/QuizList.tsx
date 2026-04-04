import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, ArrowRight } from "lucide-react";
import { fetchQuizzes } from "@/lib/api-client";
import { usePermissions } from "@/hooks/usePermissions";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  visibility: string;
  is_published: boolean;
  time_limit: number | null;
  created_at: string;
}

export default function QuizList() {
  const [searchQuery, setSearchQuery] = useState("");
  const { canManageContent } = usePermissions();

  const { data: quizzes, isLoading, error } = useQuery<Quiz[]>({
    queryKey: ['quizzes-list', canManageContent],
    queryFn: async () => {
      const params: Record<string, string> = {};
      // Regular users only see published public/assigned quizzes
      if (!canManageContent) {
        params.is_published = 'true';
        params.visibility = 'public,assigned';
      }
      const result = await fetchQuizzes(params);
      const items = (result as any).items || (result as any).quizzes || [];
      return items.map((q: any) => ({
        id: q.id,
        title: q.title,
        description: q.description ?? null,
        visibility: q.visibility ?? 'public',
        is_published: q.is_published ?? false,
        time_limit: q.time_limit ?? null,
        created_at: q.created_at,
      })) as Quiz[];
    },
  });

  const filteredQuizzes = quizzes?.filter((quiz) => {
    const matchesSearch =
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quizzes</h1>
          <p className="text-muted-foreground mt-1">
            Explore and complete available learning modules
          </p>
        </div>
      </div>

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search quizzes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-quizzes"
        />
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Loading quizzes...</p>
            </CardContent>
          </Card>
        ) : filteredQuizzes && filteredQuizzes.length > 0 ? (
          filteredQuizzes.map((quiz) => (
            <Card key={quiz.id} data-testid={`card-quiz-${quiz.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription>{quiz.description}</CardDescription>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">{quiz.visibility}</Badge>
                      {!quiz.is_published && (
                        <Badge variant="outline">Draft</Badge>
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
                    <Button data-testid={`button-take-${quiz.id}`}>
                      Take Quiz
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
            </Card>
          ))
        ) : error ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-destructive font-medium mb-2">Failed to load quizzes</p>
              <p className="text-muted-foreground text-sm">{(error as Error).message}</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No quizzes match your search"
                  : "No published quizzes available yet. Check back later or contact an admin."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
