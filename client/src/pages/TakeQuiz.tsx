import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.css";
import { FlatLightPanelless, FlatDarkPanelless } from "survey-core/themes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { useQuiz, useSubmitQuizResult } from "@/hooks/use-courses";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  survey_json: any;
  time_limit: number | null;
  passing_score: number | null;
}

export default function TakeQuiz() {
  const [, params] = useRoute("/quiz/take/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { member } = useAuth();
  const [survey, setSurvey] = useState<Model | null>(null);
  const [startTime] = useState(Date.now());

  const { theme } = useTheme();
  const quizId = params?.id;

  const { data: quizData, isLoading, error } = useQuiz(quizId || '');
  // Map API response to local Quiz shape
  const quiz: Quiz | null = quizData
    ? {
        id: (quizData as any).id,
        title: (quizData as any).title,
        description: (quizData as any).description ?? null,
        survey_json: (quizData as any).survey_json ?? (quizData as any).config ?? null,
        time_limit: (quizData as any).time_limit ?? null,
        passing_score: (quizData as any).passing_score ?? null,
      }
    : null;

  const submitResultMutation = useSubmitQuizResult(quizId || '');

  const submitQuizMutation = useMutation({
    mutationFn: async (data: { surveyResults: any; timeSpent: number }) => {
      if (!member?.id || !quizId || !quiz) throw new Error('Not authenticated or quiz not found');

      const response = await submitResultMutation.mutateAsync({
        survey_results: data.surveyResults,
        time_spent: data.timeSpent || undefined,
      });

      return {
        result: (response as any).result ?? response,
        tilesCreated: (response as any).tiles_created || 0,
        isAssessment: (response as any).is_assessment || false,
      };
    },
    onSuccess: (data) => {
      // Invalidate all relevant caches to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['my-quiz-results'] });
      queryClient.invalidateQueries({ queryKey: ['my-quiz-history'] });
      queryClient.invalidateQueries({ queryKey: ['profile-tiles'] });
      queryClient.invalidateQueries({ queryKey: ['my-profile-data'] });
      
      // Invalidate the specific result cache if we have the result ID
      const resultId = data.result?.id;
      if (resultId) {
        queryClient.invalidateQueries({ queryKey: ['quiz-result', resultId] });
      }
      
      // Show success message
      let description = "Your answers have been saved successfully";
      if (data.tilesCreated > 0) {
        description += ` • ${data.tilesCreated} profile insight${data.tilesCreated > 1 ? 's' : ''} added!`;
      }
      
      toast({
        title: "Quiz Submitted!",
        description,
      });
      
      // Navigate to the specific result by its ID
      if (resultId) {
        setLocation(`/quiz/results/${resultId}`);
      } else {
        // Fallback to quiz ID (backwards compatibility)
        setLocation(`/quiz/results/${quizId}`);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit quiz",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (quiz && quiz.survey_json) {
      try {
        const surveyModel = new Model(quiz.survey_json);
        
        // Apply theme matching the app's current light/dark mode
        surveyModel.applyTheme(theme === 'dark' ? FlatDarkPanelless : FlatLightPanelless);

        surveyModel.onComplete.add((sender) => {
          const timeSpent = Math.floor((Date.now() - startTime) / 1000);

          submitQuizMutation.mutate({
            surveyResults: sender.data,
            timeSpent,
          });
        });

        if (quiz.time_limit) {
          surveyModel.maxTimeToFinish = quiz.time_limit * 60;
          surveyModel.showTimerPanel = "top";
        }

        setSurvey(surveyModel);
      } catch (error) {
        console.error("Error creating survey model:", error);
        toast({
          title: "Error",
          description: "Failed to load quiz content",
          variant: "destructive",
        });
      }
    }
  }, [quiz, startTime]);

  // Re-apply theme when light/dark mode changes without recreating the model
  useEffect(() => {
    if (survey) {
      survey.applyTheme(theme === 'dark' ? FlatDarkPanelless : FlatLightPanelless);
    }
  }, [survey, theme]);

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

      <Card>
        <CardContent className="p-6">
          {survey ? (
            <Survey model={survey} />
          ) : (
            <div className="text-center p-12">
              <p className="text-muted-foreground">Initializing quiz...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
