import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  BookOpen,
  Building2,
  Users,
  Clock,
  ArrowRight,
  MapPin,
  Globe,
  Trophy,
} from "lucide-react";
import { fetchDiscover } from "@/lib/api-client";
import type { DiscoverQuiz, DiscoverEcosystem, DiscoverResponse } from "@/types/api";

const modeLabels: Record<string, string> = {
  standard: "Knowledge Check",
  assessment: "Self-Assessment",
  survey: "Survey",
};

export default function DiscoverHub() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Simple debounce on search
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (value: string) => {
    setSearch(value);
    if (timer) clearTimeout(timer);
    setTimer(
      setTimeout(() => {
        setDebouncedSearch(value);
      }, 300),
    );
  };

  const { data, isLoading, error } = useQuery<DiscoverResponse>({
    queryKey: ["discover", tab, debouncedSearch],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (tab !== "all") params.tab = tab;
      if (debouncedSearch) params.q = debouncedSearch;
      return fetchDiscover(params);
    },
  });

  const quizzes = data?.quizzes?.items ?? [];
  const ecosystems = data?.ecosystems?.items ?? [];
  const quizTotal = data?.quizzes?.total ?? 0;
  const ecoTotal = data?.ecosystems?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Explore</h1>
        <p className="text-muted-foreground mt-1">
          Discover quizzes to sharpen your governance skills and ecosystems to
          join
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search quizzes and ecosystems..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
          data-testid="input-discover-search"
        />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">
            All
          </TabsTrigger>
          <TabsTrigger value="quizzes">
            <BookOpen className="h-4 w-4 mr-1.5" />
            Quizzes {quizTotal > 0 && `(${quizTotal})`}
          </TabsTrigger>
          <TabsTrigger value="ecosystems">
            <Building2 className="h-4 w-4 mr-1.5" />
            Ecosystems {ecoTotal > 0 && `(${ecoTotal})`}
          </TabsTrigger>
        </TabsList>

        {/* Loading / Error states */}
        {isLoading && (
          <div className="py-12 text-center text-muted-foreground">
            Loading...
          </div>
        )}
        {error && (
          <div className="py-12 text-center">
            <p className="text-destructive font-medium mb-1">
              Failed to load discover feed
            </p>
            <p className="text-muted-foreground text-sm">
              {(error as Error).message}
            </p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* ALL tab */}
            <TabsContent value="all" className="space-y-8 mt-4">
              {/* Quizzes section */}
              {quizzes.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <BookOpen className="h-5 w-5" /> Quizzes
                    </h2>
                    {quizTotal > quizzes.length && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTab("quizzes")}
                      >
                        View all <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {quizzes.map((q) => (
                      <QuizDiscoverCard key={q.id} quiz={q} />
                    ))}
                  </div>
                </section>
              )}

              {/* Ecosystems section */}
              {ecosystems.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Building2 className="h-5 w-5" /> Ecosystems
                    </h2>
                    {ecoTotal > ecosystems.length && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTab("ecosystems")}
                      >
                        View all <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {ecosystems.map((e) => (
                      <EcosystemDiscoverCard key={e.id} ecosystem={e} />
                    ))}
                  </div>
                </section>
              )}

              {quizzes.length === 0 && ecosystems.length === 0 && (
                <EmptyState search={debouncedSearch} />
              )}
            </TabsContent>

            {/* QUIZZES tab */}
            <TabsContent value="quizzes" className="mt-4">
              {quizzes.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {quizzes.map((q) => (
                    <QuizDiscoverCard key={q.id} quiz={q} />
                  ))}
                </div>
              ) : (
                <EmptyState search={debouncedSearch} type="quizzes" />
              )}
            </TabsContent>

            {/* ECOSYSTEMS tab */}
            <TabsContent value="ecosystems" className="mt-4">
              {ecosystems.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {ecosystems.map((e) => (
                    <EcosystemDiscoverCard key={e.id} ecosystem={e} />
                  ))}
                </div>
              ) : (
                <EmptyState search={debouncedSearch} type="ecosystems" />
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function QuizDiscoverCard({ quiz }: { quiz: DiscoverQuiz }) {
  return (
    <Card className="flex flex-col" data-testid={`card-discover-quiz-${quiz.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{quiz.title}</CardTitle>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {modeLabels[quiz.mode] ?? quiz.mode}
          </Badge>
        </div>
        {quiz.description && (
          <CardDescription className="line-clamp-2">
            {quiz.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {quiz.time_limit && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {quiz.time_limit} min
            </span>
          )}
          {quiz.completions > 0 && (
            <span className="flex items-center gap-1">
              <Trophy className="h-3.5 w-3.5" /> {quiz.completions} completed
            </span>
          )}
          {quiz.course_name && (
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" /> {quiz.course_name}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Link href={`/quiz/take/${quiz.id}`} className="w-full">
          <Button className="w-full" size="sm">
            Take Quiz <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function EcosystemDiscoverCard({
  ecosystem,
}: {
  ecosystem: DiscoverEcosystem;
}) {
  return (
    <Card
      className="flex flex-col"
      data-testid={`card-discover-eco-${ecosystem.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">
            {ecosystem.name}
          </CardTitle>
          <Badge
            variant={ecosystem.status === "active" ? "default" : "outline"}
            className="shrink-0 text-xs"
          >
            {ecosystem.status}
          </Badge>
        </div>
        {ecosystem.description && (
          <CardDescription className="line-clamp-2">
            {ecosystem.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {ecosystem.member_count}{" "}
            {ecosystem.member_count === 1 ? "member" : "members"}
          </span>
          {ecosystem.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {ecosystem.location}
            </span>
          )}
          {ecosystem.website && (
            <span className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" /> Website
            </span>
          )}
        </div>
        {ecosystem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {ecosystem.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {ecosystem.tags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{ecosystem.tags.length - 4}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Link href={`/ecosystems/${ecosystem.id}`} className="w-full">
          <Button variant="outline" className="w-full" size="sm">
            View Ecosystem <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function EmptyState({
  search,
  type,
}: {
  search: string;
  type?: "quizzes" | "ecosystems";
}) {
  const label = type ?? "quizzes or ecosystems";
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-muted-foreground">
          {search
            ? `No ${label} match "${search}"`
            : `No public ${label} available yet. Check back soon!`}
        </p>
      </CardContent>
    </Card>
  );
}
