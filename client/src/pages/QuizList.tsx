import { useState } from "react";
import { QuizCard } from "@/components/QuizCard";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen, Plus } from "lucide-react";
import emptyStateImage from "@assets/generated_images/Empty_quiz_state_illustration_616a28ec.png";

// TODO: remove mock functionality
const mockQuizzes = [
  {
    id: "quiz-1",
    title: "Foundations of Cooperation",
    description: "Learn the core principles of team collaboration and cooperative frameworks.",
    status: "not_started" as const,
    estimatedTime: 15,
  },
  {
    id: "quiz-2",
    title: "Leadership Essentials",
    description: "Understanding leadership styles and effective team management.",
    status: "in_progress" as const,
    progress: 65,
    estimatedTime: 20,
  },
  {
    id: "quiz-3",
    title: "Communication Skills",
    description: "Master the art of clear and effective communication in teams.",
    status: "completed" as const,
    score: 88,
    estimatedTime: 10,
  },
  {
    id: "quiz-4",
    title: "Project Management Basics",
    description: "Essential project management methodologies and tools.",
    status: "not_started" as const,
    estimatedTime: 25,
  },
  {
    id: "quiz-5",
    title: "Conflict Resolution",
    description: "Techniques for managing and resolving team conflicts.",
    status: "completed" as const,
    score: 92,
    estimatedTime: 12,
  },
];

export default function QuizList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredQuizzes = mockQuizzes.filter((quiz) => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && quiz.status === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quizzes</h1>
          <p className="text-muted-foreground mt-1">
            Explore and complete available learning modules
          </p>
        </div>
        <Button data-testid="button-create-quiz">
          <Plus className="h-4 w-4 mr-2" />
          Create Quiz
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quizzes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-quizzes"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-quizzes">
            All Quizzes
          </TabsTrigger>
          <TabsTrigger value="not_started" data-testid="tab-not-started">
            Not Started
          </TabsTrigger>
          <TabsTrigger value="in_progress" data-testid="tab-in-progress">
            In Progress
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {filteredQuizzes.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No Quizzes Found"
              description={
                searchQuery
                  ? "No quizzes match your search. Try different keywords."
                  : "No quizzes available in this category yet."
              }
              imageSrc={emptyStateImage}
              actionLabel={searchQuery ? "Clear Search" : undefined}
              onAction={searchQuery ? () => setSearchQuery("") : undefined}
            />
          ) : (
            filteredQuizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                {...quiz}
                onStart={() => console.log("Start quiz:", quiz.id)}
                onUpload={() => console.log("Upload results:", quiz.id)}
                onViewResults={() => console.log("View results:", quiz.id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
