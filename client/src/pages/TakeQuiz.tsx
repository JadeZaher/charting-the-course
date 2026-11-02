import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuiz, useSubmitQuizResult } from "@/hooks/use-courses";
import { cn } from "@/lib/utils";
import { apiErrorMessage } from "@/lib/api-error-message";
import { quizElements,quizAnswerErrors } from '@/lib/quiz-answer';
import { QuizAnswerField } from '@/components/QuizAnswerField';
import { joinReturnPath } from '@/lib/join-gates';

export default function TakeQuiz() {
  const [, params] = useRoute("/quiz/take/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { member, refreshSession } = useAuth();
  const returnTo = joinReturnPath(window.location.search);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [startTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [validation,setValidation]=useState('');

  const quizId = params?.id;
  const { data: quizData, isLoading, error } = useQuiz(quizId || "");
  const submitResultMutation = useSubmitQuizResult(quizId || "");

  const quiz = quizData
    ? {
        id: (quizData as any).id,
        title: (quizData as any).title,
        description: (quizData as any).description ?? null,
        survey_json: (quizData as any).survey_json ?? (quizData as any).config ?? null,
        time_limit: (quizData as any).time_limit ?? null,
        passing_score: (quizData as any).passing_score ?? null,
      }
    : null;

  const elements = quizData ? quizElements(quizData) : [];

  function setAnswer(name: string, value: any) {
    setAnswers((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!member?.id || !quizId || !quiz) return;

    const errors=quizAnswerErrors(elements,answers);
    if(errors.length){setValidation(errors.join(' '));return;}
    setValidation('');
    setSubmitting(true);
    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const response = await submitResultMutation.mutateAsync({
        survey_results: answers,
        time_spent: timeSpent || undefined,
      });

      const result = (response as any).result ?? response;
      const grading = (response as any).grading;
      const tilesCreated = (response as any).tiles_created || 0;
      const resultId = result?.id;

      let title = "Quiz Submitted!";
      let description = "Your answers have been saved successfully";
      let variant: "default" | "destructive" | undefined;

      if (grading && grading.is_passed !== null && grading.is_passed !== undefined) {
        const meta = grading.result_metadata || {};
        const scoreText = meta.correctCount !== undefined && meta.gradableQuestions
          ? `${meta.correctCount}/${meta.gradableQuestions} correct (${grading.score}%)`
          : `${grading.score}%`;

        if (grading.is_passed) {
          title = "Passed!";
          description = `You scored ${scoreText}. Great work!`;
        } else {
          title = "Not Passed";
          description = `You scored ${scoreText}. Review your results to see what to improve.`;
          variant = "destructive";
        }
      }

      if (tilesCreated > 0) {
        description += ` \u2022 ${tilesCreated} profile insight${tilesCreated > 1 ? "s" : ""} added!`;
      }

      toast({ title, description, variant });
      await refreshSession();
      setLocation(`${resultId ? `/quiz/results/${resultId}` : `/quiz/results/${quizId}`}?returnTo=${encodeURIComponent(returnTo)}`);
    } catch {
      // useSubmitQuizResult already toasted the failure; stay on the quiz so answers are kept.
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Loading quiz...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <p className="text-destructive">
              {error ? apiErrorMessage(error) : "Quiz not found"}
            </p>
            <Button onClick={() => setLocation(returnTo)} data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to where you started
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setLocation(returnTo)}
          aria-label="Return to where you started"
          data-testid="button-back-to-list"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-quiz-title">
            {quiz.title}
          </h1>
          {quiz.description && (
            <p className="text-muted-foreground mt-1">{quiz.description}</p>
          )}
        </div>
      </div>

      {validation&&<p role="alert" className="text-destructive">{validation}</p>}
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {elements.map((el, idx) => (
            <Card key={el.name}>
              <CardContent className="p-6">
                <p className="font-medium mb-4">
                  {idx + 1}. {el.title}
                </p>
                <QuizAnswerField element={el} value={answers[el.name]} onChange={(v) => setAnswer(el.name, v)} />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" size="lg" disabled={submitting || elements.length===0}>
            {submitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        </div>
      </form>
    </div>
  );
}
