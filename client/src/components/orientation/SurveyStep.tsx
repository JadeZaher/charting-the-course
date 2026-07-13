import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { JourneyStep } from '@/types/orientation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, ClipboardList } from 'lucide-react';
import { useQuiz } from '@/hooks/use-courses';
import { submitQuizResult } from '@/lib/api-client';

interface Props {
  step: JourneyStep;
  onComplete: (response?: unknown) => void;
}

interface QuizQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'short_answer' | 'true_false';
  options?: { id: string; text: string }[];
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
}

export function SurveyStep({ step, onComplete }: Props) {
  const quizId = step.quiz_id;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: quizData, isLoading, isError } = useQuiz(quizId || '');
  // Map API response to local Quiz shape
  const quiz: Quiz | null = quizData
    ? {
        id: (quizData as any).id,
        title: (quizData as any).title,
        description: (quizData as any).description,
        questions: (quizData as any).questions || [],
      }
    : null;

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!quizId) return;
      await submitQuizResult(quizId, { answers });
    },
    onSuccess: () => {
      setSubmitted(true);
      onComplete({ quiz_id: quizId, answers });
    },
  });

  if (!quizId) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">{step.title}</h2>
          {step.description && (
            <p className="text-muted-foreground mt-1 text-sm">{step.description}</p>
          )}
        </div>
        <p className="text-sm text-muted-foreground">No quiz configured for this step.</p>
        <div className="flex justify-end">
          <Button onClick={() => onComplete({})}>Continue</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-32 w-full rounded-none" />
      </div>
    );
  }

  if (isError || !quiz) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">{step.title}</h2>
        </div>
        <p className="text-sm text-destructive">Failed to load quiz. You may skip this step.</p>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onComplete({})}>Skip</Button>
        </div>
      </div>
    );
  }

  const questions: QuizQuestion[] = quiz.questions || [];
  const allAnswered = !step.required || questions.every((q) => answers[q.id]?.trim());

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">{step.title || quiz.title}</h2>
        </div>
        {step.description && (
          <p className="text-muted-foreground mt-1 text-sm">{step.description}</p>
        )}
        {quiz.description && !step.description && (
          <p className="text-muted-foreground mt-1 text-sm">{quiz.description}</p>
        )}
      </div>

      <div className="space-y-5">
        {questions.map((q, i) => (
          <div key={q.id} className="space-y-2 border border-strong-border bg-muted/20 p-5">
            <p className="text-sm font-medium">
              {i + 1}. {q.text}
            </p>

            {(q.type === 'multiple_choice' || q.type === 'true_false') && q.options ? (
              <RadioGroup
                value={answers[q.id] || ''}
                onValueChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                className="space-y-1.5"
              >
                {q.options.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <RadioGroupItem value={opt.id} id={`${q.id}-${opt.id}`} />
                    <Label htmlFor={`${q.id}-${opt.id}`} className="text-sm font-normal cursor-pointer">
                      {opt.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Textarea
                value={answers[q.id] || ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                placeholder="Your answer…"
                rows={3}
                className="resize-none"
              />
            )}
          </div>
        ))}

        {questions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            This quiz has no questions configured.
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          disabled={!allAnswered || submitMutation.isPending || submitted}
          onClick={() => submitMutation.mutate()}
        >
          <CheckCircle className="h-4 w-4 mr-1.5" />
          {submitMutation.isPending ? 'Submitting…' : 'Submit & Continue'}
        </Button>
      </div>
    </div>
  );
}
