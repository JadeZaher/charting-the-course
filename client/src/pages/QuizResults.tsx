import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Download, ArrowLeft, Clock, Calendar, User } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { fetchQuiz, fetchMemberQuizHistory } from "@/lib/api-client";

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
  survey_results: any;
  result_metadata?: ResultMetadata;
  completed_at: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  survey_json: any;
}

interface ExtractedQuestion {
  name: string;
  title: string;
  type: string;
  correctAnswer?: any;
  choices?: Array<{ value: string; text: string }>;
  profileDimension?: string;
  tagKey?: string;
}

export default function QuizResults() {
  const [, params] = useRoute("/quiz/results/:id");
  const [, setLocation] = useLocation();
  const { member } = useAuth();
  const resultId = params?.id;

  // Fetch quiz history to find the specific result by ID or quiz ID
  const { data: historyData, isLoading: resultLoading } = useQuery<QuizResult | null>({
    queryKey: ['quiz-result', resultId, member?.id],
    queryFn: async () => {
      if (!member?.id || !resultId) return null;

      // Fetch member quiz history and find the matching result
      const historyResult = await fetchMemberQuizHistory(member.id);
      const results: QuizResult[] = ((historyResult as any).results || []).map((r: any) => ({
        id: r.id,
        quiz_id: r.quiz_id,
        user_id: r.member_id || member.id,
        score: r.score ?? null,
        is_passed: r.is_passed ?? null,
        time_spent: r.time_spent ?? null,
        survey_results: r.survey_results ?? r.answers ?? {},
        result_metadata: r.result_metadata ?? null,
        completed_at: r.completed_at,
      }));

      // Try to find by result ID first, then by quiz ID (backwards compat)
      return results.find(r => r.id === resultId)
        ?? results.filter(r => r.quiz_id === resultId).sort(
          (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
        )[0]
        ?? null;
    },
    enabled: !!resultId && !!member?.id,
  });

  const result = historyData;

  const { data: quiz, isLoading: quizLoading } = useQuery<Quiz | null>({
    queryKey: ['quiz', result?.quiz_id],
    queryFn: async () => {
      if (!result?.quiz_id) return null;
      const data = await fetchQuiz(result.quiz_id);
      return {
        id: (data as any).id,
        title: (data as any).title,
        description: (data as any).description ?? null,
        survey_json: (data as any).survey_json ?? (data as any).config ?? null,
      };
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
  const allQuestions: ExtractedQuestion[] = [];
  const gradableQuestions: ExtractedQuestion[] = [];
  
  if (surveyDef?.pages && Array.isArray(surveyDef.pages)) {
    for (const page of surveyDef.pages) {
      if (page.elements && Array.isArray(page.elements)) {
        for (const element of page.elements) {
          const question: ExtractedQuestion = {
            name: element.name,
            title: element.title || element.name,
            type: element.type,
            correctAnswer: element.correctAnswer,
            choices: element.choices,
            profileDimension: element.profileDimension,
            tagKey: element.tagKey,
          };
          allQuestions.push(question);
          if (element.correctAnswer !== undefined) {
            gradableQuestions.push(question);
          }
        }
      }
    }
  }

  const isGradedQuiz = gradableQuestions.length > 0;
  const scorePercentage = result.score || 0;
  const isPassing = result.is_passed;
  const timeSpentMinutes = result.time_spent 
    ? Math.round(result.time_spent / 60)
    : 0;

  const surveyResults = result.survey_results as Record<string, any>;

  const formatAnswer = (answer: any, question: ExtractedQuestion): string => {
    if (answer === undefined || answer === null) return "Not answered";
    
    if (Array.isArray(answer)) {
      return answer.map(a => {
        if (question.choices) {
          const choice = question.choices.find(c => c.value === a);
          return choice?.text || a;
        }
        return String(a);
      }).join(", ");
    }
    
    if (question.choices) {
      const choice = question.choices.find(c => c.value === answer);
      return choice?.text || String(answer);
    }
    
    return String(answer);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => window.history.length > 1 ? window.history.back() : setLocation("/profile")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold" data-testid="text-results-title">
            {isGradedQuiz ? "Quiz Results" : "Assessment Summary"}
          </h1>
          <p className="text-muted-foreground mt-1">{quiz.title}</p>
        </div>
        <Button variant="outline" onClick={handleExport} data-testid="button-export">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {isGradedQuiz ? (
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
                    {result.result_metadata?.correctCount !== undefined && result.result_metadata?.gradableQuestions
                      ? `${result.result_metadata.correctCount}/${result.result_metadata.gradableQuestions} (${scorePercentage}%)`
                      : `${scorePercentage}%`
                    }
                  </span>
                </div>
                <Progress value={scorePercentage} />
                
                {result.result_metadata?.totalQuestions !== undefined && result.result_metadata.totalQuestions > 0 && (
                  <>
                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="text-muted-foreground">Questions Answered</span>
                      <span className="font-semibold">
                        {result.result_metadata.answeredQuestions ?? 0}/{result.result_metadata.totalQuestions}
                        {result.result_metadata.skippedQuestions !== undefined && result.result_metadata.skippedQuestions > 0 && (
                          <span className="text-muted-foreground ml-1">
                            ({result.result_metadata.skippedQuestions} skipped)
                          </span>
                        )}
                      </span>
                    </div>
                    <Progress value={result.result_metadata.completionPercentage ?? 0} className="h-2" />
                  </>
                )}
                
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
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {result.result_metadata?.totalQuestions !== undefined && result.result_metadata.totalQuestions > 0
                      ? `${result.result_metadata.answeredQuestions ?? 0}/${result.result_metadata.totalQuestions}`
                      : `${scorePercentage}%`
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {result.result_metadata?.totalQuestions !== undefined && result.result_metadata.totalQuestions > 0
                      ? `Questions (${scorePercentage}%)`
                      : "Completed"
                    }
                  </p>
                </div>
              </div>
              {result.result_metadata?.skippedQuestions !== undefined && result.result_metadata.skippedQuestions > 0 && result.result_metadata.totalQuestions !== undefined && (
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-muted">
                    <XCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{result.result_metadata.skippedQuestions}</p>
                    <p className="text-sm text-muted-foreground">Skipped</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{timeSpentMinutes}</p>
                  <p className="text-sm text-muted-foreground">Minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{new Date(result.completed_at).toLocaleDateString()}</p>
                  <p className="text-sm text-muted-foreground">Date</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Responses</CardTitle>
          <CardDescription>
            {isGradedQuiz 
              ? "Review your answers and see which ones were correct"
              : "A summary of your responses to this assessment"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isGradedQuiz ? (
            gradableQuestions.map((q, index) => {
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
                        Question {index + 1}: {q.title}
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Your answer:</span>
                          <span
                            className={isCorrect ? "text-chart-3 font-medium" : "text-destructive font-medium"}
                          >
                            {formatAnswer(userAnswer, q)}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Correct answer:</span>
                            <span className="text-chart-3 font-medium">{formatAnswer(correctAnswer, q)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            allQuestions.length > 0 ? (
              allQuestions.map((q, index) => {
                const userAnswer = surveyResults?.[q.name];
                
                return (
                  <div
                    key={q.name}
                    className="p-4 rounded-lg border"
                    data-testid={`response-${index}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="font-medium">{q.title}</p>
                        <div className="flex items-start gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="text-foreground">
                            {formatAnswer(userAnswer, q)}
                          </span>
                        </div>
                        {q.profileDimension && (
                          <Badge variant="outline" className="text-xs">
                            {q.profileDimension}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No responses recorded for this assessment
              </p>
            )
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-center">
        <Button 
          variant="outline" 
          onClick={() => setLocation(`/quiz/take/${quiz.id}`)}
          data-testid="button-retake"
        >
          {isGradedQuiz ? "Retake Quiz" : "Take Again"}
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
