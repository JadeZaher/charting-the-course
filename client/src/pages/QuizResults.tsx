import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Download, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

interface QuizResult {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number | null;
  is_passed: boolean | null;
  time_spent: number | null;
  survey_results: any;
  completed_at: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  survey_json: any;
}

export default function QuizResults() {
  const [, params] = useRoute("/quiz/results/:quizId");
  const [, setLocation] = useLocation();
  const { user } = useSupabaseAuth();
  const quizId = params?.quizId;

  const { data: result, isLoading: resultLoading } = useQuery<QuizResult | null>({
    queryKey: ['quiz-result', quizId],
    queryFn: async () => {
      if (!user?.id || !quizId) return null;
      
      const { data, error } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!quizId && !!user?.id,
  });

  const { data: quiz, isLoading: quizLoading } = useQuery<Quiz | null>({
    queryKey: ['quiz', result?.quiz_id],
    queryFn: async () => {
      if (!result?.quiz_id) return null;
      
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title, description, survey_json')
        .eq('id', result.quiz_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!result?.quiz_id,
  });

  const isLoading = resultLoading || quizLoading;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Loading quiz results...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result || !quiz) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Quiz result not found</p>
            <Button 
              className="mt-4" 
              onClick={() => setLocation("/profile")}
              data-testid="button-back-to-profile"
            >
              Back to Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scorePercentage = result.score || 0;
  const isPassing = result.is_passed;

  const handleExport = () => {
    const data = JSON.stringify({
      quiz: quiz.title,
      score: result.score,
      isPassed: result.is_passed,
      completedAt: result.completed_at,
      timeSpent: result.time_spent,
      answers: result.survey_results,
    }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz-results-${quiz.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const surveyDef = quiz.survey_json as any;
  const questions: any[] = [];
  
  if (surveyDef?.pages && Array.isArray(surveyDef.pages)) {
    for (const page of surveyDef.pages) {
      if (page.elements && Array.isArray(page.elements)) {
        for (const element of page.elements) {
          if (element.correctAnswer !== undefined) {
            questions.push(element);
          }
        }
      }
    }
  }

  const timeSpentMinutes = result.time_spent 
    ? Math.round(result.time_spent / 60)
    : 0;

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
          <h1 className="text-3xl font-bold" data-testid="text-results-title">
            Quiz Results
          </h1>
          <p className="text-muted-foreground mt-1">{quiz.title}</p>
        </div>
        <Button variant="outline" onClick={handleExport} data-testid="button-export">
          <Download className="h-4 w-4 mr-2" />
          Export Results
        </Button>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="relative inline-flex">
                <div className="h-32 w-32 rounded-full border-8 border-muted flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold" data-testid="text-score">
                      {scorePercentage}%
                    </div>
                    <div className="text-sm text-muted-foreground">Score</div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Badge
                  variant={isPassing ? "default" : "destructive"}
                  className="text-base px-4 py-1"
                  data-testid="badge-pass-fail"
                >
                  {isPassing ? "Passed" : "Failed"}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Score</span>
                <span className="font-semibold" data-testid="text-score-value">
                  {scorePercentage}%
                </span>
              </div>
              <Progress value={scorePercentage} />
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-muted-foreground">Time Spent</span>
                <span className="font-semibold">{timeSpentMinutes} minutes</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-semibold">
                  {new Date(result.completed_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Answers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.length > 0 ? (
            questions.map((q, index) => {
              const surveyResults = result.survey_results as Record<string, any>;
              const userAnswer = surveyResults?.[q.name];
              const correctAnswer = q.correctAnswer;
              const isCorrect = String(userAnswer).trim().toLowerCase() === 
                              String(correctAnswer).trim().toLowerCase();

              return (
                <div
                  key={q.name}
                  className="p-4 rounded-lg border space-y-3"
                  data-testid={`question-result-${index}`}
                >
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-chart-3 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 space-y-2">
                      <p className="font-medium">
                        Question {index + 1}: {q.title || q.name}
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Your answer:</span>
                          <span
                            className={isCorrect ? "text-chart-3 font-medium" : "text-destructive font-medium"}
                          >
                            {String(userAnswer)}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Correct answer:</span>
                            <span className="text-chart-3 font-medium">{String(correctAnswer)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No gradable questions found in this quiz
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-center">
        <Button 
          variant="outline" 
          onClick={() => setLocation(`/quiz/take/${quiz.id}`)}
          data-testid="button-retake"
        >
          Retake Quiz
        </Button>
        <Button 
          onClick={() => setLocation("/quizzes")}
          data-testid="button-browse-quizzes"
        >
          Browse Quizzes
        </Button>
      </div>
    </div>
  );
}
