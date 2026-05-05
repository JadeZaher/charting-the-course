import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
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

interface SurveyElement {
  type: string;
  name: string;
  title: string;
  choices?: string[];
  correctAnswer?: string;
  rateMin?: number;
  rateMax?: number;
  minRateDescription?: string;
  maxRateDescription?: string;
}

export default function TakeQuiz() {
  const [, params] = useRoute("/quiz/take/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { member } = useAuth();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [startTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);

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

  const elements: SurveyElement[] =
    quiz?.survey_json?.pages?.flatMap((p: any) => p.elements ?? []) ?? [];

  function setAnswer(name: string, value: any) {
    setAnswers((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!member?.id || !quizId || !quiz) return;

    setSubmitting(true);
    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const response = await submitResultMutation.mutateAsync({
        survey_results: answers,
        time_spent: timeSpent || undefined,
      });

      const result = (response as any).result ?? response;
      const tilesCreated = (response as any).tiles_created || 0;
      const resultId = result?.id;

      queryClient.invalidateQueries({ queryKey: ["my-quiz-results"] });
      queryClient.invalidateQueries({ queryKey: ["my-quiz-history"] });
      queryClient.invalidateQueries({ queryKey: ["profile-tiles"] });
      queryClient.invalidateQueries({ queryKey: ["my-profile-data"] });
      if (resultId) {
        queryClient.invalidateQueries({ queryKey: ["quiz-result", resultId] });
      }

      let description = "Your answers have been saved successfully";
      if (tilesCreated > 0) {
        description += ` \u2022 ${tilesCreated} profile insight${tilesCreated > 1 ? "s" : ""} added!`;
      }

      toast({ title: "Quiz Submitted!", description });
      setLocation(resultId ? `/quiz/results/${resultId}` : `/quiz/results/${quizId}`);
    } catch (err: any) {
      toast({
        title: "Submission Failed",
        description: err.message || "Failed to submit quiz",
        variant: "destructive",
      });
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
              {error ? (error as Error).message : "Quiz not found"}
            </p>
            <Button onClick={() => setLocation("/quizzes")} data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quizzes
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
          onClick={() => setLocation("/quizzes")}
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

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {elements.map((el, idx) => (
            <Card key={el.name}>
              <CardContent className="p-6">
                <p className="font-medium mb-4">
                  {idx + 1}. {el.title}
                </p>
                <QuestionField element={el} value={answers[el.name]} onChange={(v) => setAnswer(el.name, v)} />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function QuestionField({
  element,
  value,
  onChange,
}: {
  element: SurveyElement;
  value: any;
  onChange: (v: any) => void;
}) {
  switch (element.type) {
    case "radiogroup":
      return (
        <RadioGroup value={value ?? ""} onValueChange={onChange}>
          {element.choices?.map((choice) => (
            <div key={choice} className="flex items-center space-x-3 py-1">
              <RadioGroupItem value={choice} id={`${element.name}-${choice}`} />
              <Label htmlFor={`${element.name}-${choice}`} className="cursor-pointer font-normal">
                {choice}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );

    case "rating": {
      const min = element.rateMin ?? 1;
      const max = element.rateMax ?? 5;
      const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {element.minRateDescription && (
              <span className="text-xs text-muted-foreground shrink-0">
                {element.minRateDescription}
              </span>
            )}
            <div className="flex gap-1">
              {steps.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange(n)}
                  className={cn(
                    "h-10 w-10 rounded-md border text-sm font-medium transition-colors",
                    value === n
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-input"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            {element.maxRateDescription && (
              <span className="text-xs text-muted-foreground shrink-0">
                {element.maxRateDescription}
              </span>
            )}
          </div>
        </div>
      );
    }

    case "boolean":
      return (
        <div className="flex items-center space-x-3">
          <Switch
            id={element.name}
            checked={value ?? false}
            onCheckedChange={onChange}
          />
          <Label htmlFor={element.name} className="cursor-pointer font-normal">
            {value ? "Yes" : "No"}
          </Label>
        </div>
      );

    case "comment":
      return (
        <Textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer here..."
          rows={4}
        />
      );

    default:
      return <p className="text-muted-foreground text-sm">Unsupported question type: {element.type}</p>;
  }
}
