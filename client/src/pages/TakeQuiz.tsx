import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.css";
import { ThreeDimensionalDarkPanelless } from "survey-core/themes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

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
  const { user } = useSupabaseAuth();
  const [survey, setSurvey] = useState<Model | null>(null);
  const [startTime] = useState(Date.now());

  const quizId = params?.id;

  const { data: quiz, isLoading, error } = useQuery<Quiz>({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title, description, survey_json, time_limit, passing_score')
        .eq('id', quizId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!quizId,
  });

  const submitQuizMutation = useMutation({
    mutationFn: async (data: { surveyResults: any; timeSpent: number }) => {
      if (!user?.id || !quizId || !quiz) throw new Error('Not authenticated or quiz not found');
      
      // Call the submit-with-tags edge function
      // This handles: scoring, retake checks, tile generation, cleanup
      const { data: response, error } = await supabase.functions.invoke(
        `quiz/submit-with-tags/${quizId}`,
        {
          body: {
            survey_results: data.surveyResults,
            time_spent: data.timeSpent || undefined,
          },
        }
      );
      
      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to submit quiz');
      }
      
      if (response?.error) {
        throw new Error(response.error);
      }
      
      const result = response?.data || response;
      
      return {
        result: result.result,
        tilesCreated: result.tiles_created || 0,
        isAssessment: result.is_assessment || false,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-quiz-results'] });
      queryClient.invalidateQueries({ queryKey: ['profile-tiles'] });
      queryClient.invalidateQueries({ queryKey: ['my-profile-data'] });
      
      // Show success message
      let description = "Your answers have been saved successfully";
      if (data.tilesCreated > 0) {
        description += ` • ${data.tilesCreated} profile insight${data.tilesCreated > 1 ? 's' : ''} added!`;
      }
      
      toast({
        title: "Quiz Submitted!",
        description,
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
    if (quiz && quiz.survey_json) {
      try {
        const surveyModel = new Model(quiz.survey_json);
        
        // Apply theme to match the app's design
        surveyModel.applyTheme(ThreeDimensionalDarkPanelless);

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
