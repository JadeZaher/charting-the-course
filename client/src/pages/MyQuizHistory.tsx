import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Clock, Calendar, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

interface ResultMetadata {
  totalQuestions?: number;
  answeredQuestions?: number;
  skippedQuestions?: number;
  correctCount?: number;
  incorrectCount?: number;
  gradableQuestions?: number;
  completionPercentage?: number;
  correctnessPercentage?: number;
  isAssessment?: boolean;
}

interface QuizResult {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number | null;
  is_passed: boolean | null;
  time_spent: number | null;
  result_metadata?: ResultMetadata;
  completed_at: string;
  quiz?: {
    title: string;
    description: string | null;
  } | null;
}

export default function MyQuizHistory() {
  const [, setLocation] = useLocation();
  const { user } = useSupabaseAuth();
  const [showAll, setShowAll] = useState(false);

  const { data: quizResults = [], isLoading } = useQuery<QuizResult[]>({
    queryKey: ['my-quiz-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('quiz_results')
        .select(`
          id,
          quiz_id,
          user_id,
          score,
          is_passed,
          time_spent,
          result_metadata,
          completed_at,
          quizzes (title, description)
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        id: item.id,
        quiz_id: item.quiz_id,
        user_id: item.user_id,
        score: item.score,
        is_passed: item.is_passed,
        time_spent: item.time_spent,
        result_metadata: item.result_metadata,
        completed_at: item.completed_at,
        quiz: item.quizzes,
      }));
    },
    enabled: !!user?.id,
  });

  const displayedResults = showAll ? quizResults : quizResults.slice(0, 20);
  const hasMore = quizResults.length > 20 && !showAll;

  const formatTimeSpent = (seconds: number | null) => {
    if (!seconds) return "-";
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Please log in to view your quiz history</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setLocation("/profile")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            My Quiz History
          </h1>
          <p className="text-muted-foreground mt-1">
            All your completed quizzes and assessments
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span>Completed Quizzes</span>
            {quizResults && quizResults.length > 0 && (
              <Badge variant="secondary">{quizResults.length} total</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Click on any quiz to view your detailed results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading your quiz history...</p>
          ) : displayedResults && displayedResults.length > 0 ? (
            <div className="space-y-3">
              {displayedResults.map((result) => (
                <Link key={result.id} href={`/quiz/results/${result.quiz_id}`}>
                  <div
                    className="flex items-center justify-between p-4 rounded-lg border hover-elevate active-elevate-2 cursor-pointer"
                    data-testid={`quiz-result-${result.id}`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {result.quiz?.title || "Quiz"}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(result.completed_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeSpent(result.time_spent)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {result.score !== null && (
                        result.is_passed !== null ? (
                          // Graded quiz - show score with pass/fail, and completion if available
                          <div className="flex items-center gap-2">
                            <Badge variant={result.is_passed ? "default" : "destructive"}>
                              {result.result_metadata?.correctCount !== undefined && result.result_metadata?.gradableQuestions
                                ? `${result.result_metadata.correctCount}/${result.result_metadata.gradableQuestions}`
                                : `${result.score}%`
                              }
                            </Badge>
                            {result.result_metadata?.completionPercentage !== undefined && 
                             result.result_metadata?.totalQuestions !== undefined &&
                             result.result_metadata.totalQuestions > 0 &&
                             result.result_metadata.completionPercentage < 100 && (
                              <Badge variant="outline" className="text-muted-foreground">
                                {result.result_metadata.completionPercentage}% done
                              </Badge>
                            )}
                          </div>
                        ) : (
                          // Assessment - show completion with counts if available
                          <Badge variant="secondary">
                            {result.result_metadata?.totalQuestions !== undefined && result.result_metadata.totalQuestions > 0
                              ? `${result.result_metadata.answeredQuestions ?? 0}/${result.result_metadata.totalQuestions}`
                              : `${result.score}%`
                            } completed
                          </Badge>
                        )
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
              
              {hasMore && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => setShowAll(true)}
                  data-testid="button-show-all"
                >
                  Show All ({quizResults?.length} results)
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <div className="p-4 rounded-full bg-muted inline-block">
                <CheckCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  No completed quizzes yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Start taking quizzes to build your profile!
                </p>
              </div>
              <Button onClick={() => setLocation("/quizzes")} data-testid="button-browse-quizzes">
                Browse Quizzes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
