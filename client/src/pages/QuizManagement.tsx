import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Trash2, Edit, Check, X } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Quiz } from "@shared/schema";

export default function QuizManagement() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);

  const [newQuiz, setNewQuiz] = useState({
    title: "",
    description: "",
    visibility: "public" as "public" | "private" | "team" | "assigned",
    surveyJson: "",
  });

  const { data: quizzes, isLoading } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
  });

  const createQuizMutation = useMutation({
    mutationFn: async (quizData: any) => {
      return apiRequest("POST", "/api/quizzes", quizData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      setIsCreating(false);
      setNewQuiz({
        title: "",
        description: "",
        visibility: "public",
        surveyJson: "",
      });
      toast({
        title: "Success",
        description: "Quiz created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create quiz",
        variant: "destructive",
      });
    },
  });

  const publishQuizMutation = useMutation({
    mutationFn: async (quizId: string) => {
      return apiRequest("POST", `/api/quizzes/${quizId}/publish`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      toast({
        title: "Success",
        description: "Quiz published successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to publish quiz",
        variant: "destructive",
      });
    },
  });

  const deleteQuizMutation = useMutation({
    mutationFn: async (quizId: string) => {
      return apiRequest("DELETE", `/api/quizzes/${quizId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      toast({
        title: "Success",
        description: "Quiz deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete quiz",
        variant: "destructive",
      });
    },
  });

  const handleCreateQuiz = () => {
    try {
      const parsedJson = JSON.parse(newQuiz.surveyJson);

      createQuizMutation.mutate({
        title: newQuiz.title,
        description: newQuiz.description,
        visibility: newQuiz.visibility,
        surveyJson: parsedJson,
        mode: "take",
      });
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your SurveyJS JSON format",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        setNewQuiz(prev => ({
          ...prev,
          title: parsed.title || prev.title,
          description: parsed.description || prev.description,
          surveyJson: JSON.stringify(parsed, null, 2),
        }));
        toast({
          title: "File loaded",
          description: "Quiz JSON loaded successfully",
        });
      } catch (error) {
        toast({
          title: "Invalid file",
          description: "Could not parse JSON file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quiz Management</h1>
          <p className="text-muted-foreground mt-1">
            Create, upload, and manage quizzes
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(!isCreating)}
          data-testid="button-create-quiz"
        >
          {isCreating ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Quiz
            </>
          )}
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Quiz</CardTitle>
            <CardDescription>
              Upload a SurveyJS JSON file or paste the JSON directly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title</Label>
              <Input
                id="title"
                value={newQuiz.title}
                onChange={(e) =>
                  setNewQuiz({ ...newQuiz, title: e.target.value })
                }
                placeholder="Enter quiz title"
                data-testid="input-quiz-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newQuiz.description}
                onChange={(e) =>
                  setNewQuiz({ ...newQuiz, description: e.target.value })
                }
                placeholder="Enter quiz description"
                data-testid="input-quiz-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select
                value={newQuiz.visibility}
                onValueChange={(value: any) =>
                  setNewQuiz({ ...newQuiz, visibility: value })
                }
              >
                <SelectTrigger data-testid="select-visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="assigned">Assigned Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload">Upload JSON File</Label>
              <div className="flex gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  data-testid="input-file-upload"
                />
                <Button variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="survey-json">SurveyJS JSON</Label>
              <Textarea
                id="survey-json"
                value={newQuiz.surveyJson}
                onChange={(e) =>
                  setNewQuiz({ ...newQuiz, surveyJson: e.target.value })
                }
                placeholder='{"title": "My Quiz", "pages": [...]}'
                rows={10}
                className="font-mono text-sm"
                data-testid="textarea-survey-json"
              />
            </div>

            <Button
              onClick={handleCreateQuiz}
              disabled={
                !newQuiz.title || !newQuiz.surveyJson || createQuizMutation.isPending
              }
              data-testid="button-submit-quiz"
            >
              {createQuizMutation.isPending ? "Creating..." : "Create Quiz"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Loading quizzes...</p>
            </CardContent>
          </Card>
        ) : quizzes && quizzes.length > 0 ? (
          quizzes.map((quiz) => (
            <Card key={quiz.id} data-testid={`card-quiz-${quiz.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription>{quiz.description}</CardDescription>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-secondary px-2 py-1 rounded">
                        {quiz.visibility}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          quiz.isPublished
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }`}
                      >
                        {quiz.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!quiz.isPublished && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => publishQuizMutation.mutate(quiz.id)}
                        data-testid={`button-publish-${quiz.id}`}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Publish
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingQuiz(quiz)}
                      data-testid={`button-edit-${quiz.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this quiz?")) {
                          deleteQuizMutation.mutate(quiz.id);
                        }
                      }}
                      data-testid={`button-delete-${quiz.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                No quizzes yet. Create your first quiz to get started!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
