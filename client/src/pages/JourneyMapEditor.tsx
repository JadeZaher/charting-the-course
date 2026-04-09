import React, { useState, useEffect } from "react";

class SurveyEditorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(e: Error) { return { hasError: true, error: e }; }
  render() {
    if (this.state.hasError)
      return <div className="p-4 text-sm text-destructive border rounded">Survey editor error: {this.state.error?.message}</div>;
    return this.props.children;
  }
}
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  GripVertical,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Save,
  Video,
  MessageSquare,
  CheckSquare,
  GitBranch,
  FileText,
  Loader2,
  ClipboardList,
} from "lucide-react";

// ——————————————————————————————————————————————
// Types
// ——————————————————————————————————————————————
type StepType = "video" | "choice" | "ai_conversation" | "confirmation" | "reflection" | "survey";

interface BranchCondition {
  dimension: string;
  min_score: number;
}

interface ChoiceOption {
  value: string;
  label: string;
  description: string;
}

interface Step {
  id: string;
  type: StepType;
  title: string;
  description: string;
  required: boolean;
  branch_condition?: BranchCondition | null;
  // type-specific
  video_url?: string;
  choices?: ChoiceOption[];
  choice_routes?: Record<string, string>;
  ai_prompt_template?: string;
  session_type?: string;
  confirmation_label?: string;
  reflection_prompt?: string;
  quiz_id?: string;
}

interface ExitPackageItem {
  label: string;
  url?: string;
  description?: string;
}

interface ExitPackage {
  documents: ExitPackageItem[];
  tools: ExitPackageItem[];
  next_steps: ExitPackageItem[];
  omnibot_handoff_prompt: string;
}

interface JourneyMapForm {
  title: string;
  slug: string;
  description: string;
  ethos_id: string;
  sector_alignment: string;
  role_types: string;
  min_alignment_score: number;
  is_active: boolean;
  is_default: boolean;
}

interface EthosOption {
  id: string;
  name: string;
  slug: string;
}

// ——————————————————————————————————————————————
// Helpers
// ——————————————————————————————————————————————
function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function makeDefaultStep(type: StepType): Step {
  const base = {
    id: generateId(),
    type,
    title: "",
    description: "",
    required: true,
    branch_condition: null,
  };
  switch (type) {
    case "video":
      return { ...base, video_url: "" };
    case "choice":
      return { ...base, choices: [{ value: "", label: "", description: "" }], choice_routes: {} };
    case "ai_conversation":
      return { ...base, ai_prompt_template: "", session_type: "orientation" };
    case "confirmation":
      return { ...base, confirmation_label: "" };
    case "reflection":
      return { ...base, reflection_prompt: "" };
    case "survey":
      return { ...base, quiz_id: "" };
  }
}

const STEP_ICONS: Record<StepType, React.ElementType> = {
  video: Video,
  choice: GitBranch,
  ai_conversation: MessageSquare,
  confirmation: CheckSquare,
  reflection: FileText,
  survey: ClipboardList,
};

const STEP_LABELS: Record<StepType, string> = {
  video: "Video",
  choice: "Choice",
  ai_conversation: "AI Conversation",
  confirmation: "Confirmation",
  reflection: "Reflection",
  survey: "Survey / Quiz",
};

// ——————————————————————————————————————————————
// Sortable Step Card
// ——————————————————————————————————————————————
interface QuizOption {
  id: string;
  title: string;
}

function SortableStepCard({
  step,
  index,
  onChange,
  onDelete,
  quizzes,
}: {
  step: Step;
  index: number;
  onChange: (updated: Step) => void;
  onDelete: () => void;
  quizzes: QuizOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showBranch, setShowBranch] = useState(!!step.branch_condition);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = STEP_ICONS[step.type];

  function update(partial: Partial<Step>) {
    onChange({ ...step, ...partial });
  }

  function updateChoice(i: number, partial: Partial<ChoiceOption>) {
    const choices = [...(step.choices || [])];
    choices[i] = { ...choices[i], ...partial };
    update({ choices });
  }

  function addChoice() {
    update({ choices: [...(step.choices || []), { value: "", label: "", description: "" }] });
  }

  function removeChoice(i: number) {
    update({ choices: (step.choices || []).filter((_, idx) => idx !== i) });
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="border border-border">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50 rounded-t-lg">
              {/* Drag handle */}
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-4 w-4" />
              </button>

              <Badge variant="outline" className="text-xs font-mono shrink-0">
                {index + 1}
              </Badge>

              <Badge variant="secondary" className="text-xs shrink-0">
                <Icon className="h-3 w-3 mr-1" />
                {STEP_LABELS[step.type]}
              </Badge>

              <span className="flex-1 text-sm font-medium truncate">
                {step.title || <span className="text-muted-foreground italic">Untitled step</span>}
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="p-4 pt-0 space-y-4 border-t border-border">
              {/* Common fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Title *</Label>
                  <Input
                    value={step.title}
                    onChange={(e) => update({ title: e.target.value })}
                    placeholder="Step title"
                  />
                </div>
                <div className="flex items-center gap-6 pt-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`req-${step.id}`}
                      checked={step.required}
                      onCheckedChange={(v) => update({ required: v })}
                    />
                    <Label htmlFor={`req-${step.id}`}>Required</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={step.description}
                  onChange={(e) => update({ description: e.target.value })}
                  placeholder="Optional step description or instructions"
                  rows={2}
                />
              </div>

              {/* Type-specific fields */}
              {step.type === "video" && (
                <div className="space-y-1.5">
                  <Label>Video URL *</Label>
                  <Input
                    value={step.video_url || ""}
                    onChange={(e) => update({ video_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              )}

              {step.type === "choice" && (
                <div className="space-y-3">
                  <Label>Choices</Label>
                  {(step.choices || []).map((choice, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-start">
                      <div className="space-y-1">
                        {i === 0 && <Label className="text-xs text-muted-foreground">Value *</Label>}
                        <Input
                          value={choice.value}
                          onChange={(e) => updateChoice(i, { value: e.target.value })}
                          placeholder="choice_value"
                        />
                      </div>
                      <div className="space-y-1">
                        {i === 0 && <Label className="text-xs text-muted-foreground">Label *</Label>}
                        <Input
                          value={choice.label}
                          onChange={(e) => updateChoice(i, { label: e.target.value })}
                          placeholder="Display label"
                        />
                      </div>
                      <div className="space-y-1">
                        {i === 0 && <Label className="text-xs text-muted-foreground">Description</Label>}
                        <Input
                          value={choice.description}
                          onChange={(e) => updateChoice(i, { description: e.target.value })}
                          placeholder="Optional"
                        />
                      </div>
                      <div className={i === 0 ? "pt-5" : ""}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive"
                          onClick={() => removeChoice(i)}
                          disabled={(step.choices || []).length <= 1}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addChoice}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Choice
                  </Button>
                </div>
              )}

              {step.type === "ai_conversation" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>AI Prompt Template *</Label>
                    <Textarea
                      value={step.ai_prompt_template || ""}
                      onChange={(e) => update({ ai_prompt_template: e.target.value })}
                      placeholder="System prompt for the AI conversation..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Session Type</Label>
                    <Select
                      value={step.session_type || "orientation"}
                      onValueChange={(v) => update({ session_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="orientation">Orientation</SelectItem>
                        <SelectItem value="intake">Intake</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {step.type === "confirmation" && (
                <div className="space-y-1.5">
                  <Label>Confirmation Label *</Label>
                  <Input
                    value={step.confirmation_label || ""}
                    onChange={(e) => update({ confirmation_label: e.target.value })}
                    placeholder="e.g. I understand and agree to proceed"
                  />
                </div>
              )}

              {step.type === "reflection" && (
                <div className="space-y-1.5">
                  <Label>Reflection Prompt *</Label>
                  <Textarea
                    value={step.reflection_prompt || ""}
                    onChange={(e) => update({ reflection_prompt: e.target.value })}
                    placeholder="What should the user reflect on?"
                    rows={3}
                  />
                </div>
              )}

              {step.type === "survey" && (
                <SurveyEditorBoundary>
                  <div className="space-y-1.5">
                    <Label>Quiz / Survey *</Label>
                    <Select
                      value={step.quiz_id || ""}
                      onValueChange={(v) => update({ quiz_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a published quiz..." />
                      </SelectTrigger>
                      <SelectContent>
                        {quizzes.map((q) => (
                          <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>
                        ))}
                        {quizzes.length === 0 && (
                          <SelectItem value="" disabled>No published quizzes available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </SurveyEditorBoundary>
              )}

              {/* Branch condition */}
              <div className="space-y-3 pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`branch-${step.id}`}
                    checked={showBranch}
                    onCheckedChange={(v) => {
                      setShowBranch(v);
                      if (!v) update({ branch_condition: null });
                      else update({ branch_condition: { dimension: "", min_score: 0 } });
                    }}
                  />
                  <Label htmlFor={`branch-${step.id}`} className="text-sm">
                    Branch condition (show only if profile dimension meets threshold)
                  </Label>
                </div>

                {showBranch && (
                  <div className="grid grid-cols-2 gap-3 ml-8">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Dimension</Label>
                      <Input
                        value={step.branch_condition?.dimension || ""}
                        onChange={(e) =>
                          update({
                            branch_condition: {
                              ...(step.branch_condition || { dimension: "", min_score: 0 }),
                              dimension: e.target.value,
                            },
                          })
                        }
                        placeholder="e.g. leadership"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Min Score</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={step.branch_condition?.min_score ?? 0}
                        onChange={(e) =>
                          update({
                            branch_condition: {
                              ...(step.branch_condition || { dimension: "", min_score: 0 }),
                              min_score: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}

// ——————————————————————————————————————————————
// Exit Package Editor
// ——————————————————————————————————————————————
function ExitPackageEditor({
  value,
  onChange,
}: {
  value: ExitPackage;
  onChange: (v: ExitPackage) => void;
}) {
  function updateItem(
    section: keyof Pick<ExitPackage, "documents" | "tools" | "next_steps">,
    index: number,
    partial: Partial<ExitPackageItem>
  ) {
    const arr = [...value[section]];
    arr[index] = { ...arr[index], ...partial };
    onChange({ ...value, [section]: arr });
  }

  function addItem(section: keyof Pick<ExitPackage, "documents" | "tools" | "next_steps">) {
    onChange({ ...value, [section]: [...value[section], { label: "", url: "", description: "" }] });
  }

  function removeItem(
    section: keyof Pick<ExitPackage, "documents" | "tools" | "next_steps">,
    index: number
  ) {
    onChange({ ...value, [section]: value[section].filter((_, i) => i !== index) });
  }

  function renderSection(
    label: string,
    section: keyof Pick<ExitPackage, "documents" | "tools" | "next_steps">
  ) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="font-medium">{label}</Label>
          <Button variant="outline" size="sm" onClick={() => addItem(section)}>
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
        {value[section].map((item, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <Input
              value={item.label}
              onChange={(e) => updateItem(section, i, { label: e.target.value })}
              placeholder="Label"
            />
            <Input
              value={item.url || ""}
              onChange={(e) => updateItem(section, i, { url: e.target.value })}
              placeholder="URL (optional)"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive"
              onClick={() => removeItem(section, i)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {value[section].length === 0 && (
          <p className="text-sm text-muted-foreground">No {label.toLowerCase()} added yet.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderSection("Documents", "documents")}
      {renderSection("Tools", "tools")}
      {renderSection("Next Steps", "next_steps")}
      <div className="space-y-1.5">
        <Label>OmniBot Handoff Prompt</Label>
        <Textarea
          value={value.omnibot_handoff_prompt}
          onChange={(e) => onChange({ ...value, omnibot_handoff_prompt: e.target.value })}
          placeholder="System prompt passed to OmniBot after journey completion..."
          rows={3}
        />
      </div>
    </div>
  );
}

// ——————————————————————————————————————————————
// Main Editor Page
// ——————————————————————————————————————————————
export default function JourneyMapEditor() {
  const params = useParams<{ id?: string }>();
  const mapId = params.id;
  const isNew = !mapId;

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [form, setForm] = useState<JourneyMapForm>({
    title: "",
    slug: "",
    description: "",
    ethos_id: "",
    sector_alignment: "",
    role_types: "",
    min_alignment_score: 0,
    is_active: true,
    is_default: false,
  });

  const [steps, setSteps] = useState<Step[]>([]);
  const [exitPackage, setExitPackage] = useState<ExitPackage>({
    documents: [],
    tools: [],
    next_steps: [],
    omnibot_handoff_prompt: "",
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Fetch existing map when editing
  const { isLoading: mapLoading, data: existingMap } = useQuery({
    queryKey: ["journey-map-edit", mapId],
    queryFn: async () => {
      if (!mapId) return null;
      const { data, error } = await supabase.functions.invoke(`journey-maps-get?id=${mapId}`);
      if (error) throw error;
      return data?.data;
    },
    enabled: !isNew,
  });
  useEffect(() => {
    if (!existingMap) return;
    setForm({
      title: existingMap.title || "",
      slug: existingMap.slug || "",
      description: existingMap.description || "",
      ethos_id: existingMap.ethos_id || "",
      sector_alignment: (existingMap.sector_alignment || []).join(", "),
      role_types: (existingMap.role_types || []).join(", "),
      min_alignment_score: existingMap.min_alignment_score || 0,
      is_active: existingMap.is_active ?? true,
      is_default: existingMap.is_default ?? false,
    });
    setSlugManuallyEdited(true); // Prevent overwriting slug on edit
    // Load steps from content_sequence
    const seq = Array.isArray(existingMap.content_sequence) ? existingMap.content_sequence : [];
    setSteps(seq.map((s: any) => ({ ...s, id: s.id || generateId() })));
    // Load exit package
    const ep = existingMap.exit_package || {};
    setExitPackage({
      documents: ep.documents || [],
      tools: ep.tools || [],
      next_steps: ep.next_steps || [],
      omnibot_handoff_prompt: ep.omnibot_handoff_prompt || "",
    });
  }, [existingMap]);

  // Fetch ETHOS for select
  const { data: ethosList = [] } = useQuery<EthosOption[]>({
    queryKey: ["ethos-list-editor"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ethos-list");
      if (error) throw error;
      return (data?.data?.ethos || []) as EthosOption[];
    },
  });

  const { data: quizList = [] } = useQuery<QuizOption[]>({
    queryKey: ["quiz-list-editor"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("quiz-get-visible-quizzes");
      if (error) throw error;
      const quizzes = data?.data?.quizzes || data?.data || [];
      return quizzes.map((q: any) => ({ id: q.id, title: q.title })) as QuizOption[];
    },
  });

  // Auto-generate slug from title
  function handleTitleChange(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: slugManuallyEdited ? f.slug : slugify(title),
    }));
  }

  function handleSlugChange(slug: string) {
    setSlugManuallyEdited(true);
    setForm((f) => ({ ...f, slug }));
  }

  // Step management
  function addStep(type: StepType) {
    setSteps((prev) => [...prev, makeDefaultStep(type)]);
  }

  function updateStep(id: string, updated: Step) {
    setSteps((prev) => prev.map((s) => (s.id === id ? updated : s)));
  }

  function deleteStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSteps((items) => {
        const oldIndex = items.findIndex((s) => s.id === active.id);
        const newIndex = items.findIndex((s) => s.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        id: mapId || undefined,
        title: form.title,
        slug: form.slug,
        description: form.description || null,
        ethos_id: form.ethos_id || null,
        sector_alignment: form.sector_alignment
          ? form.sector_alignment.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        role_types: form.role_types
          ? form.role_types.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        min_alignment_score: form.min_alignment_score,
        is_active: form.is_active,
        is_default: form.is_default,
        content_sequence: steps,
        exit_package: exitPackage,
      };

      const fn = isNew ? "journey-maps-create" : "journey-maps-update";
      const { data, error } = await supabase.functions.invoke(fn, { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error || "Save failed");
      return data.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["journey-maps-list"] });
      if (isNew && data?.id) {
        toast({ title: "Journey map created!" });
        setLocation(`/admin/journey-maps/${data.id}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["journey-map-edit", mapId] });
        toast({ title: "Journey map saved!" });
      }
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  if (!isNew && mapLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/admin/journey-maps")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? "Create Journey Map" : "Edit Journey Map"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isNew
                ? "Configure a new orientation journey sequence"
                : form.title || "Editing map"}
            </p>
          </div>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Map
        </Button>
      </div>

      {/* Section 1 — Map Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Map Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Journey map title"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slug *</Label>
              <Input
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="auto-generated-from-title"
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of this journey map's purpose"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>ETHOS Organization</Label>
              <Select
                value={form.ethos_id || "_none"}
                onValueChange={(v) => setForm((f) => ({ ...f, ethos_id: v === "_none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ETHOS..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {ethosList.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Min Alignment Score</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.min_alignment_score}
                onChange={(e) =>
                  setForm((f) => ({ ...f, min_alignment_score: parseInt(e.target.value) || 0 }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Sector Alignment</Label>
              <Input
                value={form.sector_alignment}
                onChange={(e) => setForm((f) => ({ ...f, sector_alignment: e.target.value }))}
                placeholder="tech, education, nonprofit (comma-separated)"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role Types</Label>
              <Input
                value={form.role_types}
                onChange={(e) => setForm((f) => ({ ...f, role_types: e.target.value }))}
                placeholder="facilitator, member, steward (comma-separated)"
              />
            </div>
          </div>

          <div className="flex items-center gap-8 pt-2">
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_default"
                checked={form.is_default}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_default: v }))}
              />
              <Label htmlFor="is_default">Default map for this ETHOS</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 — Step Builder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Steps ({steps.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {steps.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No steps yet. Add your first step below.
            </p>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <SortableStepCard
                    key={step.id}
                    step={step}
                    index={index}
                    onChange={(updated) => updateStep(step.id, updated)}
                    onDelete={() => deleteStep(step.id)}
                    quizzes={quizList}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Add Step buttons */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Add a step:</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STEP_LABELS) as StepType[]).map((type) => {
                const Icon = STEP_ICONS[type];
                return (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => addStep(type)}
                  >
                    <Icon className="h-3 w-3 mr-1.5" />
                    {STEP_LABELS[type]}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3 — Exit Package */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exit Package</CardTitle>
        </CardHeader>
        <CardContent>
          <ExitPackageEditor value={exitPackage} onChange={setExitPackage} />
        </CardContent>
      </Card>

      {/* Save footer */}
      <div className="flex justify-end pb-8">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} size="lg">
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Journey Map
        </Button>
      </div>
    </div>
  );
}
