import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.css";
import { ThreeDimensionalDarkPanelless } from "survey-core/themes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Quiz } from "@shared/schema";

export default function TakeQuiz() {
  const [, params] = useRoute("/quiz/take/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [survey, setSurvey] = useState<Model | null>(null);
  const [startTime] = useState(Date.now());

  const quizId = params?.id;

  const { data: quiz, isLoading, error } = useQuery<Quiz>({
    queryKey: ["/api/quizzes", quizId],
    queryFn: async () => {
      const response = await fetch(`/api/quizzes/${quizId}`);
      if (!response.ok) {
        throw new Error("Failed to load quiz");
      }
      return response.json();
    },
    enabled: !!quizId,
  });

  const submitQuizMutation = useMutation({
    mutationFn: async (data: { surveyResults: any; timeSpent: number }) => {
      return apiRequest("POST", `/api/quizzes/${quizId}/submit`, data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-results"] });
      toast({
        title: "Quiz Submitted",
        description: "Your answers have been saved successfully",
      });
      setLocation(`/quiz/results/${quizId}`);
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
    if (quiz && quiz.surveyJson) {
      try {
        const surveyModel = new Model(quiz.surveyJson);
        
        // Apply theme to match the app's design
        surveyModel.applyTheme(ThreeDimensionalDarkPanelless);

        surveyModel.onComplete.add((sender) => {
          const timeSpent = Math.floor((Date.now() - startTime) / 1000);

          submitQuizMutation.mutate({
            surveyResults: sender.data,
            timeSpent,
          });
        });

        if (quiz.timeLimit) {
          surveyModel.maxTimeToFinish = quiz.timeLimit * 60;
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
