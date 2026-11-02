import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Download, ArrowLeft, Clock, Calendar, User } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { keys } from '@/lib/query-keys';
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { fetchOwnQuizResult } from "@/lib/api-client";
import { quizAnswerText, type QuizChoice } from '@/lib/quiz-answer';
import { joinReturnPath } from '@/lib/join-gates';

interface ExtractedQuestion {
  name: string;
  title: string;
  type: string;
  choices?: QuizChoice[];
  profileDimension?: string;
  tagKey?: string;
}

export default function QuizResults() {
  const [, params] = useRoute("/quiz/results/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const resultId = params?.id;
  const returnTo = joinReturnPath(window.location.search);

  const { data: result, isLoading, error } = useQuery({
    queryKey: keys.quizzes.ownResult(user?.id, resultId),
    queryFn: () => fetchOwnQuizResult(resultId!),
    enabled: !!resultId && !!user?.id,
    retry: false,
  });
  const quiz = result?.quiz;

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

  if (error || !result || !quiz) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Quiz result not found</p>
            <Button
              className="mt-4"
              onClick={() => setLocation(returnTo || '/me')}
              data-testid="button-back-to-profile"
            >
              Back to where I started
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
  const judgments = new Map<string, boolean>((Array.isArray(result.result_metadata?.perQuestion) ? result.result_metadata.perQuestion : [])
    .filter((entry: any) => typeof entry.name === 'string' && typeof entry.isCorrect === 'boolean')
    .map((entry: any): [string, boolean] => [entry.name, entry.isCorrect]));

  const pages = [{ elements: surveyDef?.elements }, ...(Array.isArray(surveyDef?.pages) ? surveyDef.pages : [])];
  {
    for (const page of pages) {
      if (page.elements && Array.isArray(page.elements)) {
        for (const element of page.elements) {
          const question: ExtractedQuestion = {
            name: element.name,
            title: element.title || element.name,
            type: element.type,
            choices: element.choices,
            profileDimension: element.profileDimension,
            tagKey: element.tagKey,
          };
          allQuestions.push(question);
          if (judgments.has(element.name)) {
            gradableQuestions.push(question);
          }
        }
      }
    }
  }

  const isGradedQuiz = result.is_passed !== null || gradableQuestions.length > 0;
  const scorePercentage = result.score || 0;
  const isPassing = result.is_passed;
  const timeSpentMinutes = result.time_spent
    ? Math.round(result.time_spent / 60)
    : 0;

  const surveyResults = result.survey_results as Record<string, any>;

  const formatAnswer = (answer: unknown, question: ExtractedQuestion): string => quizAnswerText(answer,question.choices);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <section className="space-y-3 border border-border p-4"><p>{isGradedQuiz ? 'Your result is graded and saved by the server.' : 'Your responses are saved by the server. This questionnaire records completion; your preferences are not marked right or wrong.'} Returning does not join a group automatically; its requirements are checked again.</p><Button onClick={() => setLocation(returnTo)}>{result.is_passed === false ? 'Return to requirements' : 'Continue where I started'}</Button>{result.is_passed === false && <Button variant="outline" onClick={() => setLocation(`/quiz/take/${result.quiz_id}?returnTo=${encodeURIComponent(returnTo)}`)}>Try this quiz again</Button>}</section>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.length > 1 ? window.history.back() : setLocation("/profile")}
          data-testid="button-back"
          aria-label="Back to previous page"
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
                  <div className="flex h-32 w-32 items-center justify-center border-8 border-strong-border bg-muted/25">
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
                <Progress value={scorePercentage} aria-label="Quiz score" />

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
                    <Progress value={result.result_metadata.completionPercentage ?? 0} aria-label="Questions answered" className="h-2" />
                  </>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-muted-foreground">Time Spent</span>
                  <span className="font-semibold">{timeSpentMinutes} minutes</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-semibold">
                    {result.completed_at ? new Date(result.completed_at).toLocaleDateString() : 'Unknown date'}
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
                <div className="border border-primary bg-primary/10 p-3">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {result.result_metadata?.totalQuestions !== undefined && result.result_metadata.totalQuestions > 0
                      ? `${result.result_metadata.answeredQuestions ?? 0}/${result.result_metadata.totalQuestions}`
                      : 'Responses saved'
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {result.result_metadata?.totalQuestions !== undefined && result.result_metadata.totalQuestions > 0
                      ? 'Questions answered'
                      : "Completed"
                    }
                  </p>
                </div>
              </div>
              {result.result_metadata?.skippedQuestions !== undefined && result.result_metadata.skippedQuestions > 0 && result.result_metadata.totalQuestions !== undefined && (
                <div className="flex items-center gap-3">
                  <div className="border border-strong-border bg-muted p-3">
                    <XCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{result.result_metadata.skippedQuestions}</p>
                    <p className="text-sm text-muted-foreground">Skipped</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="border border-primary bg-primary/10 p-3">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{timeSpentMinutes}</p>
                  <p className="text-sm text-muted-foreground">Minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="border border-primary bg-primary/10 p-3">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{result.completed_at ? new Date(result.completed_at).toLocaleDateString() : 'Unknown date'}</p>
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
              ? "Your recorded answers. Passing and scores above come from server grading; the answer key stays private."
              : "A summary of your responses to this assessment"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isGradedQuiz && gradableQuestions.length > 0 ? (
            gradableQuestions.map((q, index) => {
              const userAnswer = surveyResults?.[q.name];
              const isCorrect = judgments.get(q.name) === true;

              return (
                <div
                  key={q.name}
                  className="space-y-3 border border-strong-border p-5"
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
                    className="border border-strong-border p-5"
                    data-testid={`response-${index}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center border border-primary bg-primary/10 text-sm font-medium text-primary">
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
          disabled={result.attempt_policy?.can_submit === false}
          onClick={() => setLocation(`/quiz/take/${quiz.id}?returnTo=${encodeURIComponent(returnTo)}`)}
          data-testid="button-retake"
        >
          {result.attempt_policy?.result_is_current === false ? 'Take current version' : isGradedQuiz ? "Retake Quiz" : "Take Again"}
        </Button>
        <Button
          onClick={() => setLocation("/onboarding")}
          data-testid="button-browse-quizzes"
        >
          Start Onboarding
        </Button>
      </div>
      {result.attempt_policy?.can_submit === false && <p className="text-center text-sm text-muted-foreground">This version allows one verified attempt. Ask a steward for help; a changed version permits a new attempt.</p>}
    </div>
  );
}
