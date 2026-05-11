import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Trash2, Edit, Check, X, Eye, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEcosystem } from "@/contexts/EcosystemContext";
import { fetchQuizzes, createQuiz, updateQuiz, deleteQuiz } from "@/lib/api-client";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  mode: string;
  visibility: string;
  is_published: boolean;
  is_entry_quiz: boolean;
  passing_score: number | null;
  allow_retakes: boolean;
  ecosystem_id: string | null;
  domain_id: string | null;
  survey_json: any;
  created_at: string;
  created_by: string;
}

interface QuizFormState {
  title: string;
  description: string;
  mode: string;
  visibility: string;
  surveyJson: string;
  passing_score: string;
  allow_retakes: boolean;
  is_entry_quiz: boolean;
  is_published: boolean;
}

const EMPTY_FORM: QuizFormState = {
  title: "",
  description: "",
  mode: "standard",
  visibility: "public",
  surveyJson: "",
  passing_score: "70",
  allow_retakes: true,
  is_entry_quiz: false,
  is_published: false,
};

/**
 * Validate survey JSON for grading support.
 * Returns warnings (not blocking) about questions missing correctAnswer.
 */
function validateSurveyJson(json: any, mode: string): { valid: boolean; error?: string; warnings: string[] } {
  if (!json || typeof json !== "object") return { valid: false, error: "Survey JSON must be a valid object", warnings: [] };

  const pages = json.pages;
  if (!Array.isArray(pages) || pages.length === 0) return { valid: false, error: "Survey JSON must have at least one page with elements", warnings: [] };

  const allElements: any[] = pages.flatMap((p: any) => p.elements ?? []);
  if (allElements.length === 0) return { valid: false, error: "Survey JSON must have at least one question element", warnings: [] };

  const warnings: string[] = [];

  // For standard (graded) quizzes, check that gradable questions exist
  if (mode === "standard") {
    const gradable = allElements.filter((el) => el.correctAnswer !== undefined);
    const radiogroups = allElements.filter((el) => el.type === "radiogroup");

    if (gradable.length === 0 && radiogroups.length > 0) {
      warnings.push(
        `${radiogroups.length} multiple-choice question(s) are missing "correctAnswer". ` +
        `Without correctAnswer, the quiz cannot be auto-graded. Add a "correctAnswer" field to each radiogroup element.`
      );
    } else if (gradable.length > 0 && gradable.length < radiogroups.length) {
      const missing = radiogroups.length - gradable.length;
      warnings.push(
        `${missing} of ${radiogroups.length} multiple-choice question(s) are missing "correctAnswer". ` +
        `Only ${gradable.length} will be graded.`
      );
    }

    // Check that each gradable question's correctAnswer matches one of its choices
    for (const el of gradable) {
      if (el.choices && Array.isArray(el.choices)) {
        const choiceValues = el.choices.map((c: any) => typeof c === "string" ? c : c.value ?? c.text);
        if (!choiceValues.includes(el.correctAnswer)) {
          warnings.push(
            `Question "${el.title || el.name}": correctAnswer "${el.correctAnswer}" does not match any choice.`
          );
        }
      }
    }
  }

  return { valid: true, warnings };
}

export default function QuizManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { member } = useAuth();
  const { selected, ecosystems } = useEcosystem();
  const [location, setLocation] = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);

  const [newQuiz, setNewQuiz] = useState<QuizFormState>({ ...EMPTY_FORM });
  const [editQuiz, setEditQuiz] = useState<QuizFormState>({ ...EMPTY_FORM });

  // Build query params scoped to selected ecosystem
  const queryParams: Record<string, string> = {};
  if (selected) {
    queryParams.ecosystem_id = selected.id;
  }

  const { data: quizzes, isLoading } = useQuery<Quiz[]>({
    queryKey: ['quizzes-manage', queryParams],
    queryFn: async () => {
      const result = await fetchQuizzes(Object.keys(queryParams).length > 0 ? queryParams : undefined);
      const items = (result as any).items || (result as any).quizzes || [];
      return items.map((q: any) => ({
        id: q.id,
        title: q.title,
        description: q.description ?? null,
        mode: q.mode ?? "standard",
        visibility: q.visibility ?? 'public',
        is_published: q.is_published ?? false,
        is_entry_quiz: q.is_entry_quiz ?? false,
        passing_score: q.passing_score ?? null,
        allow_retakes: q.allow_retakes ?? true,
        ecosystem_id: q.ecosystem_id ?? null,
        domain_id: q.domain_id ?? null,
        survey_json: q.survey_json ?? q.config ?? null,
        created_at: q.created_at,
        created_by: q.created_by ?? q.author_id ?? '',
      })) as Quiz[];
    },
  });

  // Handle edit query parameter after quizzes are loaded
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const editId = params.get('edit');
    if (editId && quizzes && quizzes.length > 0 && !editingQuiz) {
      const quizToEdit = quizzes.find(q => q.id === editId);
      if (quizToEdit) {
        handleEditQuiz(quizToEdit);
        const basePath = location.split('?')[0];
        setLocation(basePath);
        setTimeout(() => {
          document.getElementById('edit-quiz-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [quizzes, location, editingQuiz]);

  // Validation for create form
  const createValidation = useMemo(() => {
    if (!newQuiz.surveyJson) return { valid: false, error: undefined, warnings: [] };
    try {
      const parsed = JSON.parse(newQuiz.surveyJson);
      return validateSurveyJson(parsed, newQuiz.mode);
    } catch {
      return { valid: false, error: "Invalid JSON syntax", warnings: [] };
    }
  }, [newQuiz.surveyJson, newQuiz.mode]);

  // Validation for edit form
  const editValidation = useMemo(() => {
    if (!editQuiz.surveyJson) return { valid: false, error: undefined, warnings: [] };
    try {
      const parsed = JSON.parse(editQuiz.surveyJson);
      return validateSurveyJson(parsed, editQuiz.mode);
    } catch {
      return { valid: false, error: "Invalid JSON syntax", warnings: [] };
    }
  }, [editQuiz.surveyJson, editQuiz.mode]);

  const createQuizMutation = useMutation({
    mutationFn: async (quizData: QuizFormState) => {
      const parsedJson = JSON.parse(quizData.surveyJson);
      return createQuiz({
        title: quizData.title,
        description: quizData.description || null,
        visibility: quizData.visibility,
        survey_json: parsedJson,
        mode: quizData.mode,
        passing_score: quizData.mode === "standard" ? (parseInt(quizData.passing_score) || 70) : null,
        allow_retakes: quizData.allow_retakes,
        is_published: false,
        created_by: member?.id,
        ...(selected?.id && { ecosystem_id: selected.id }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes-manage'] });
      setIsCreating(false);
      setNewQuiz({ ...EMPTY_FORM });
      toast({ title: "Success", description: "Quiz created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create quiz", variant: "destructive" });
    },
  });

  const publishQuizMutation = useMutation({
    mutationFn: async (quizId: string) => { await updateQuiz(quizId, { is_published: true }); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes-manage'] });
      toast({ title: "Success", description: "Quiz published successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to publish quiz", variant: "destructive" });
    },
  });

  const updateQuizMutation = useMutation({
    mutationFn: async (data: { id: string } & QuizFormState) => {
      const parsedJson = JSON.parse(data.surveyJson);
      return updateQuiz(data.id, {
        title: data.title,
        description: data.description || null,
        visibility: data.visibility,
        survey_json: parsedJson,
        mode: data.mode,
        passing_score: data.mode === "standard" ? (parseInt(data.passing_score) || 70) : null,
        allow_retakes: data.allow_retakes,
        is_published: data.is_published,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes-manage'] });
      setEditingQuiz(null);
      setEditQuiz({ ...EMPTY_FORM });
      toast({ title: "Success", description: "Quiz updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update quiz", variant: "destructive" });
    },
  });

  const deleteQuizMutation = useMutation({
    mutationFn: async (quizId: string) => { await deleteQuiz(quizId); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes-manage'] });
      toast({ title: "Success", description: "Quiz deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete quiz", variant: "destructive" });
    },
  });

  const handleCreateQuiz = () => {
    if (!createValidation.valid) {
      toast({ title: "Invalid JSON", description: createValidation.error || "Please check your SurveyJS JSON format", variant: "destructive" });
      return;
    }
    createQuizMutation.mutate(newQuiz);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        const setter = isEdit ? setEditQuiz : setNewQuiz;
        setter(prev => ({
          ...prev,
          title: parsed.title || prev.title,
          description: parsed.description || prev.description,
          surveyJson: JSON.stringify(parsed, null, 2),
        }));
        toast({ title: "File loaded", description: "Quiz JSON loaded successfully" });
      } catch {
        toast({ title: "Invalid file", description: "Could not parse JSON file", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setEditQuiz({
      title: quiz.title,
      description: quiz.description || "",
      mode: quiz.mode || "standard",
      visibility: quiz.visibility as any,
      surveyJson: typeof quiz.survey_json === 'string'
        ? quiz.survey_json
        : JSON.stringify(quiz.survey_json, null, 2),
      passing_score: quiz.passing_score != null ? String(quiz.passing_score) : "70",
      allow_retakes: quiz.allow_retakes,
      is_entry_quiz: quiz.is_entry_quiz,
      is_published: quiz.is_published,
    });
    setTimeout(() => {
      document.getElementById('edit-quiz-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleUpdateQuiz = () => {
    if (!editingQuiz) return;
    if (!editValidation.valid) {
      toast({ title: "Invalid JSON", description: editValidation.error || "Please check your SurveyJS JSON format", variant: "destructive" });
      return;
    }
    updateQuizMutation.mutate({ id: editingQuiz.id, ...editQuiz });
  };

  const getEcosystemName = (ecoId: string | null) => {
    if (!ecoId) return null;
    return ecosystems.find(e => e.id === ecoId)?.name ?? null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quiz Management</h1>
          <p className="text-muted-foreground mt-1">
            Create, upload, and manage quizzes
            {selected && <span className="ml-1">for <strong>{selected.name}</strong></span>}
          </p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} data-testid="button-create-quiz">
          {isCreating ? (<><X className="h-4 w-4 mr-2" />Cancel</>) : (<><Plus className="h-4 w-4 mr-2" />Create Quiz</>)}
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Quiz</CardTitle>
            <CardDescription>Upload a SurveyJS JSON file or paste the JSON directly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <QuizFormFields
              form={newQuiz}
              setForm={setNewQuiz}
              validation={createValidation}
              onFileUpload={(e) => handleFileUpload(e, false)}
              idPrefix="create"
            />
            <Button
              onClick={handleCreateQuiz}
              disabled={!newQuiz.title || !createValidation.valid || createQuizMutation.isPending}
              data-testid="button-submit-quiz"
            >
              {createQuizMutation.isPending ? "Creating..." : "Create Quiz"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {isLoading ? (
          <Card><CardContent className="p-6"><p className="text-muted-foreground">Loading quizzes...</p></CardContent></Card>
        ) : quizzes && quizzes.length > 0 ? (
          quizzes.map((quiz) => (
            <Card key={quiz.id} data-testid={`card-quiz-${quiz.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription>{quiz.description}</CardDescription>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary">{quiz.visibility}</Badge>
                      <Badge variant={quiz.is_published ? "default" : "outline"}>
                        {quiz.is_published ? "Published" : "Draft"}
                      </Badge>
                      <Badge variant="outline">
                        {quiz.mode === "assessment" ? "Assessment" : "Graded"}
                      </Badge>
                      {quiz.mode === "standard" && quiz.passing_score != null && (
                        <Badge variant="outline" className="text-xs">
                          Pass: {quiz.passing_score}%
                        </Badge>
                      )}
                      {quiz.is_entry_quiz && (
                        <Badge variant="outline" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />Entry Quiz
                        </Badge>
                      )}
                      {!quiz.allow_retakes && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          No retakes
                        </Badge>
                      )}
                      {quiz.ecosystem_id && (
                        <Badge variant="outline" className="text-xs">
                          {getEcosystemName(quiz.ecosystem_id) || 'Ecosystem'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setLocation(`/quiz/take/${quiz.id}`)} data-testid={`button-view-${quiz.id}`} title="View/Preview Quiz">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!quiz.is_published && (
                      <Button size="sm" variant="outline" onClick={() => publishQuizMutation.mutate(quiz.id)} data-testid={`button-publish-${quiz.id}`}>
                        <Check className="h-4 w-4 mr-1" />Publish
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleEditQuiz(quiz)} data-testid={`button-edit-${quiz.id}`} title="Edit Quiz">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { if (confirm("Are you sure you want to delete this quiz?")) deleteQuizMutation.mutate(quiz.id); }} data-testid={`button-delete-${quiz.id}`} title="Delete Quiz">
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
                {selected
                  ? `No quizzes found for ${selected.name}. Create your first quiz to get started!`
                  : 'No quizzes yet. Select an ecosystem or create your first quiz to get started!'}
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
                <CardDescription>Update quiz details and SurveyJS JSON</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setEditingQuiz(null); setEditQuiz({ ...EMPTY_FORM }); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <QuizFormFields
              form={editQuiz}
              setForm={setEditQuiz}
              validation={editValidation}
              onFileUpload={(e) => handleFileUpload(e, true)}
              idPrefix="edit"
              showPublished
            />
            <div className="flex gap-2">
              <Button
                onClick={handleUpdateQuiz}
                disabled={!editQuiz.title || !editValidation.valid || updateQuizMutation.isPending}
              >
                {updateQuizMutation.isPending ? "Updating..." : "Update Quiz"}
              </Button>
              <Button variant="outline" onClick={() => { setEditingQuiz(null); setEditQuiz({ ...EMPTY_FORM }); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QuizFormFields({
  form,
  setForm,
  validation,
  onFileUpload,
  idPrefix,
  showPublished = false,
}: {
  form: QuizFormState;
  setForm: React.Dispatch<React.SetStateAction<QuizFormState>>;
  validation: { valid: boolean; error?: string; warnings: string[] };
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  idPrefix: string;
  showPublished?: boolean;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-title`}>Quiz Title</Label>
        <Input
          id={`${idPrefix}-title`}
          value={form.title}
          onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter quiz title"
          data-testid={`input-${idPrefix}-title`}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={form.description}
          onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter quiz description"
          data-testid={`input-${idPrefix}-description`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-mode`}>Quiz Type</Label>
          <Select value={form.mode} onValueChange={(value) => setForm(prev => ({ ...prev, mode: value }))}>
            <SelectTrigger data-testid={`select-${idPrefix}-mode`}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Graded Quiz (has correct answers)</SelectItem>
              <SelectItem value="assessment">Assessment (no right/wrong)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-visibility`}>Visibility</Label>
          <Select value={form.visibility} onValueChange={(value) => setForm(prev => ({ ...prev, visibility: value }))}>
            <SelectTrigger data-testid={`select-${idPrefix}-visibility`}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="team">Team</SelectItem>
              <SelectItem value="assigned">Assigned Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {form.mode === "standard" && (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-passing-score`}>Passing Score (%)</Label>
          <Input
            id={`${idPrefix}-passing-score`}
            type="number"
            min={1}
            max={100}
            value={form.passing_score}
            onChange={(e) => setForm(prev => ({ ...prev, passing_score: e.target.value }))}
            placeholder="70"
            className="w-32"
            data-testid={`input-${idPrefix}-passing-score`}
          />
          <p className="text-xs text-muted-foreground">
            Members scoring below this percentage will see "Not Passed" and can review what they got wrong.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label htmlFor={`${idPrefix}-retakes`} className="cursor-pointer">Allow Retakes</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Members can retake this quiz after completing it</p>
          </div>
          <Switch
            id={`${idPrefix}-retakes`}
            checked={form.allow_retakes}
            onCheckedChange={(checked) => setForm(prev => ({ ...prev, allow_retakes: checked }))}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label htmlFor={`${idPrefix}-entry`} className="cursor-pointer">Entry Quiz</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Required for onboarding into the ecosystem</p>
          </div>
          <Switch
            id={`${idPrefix}-entry`}
            checked={form.is_entry_quiz}
            onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_entry_quiz: checked }))}
          />
        </div>
      </div>

      {showPublished && (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-published`}>Published Status</Label>
          <Select
            value={form.is_published ? "published" : "draft"}
            onValueChange={(value) => setForm(prev => ({ ...prev, is_published: value === "published" }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-file-upload`}>Upload JSON File</Label>
        <div className="flex gap-2">
          <Input
            id={`${idPrefix}-file-upload`}
            type="file"
            accept=".json"
            onChange={onFileUpload}
            data-testid={`input-${idPrefix}-file-upload`}
          />
          <Button variant="outline" size="icon"><Upload className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-survey-json`}>SurveyJS JSON</Label>
        <Textarea
          id={`${idPrefix}-survey-json`}
          value={form.surveyJson}
          onChange={(e) => setForm(prev => ({ ...prev, surveyJson: e.target.value }))}
          placeholder='{"pages": [{"name": "page1", "elements": [{"type": "radiogroup", "name": "q1", "title": "...", "choices": [...], "correctAnswer": "..."}]}]}'
          rows={10}
          className="font-mono text-sm"
          data-testid={`textarea-${idPrefix}-survey-json`}
        />
        {form.mode === "standard" && (
          <p className="text-xs text-muted-foreground">
            For graded quizzes, add a <code className="bg-muted px-1 rounded">"correctAnswer"</code> field to each radiogroup element.
          </p>
        )}
      </div>

      {validation.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{validation.error}</AlertDescription>
        </Alert>
      )}

      {validation.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc pl-4 space-y-1">
              {validation.warnings.map((w, i) => (
                <li key={i} className="text-sm">{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
