import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { Plus, Upload, Trash2, Edit, Check, X, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  visibility: string;
  is_published: boolean;
  survey_json: any;
  created_at: string;
  created_by: string;
}

export default function QuizManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useSupabaseAuth();
  const [location, setLocation] = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);

  const [newQuiz, setNewQuiz] = useState({
    title: "",
    description: "",
    visibility: "public" as "public" | "private" | "team" | "assigned",
    surveyJson: "",
  });

  const [editQuiz, setEditQuiz] = useState({
    title: "",
    description: "",
    visibility: "public" as "public" | "private" | "team" | "assigned",
    surveyJson: "",
    is_published: false,
  });

  const { data: quizzes, isLoading, error: quizzesError } = useQuery<Quiz[]>({
    queryKey: ['quizzes-manage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching quizzes for management:', error);
        throw error;
      }
      return data || [];
    },
  });

  // Handle edit query parameter after quizzes are loaded
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const editId = params.get('edit');
    if (editId && quizzes && quizzes.length > 0 && !editingQuiz) {
      const quizToEdit = quizzes.find(q => q.id === editId);
      if (quizToEdit) {
        // Set editing quiz directly
        setEditingQuiz(quizToEdit);
        setEditQuiz({
          title: quizToEdit.title,
          description: quizToEdit.description || "",
          visibility: quizToEdit.visibility as "public" | "private" | "team" | "assigned",
          surveyJson: typeof quizToEdit.survey_json === 'string' 
            ? quizToEdit.survey_json 
            : JSON.stringify(quizToEdit.survey_json, null, 2),
          is_published: quizToEdit.is_published,
        });
        // Clean up URL
        const basePath = location.split('?')[0];
        setLocation(basePath);
        // Scroll to edit form after a short delay
        setTimeout(() => {
          const editForm = document.getElementById('edit-quiz-form');
          if (editForm) {
            editForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  }, [quizzes, location, editingQuiz]);

  const createQuizMutation = useMutation({
    mutationFn: async (quizData: any) => {
      const { data, error } = await supabase
        .from('quizzes')
        .insert({
          title: quizData.title,
          description: quizData.description,
          visibility: quizData.visibility,
          survey_json: quizData.surveyJson,
          mode: quizData.mode || 'take',
          is_published: false,
          created_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes-manage'] });
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
      const { error } = await supabase
        .from('quizzes')
        .update({ is_published: true })
        .eq('id', quizId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes-manage'] });
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

  const updateQuizMutation = useMutation({
    mutationFn: async (quizData: { id: string; title: string; description: string; visibility: string; surveyJson: any; is_published: boolean }) => {
      console.log('Updating quiz:', quizData);
      const { data, error } = await supabase
        .from('quizzes')
        .update({
          title: quizData.title,
          description: quizData.description || null,
          visibility: quizData.visibility,
          survey_json: quizData.surveyJson,
          is_published: quizData.is_published,
        })
        .eq('id', quizData.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating quiz:', error);
        throw error;
      }
      console.log('Quiz updated successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes-manage'] });
      setEditingQuiz(null);
      setEditQuiz({
        title: "",
        description: "",
        visibility: "public",
        surveyJson: "",
        is_published: false,
      });
      toast({
        title: "Success",
        description: "Quiz updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update quiz",
        variant: "destructive",
      });
    },
  });

  const deleteQuizMutation = useMutation({
    mutationFn: async (quizId: string) => {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes-manage'] });
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (isEdit) {
          setEditQuiz(prev => ({
            ...prev,
            title: parsed.title || prev.title,
            description: parsed.description || prev.description,
            surveyJson: JSON.stringify(parsed, null, 2),
          }));
        } else {
          setNewQuiz(prev => ({
            ...prev,
            title: parsed.title || prev.title,
            description: parsed.description || prev.description,
            surveyJson: JSON.stringify(parsed, null, 2),
          }));
        }
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

  const handleEditQuiz = (quiz: Quiz) => {
    console.log('Editing quiz:', quiz);
    setEditingQuiz(quiz);
    setEditQuiz({
      title: quiz.title,
      description: quiz.description || "",
      visibility: quiz.visibility as "public" | "private" | "team" | "assigned",
      surveyJson: typeof quiz.survey_json === 'string' 
        ? quiz.survey_json 
        : JSON.stringify(quiz.survey_json, null, 2),
      is_published: quiz.is_published,
    });
    
    // Scroll to edit form after a short delay to ensure it's rendered
    setTimeout(() => {
      const editForm = document.getElementById('edit-quiz-form');
      if (editForm) {
        editForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleUpdateQuiz = () => {
    if (!editingQuiz) return;
    
    try {
      const parsedJson = JSON.parse(editQuiz.surveyJson);

      updateQuizMutation.mutate({
        id: editingQuiz.id,
        title: editQuiz.title,
        description: editQuiz.description,
        visibility: editQuiz.visibility,
        surveyJson: parsedJson,
        is_published: editQuiz.is_published,
      });
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your SurveyJS JSON format",
        variant: "destructive",
      });
    }
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
                          quiz.is_published
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }`}
                      >
                        {quiz.is_published ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        console.log('Viewing quiz:', quiz.id);
                        setLocation(`/quiz/take/${quiz.id}`);
                      }}
                      data-testid={`button-view-${quiz.id}`}
                      title="View/Preview Quiz"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!quiz.is_published && (
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
                      onClick={() => handleEditQuiz(quiz)}
                      data-testid={`button-edit-${quiz.id}`}
                      title="Edit Quiz"
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
                      title="Delete Quiz"
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

      {editingQuiz && (
        <Card id="edit-quiz-form">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Edit Quiz</CardTitle>
                <CardDescription>
                  Update quiz details and SurveyJS JSON
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingQuiz(null);
                  setEditQuiz({
                    title: "",
                    description: "",
                    visibility: "public",
                    surveyJson: "",
                    is_published: false,
                  });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Quiz Title</Label>
              <Input
                id="edit-title"
                value={editQuiz.title}
                onChange={(e) =>
                  setEditQuiz({ ...editQuiz, title: e.target.value })
                }
                placeholder="Enter quiz title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editQuiz.description}
                onChange={(e) =>
                  setEditQuiz({ ...editQuiz, description: e.target.value })
                }
                placeholder="Enter quiz description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-visibility">Visibility</Label>
              <Select
                value={editQuiz.visibility}
                onValueChange={(value: any) =>
                  setEditQuiz({ ...editQuiz, visibility: value })
                }
              >
                <SelectTrigger>
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
              <Label htmlFor="edit-published">Published Status</Label>
              <Select
                value={editQuiz.is_published ? "published" : "draft"}
                onValueChange={(value) =>
                  setEditQuiz({ ...editQuiz, is_published: value === "published" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-file-upload">Upload JSON File</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-file-upload"
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileUpload(e, true)}
                />
                <Button variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-survey-json">SurveyJS JSON</Label>
              <Textarea
                id="edit-survey-json"
                value={editQuiz.surveyJson}
                onChange={(e) =>
                  setEditQuiz({ ...editQuiz, surveyJson: e.target.value })
                }
                placeholder='{"title": "My Quiz", "pages": [...]}'
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleUpdateQuiz}
                disabled={
                  !editQuiz.title || !editQuiz.surveyJson || updateQuizMutation.isPending
                }
              >
                {updateQuizMutation.isPending ? "Updating..." : "Update Quiz"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingQuiz(null);
                  setEditQuiz({
                    title: "",
                    description: "",
                    visibility: "public",
                    surveyJson: "",
                    is_published: false,
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
