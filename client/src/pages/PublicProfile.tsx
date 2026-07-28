import { useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Award,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Compass,
  ExternalLink,
  Github,
  Globe,
  GraduationCap,
  HeartHandshake,
  Linkedin,
  Loader2,
  MapPin,
  Network,
  Pencil,
  Share2,
  Sparkles,
  Target,
} from "lucide-react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchPublicProfile } from "@/lib/api-client";
import { resolveExternalUrl, resolveMediaUrl } from "@/lib/media";
import type {
  PublicProfileQuizAttempt,
  PublicProfileQuizResult,
  PublicProfileResponse,
  SharesNeeds,
} from "@/types/api";

function DossierCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`border border-foreground bg-card ${className}`}>{children}</section>;
}

function SectionLabel({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Award;
  title: string;
  detail?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-foreground pb-4">
      <div>
        <h2 className="text-xs font-black uppercase tracking-[0.18em]">{title}</h2>
        {detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}
      </div>
      <Icon className="h-4 w-4" aria-hidden="true" />
    </div>
  );
}

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === "object") return Object.values(value).flatMap(collectStrings);
  return [];
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function latestAttempt(attempts: PublicProfileQuizAttempt[]) {
  return [...attempts].sort((a, b) => {
    const aTime = a.completed_at ? new Date(a.completed_at).getTime() : 0;
    const bTime = b.completed_at ? new Date(b.completed_at).getTime() : 0;
    return bTime - aTime;
  })[0];
}

function bestScore(attempts: PublicProfileQuizAttempt[]) {
  const scores = attempts
    .map((attempt) => attempt.score)
    .filter((score): score is number => score !== null);
  return scores.length ? Math.max(...scores) : null;
}

function publicationLabel(type: SharesNeeds["type"]) {
  if (type === "share") return "Share";
  if (type === "need") return "Need";
  return "Solution";
}

function QuizCard({ item }: { item: PublicProfileQuizResult }) {
  const latest = latestAttempt(item.results);
  const score = bestScore(item.results);
  const passed = item.results.some((attempt) => attempt.is_passed);

  return (
    <article className="border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-black tracking-tight">{item.quiz.title}</h4>
          {latest?.completed_at && (
            <p className="mt-1 text-xs text-muted-foreground">
              Completed {new Date(latest.completed_at).toLocaleDateString()}
            </p>
          )}
        </div>
        {passed ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-label="Passed" />
        ) : (
          <GraduationCap className="h-5 w-5 shrink-0" aria-hidden="true" />
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {score !== null && <Badge variant="outline">Best score {score}%</Badge>}
        <Badge variant="secondary">
          {item.results.length} {item.results.length === 1 ? "completion" : "attempts"}
        </Badge>
      </div>
    </article>
  );
}

export default function PublicProfile() {
  const [, params] = useRoute("/users/:username");
  const identifier = params?.username;
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error } = useQuery<PublicProfileResponse>({
    queryKey: ["public-profile", identifier],
    queryFn: () => fetchPublicProfile(identifier!),
    enabled: Boolean(identifier),
  });

  const skills = useMemo(
    () =>
      unique([
        ...(data?.profile.skills ?? []),
        ...(data?.ecosystems.flatMap((item) => collectStrings(item.membership.skills_offered)) ?? []),
      ]),
    [data],
  );
  const skillsNeeded = useMemo(
    () =>
      unique(
        data?.ecosystems.flatMap((item) => collectStrings(item.membership.skills_needed)) ?? [],
      ),
    [data],
  );
  const interests = useMemo(
    () =>
      unique([
        ...(data?.profile.interests ?? []),
        ...(data?.ecosystems.flatMap((item) => collectStrings(item.membership.interests)) ?? []),
      ]),
    [data],
  );

  const domainsByEcosystem = useMemo(() => {
    const grouped = new Map<string, PublicProfileResponse["domains"]>();
    for (const domain of data?.domains ?? []) {
      const domains = grouped.get(domain.ecosystem.id) ?? [];
      domains.push(domain);
      grouped.set(domain.ecosystem.id, domains);
    }
    return grouped;
  }, [data]);

  const quizScopes = useMemo(() => {
    const ecosystems = new Map<
      string,
      {
        name: string;
        domains: Map<string, { name: string; quizzes: PublicProfileQuizResult[] }>;
      }
    >();

    for (const result of data?.quiz_results ?? []) {
      const ecosystemKey = result.ecosystem?.id ?? "network";
      const ecosystem = ecosystems.get(ecosystemKey) ?? {
        name: result.ecosystem?.name ?? "Network-wide",
        domains: new Map(),
      };
      const domainKey = result.domain?.id ?? "general";
      const domain = ecosystem.domains.get(domainKey) ?? {
        name: result.domain?.domain_id ?? "Ecosystem-wide",
        quizzes: [],
      };
      domain.quizzes.push(result);
      ecosystem.domains.set(domainKey, domain);
      ecosystems.set(ecosystemKey, ecosystem);
    }

    return [...ecosystems.entries()]
      .map(([id, ecosystem]) => ({
        id,
        name: ecosystem.name,
        domains: [...ecosystem.domains.entries()]
          .map(([domainId, domain]) => ({ id: domainId, ...domain }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const handleShare = async () => {
    if (!data) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${data.profile.display_name}'s profile`, url });
        return;
      } catch (shareError) {
        if (shareError instanceof Error && shareError.name === "AbortError") return;
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "Link copied", description: "The public profile link is ready to share." });
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-4 text-foreground">
        <div className="border border-foreground bg-card p-8 text-center">
          <Loader2 className="mx-auto mb-4 h-7 w-7 animate-spin motion-reduce:animate-none" />
          <p className="text-xs font-black uppercase tracking-[0.18em]">Loading public profile</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-4 text-foreground">
        <DossierCard className="w-full max-w-md p-8">
          <Compass className="mb-6 h-8 w-8" aria-hidden="true" />
          <h1 className="text-3xl font-black uppercase tracking-tight">Profile not found</h1>
          <p className="mt-3 text-muted-foreground">
            This member profile does not exist or could not be loaded.
          </p>
          <Button asChild variant="outline" className="mt-8 w-full border-foreground">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to the index
            </Link>
          </Button>
        </DossierCard>
      </div>
    );
  }

  const { profile } = data;
  const avatarUrl = resolveMediaUrl(profile.profile_picture);
  const initials =
    profile.display_name
      .split(/\s+/)
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";
  const website = resolveExternalUrl(profile.website);
  const linkedin = resolveExternalUrl(profile.social_links.linkedin);
  const github = resolveExternalUrl(profile.social_links.github);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-foreground bg-background">
        <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 text-xs font-black uppercase tracking-[0.16em]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            System index
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground sm:inline">
              Public member profile
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {data.is_owner && (
          <div className="flex flex-wrap items-center justify-between gap-3 border border-foreground bg-card p-4">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              You are viewing your public profile
            </span>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline" className="border-foreground">
                <Link href="/profile">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit profile
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/discover/shares-needs/new">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Publish
                </Link>
              </Button>
            </div>
          </div>
        )}

        <DossierCard>
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:p-10">
            <div className="flex min-w-0 flex-col items-start gap-6 sm:flex-row sm:gap-8">
              <Avatar className="h-28 w-28 rounded-none border border-foreground">
                <AvatarImage src={avatarUrl ?? ""} alt="" />
                <AvatarFallback className="rounded-none bg-foreground text-2xl font-black text-background">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  Member identity / public
                </p>
                <h1 className="break-words text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                  {profile.display_name}
                </h1>
                {profile.headline && (
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {profile.headline}
                  </p>
                )}
                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                  {profile.username && <span className="font-bold">@{profile.username}</span>}
                  {profile.location && (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <aside className="flex flex-col justify-between gap-6 border-t border-foreground pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <dl className="space-y-4 text-xs">
                <div>
                  <dt className="font-black uppercase tracking-[0.14em] text-muted-foreground">
                    Ecosystems
                  </dt>
                  <dd className="mt-1 text-xl font-black">{data.ecosystems.length}</dd>
                </div>
                <div>
                  <dt className="font-black uppercase tracking-[0.14em] text-muted-foreground">
                    Domains
                  </dt>
                  <dd className="mt-1 text-xl font-black">{data.domains.length}</dd>
                </div>
                <div>
                  <dt className="font-black uppercase tracking-[0.14em] text-muted-foreground">
                    Member since
                  </dt>
                  <dd className="mt-1 font-bold">
                    {new Date(profile.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              </dl>
              <Button size="sm" onClick={handleShare}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
                {copied ? "Copied" : "Share profile"}
              </Button>
            </aside>
          </div>

          {(profile.bio || website || linkedin || github) && (
            <div className="grid gap-6 border-t border-foreground p-6 sm:p-8 lg:grid-cols-[8rem_minmax(0,1fr)] lg:p-10">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                About
              </span>
              <div>
                {profile.bio && (
                  <p className="max-w-3xl whitespace-pre-wrap text-base leading-relaxed sm:text-lg">
                    {profile.bio}
                  </p>
                )}
                <div className="mt-5 flex flex-wrap gap-2">
                  {website && (
                    <Button asChild size="sm" variant="outline">
                      <a href={website} target="_blank" rel="noopener noreferrer">
                        <Globe className="mr-2 h-4 w-4" />
                        Website
                      </a>
                    </Button>
                  )}
                  {linkedin && (
                    <Button asChild size="sm" variant="outline">
                      <a href={linkedin} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="mr-2 h-4 w-4" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {github && (
                    <Button asChild size="sm" variant="outline">
                      <a href={github} target="_blank" rel="noopener noreferrer">
                        <Github className="mr-2 h-4 w-4" />
                        GitHub
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DossierCard>

        <div className="grid gap-6 xl:grid-cols-2">
          <DossierCard className="p-5 sm:p-8">
            <SectionLabel
              icon={Network}
              title="Ecosystems & domains"
              detail="The communities and working domains this member participates in."
            />
            {data.ecosystems.length ? (
              <div className="space-y-4">
                {data.ecosystems.map((ecosystem) => {
                  const domains = domainsByEcosystem.get(ecosystem.id) ?? [];
                  return (
                    <article key={ecosystem.id} className="border border-border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-black">{ecosystem.name}</h3>
                          {ecosystem.description && (
                            <p className="mt-1 text-sm text-muted-foreground">{ecosystem.description}</p>
                          )}
                        </div>
                        {ecosystem.membership.profile && (
                          <Badge variant="outline" className="capitalize">
                            {ecosystem.membership.profile.replaceAll("_", " ")}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {domains.length ? (
                          domains.map((domain) => (
                            <Badge key={domain.id} variant="secondary" title={domain.purpose ?? undefined}>
                              {domain.domain_id} · {domain.role}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No active domain memberships</span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No ecosystem memberships to display.</p>
            )}
          </DossierCard>

          <DossierCard className="p-5 sm:p-8">
            <SectionLabel
              icon={Target}
              title="Skills & interests"
              detail="Capabilities, learning goals, and areas of interest."
            />
            <div className="space-y-5">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                  Skills
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {skills.length ? (
                    skills.map((skill) => <Badge key={skill}>{skill}</Badge>)
                  ) : (
                    <span className="text-sm text-muted-foreground">No skills added yet.</span>
                  )}
                </div>
              </div>
              {skillsNeeded.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                    Developing
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {skillsNeeded.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {interests.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                    Interests
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {interests.map((interest) => (
                      <Badge key={interest} variant="secondary">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DossierCard>
        </div>

        <DossierCard className="p-5 sm:p-8">
          <SectionLabel
            icon={BriefcaseBusiness}
            title={`Projects (${profile.projects.length})`}
            detail="Work, initiatives, and collaborations this member has contributed to."
          />
          {profile.projects.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {profile.projects.map((project) => {
                const projectUrl = resolveExternalUrl(project.url);
                return (
                  <article key={project.id} className="flex min-h-48 flex-col border border-border p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-black">{project.name}</h3>
                      {projectUrl && (
                        <a
                          href={projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open ${project.name}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    {project.role && (
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                        {project.role}
                      </p>
                    )}
                    {project.description && (
                      <p className="mt-4 text-sm leading-6 text-muted-foreground">{project.description}</p>
                    )}
                    {(project.started_at || project.ended_at) && (
                      <p className="mt-auto pt-5 text-xs text-muted-foreground">
                        {project.started_at ?? "—"} — {project.ended_at ?? "Present"}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No projects added yet.</p>
          )}
        </DossierCard>

        <DossierCard className="p-5 sm:p-8">
          <SectionLabel
            icon={GraduationCap}
            title={`Completed quizzes (${data.quiz_results.length})`}
            detail="Completion records are grouped by the ecosystem and domain where each quiz is shown."
          />
          {quizScopes.length ? (
            <div className="space-y-7">
              {quizScopes.map((ecosystem) => (
                <div key={ecosystem.id}>
                  <h3 className="border-b border-border pb-2 text-lg font-black">{ecosystem.name}</h3>
                  <div className="mt-4 space-y-5">
                    {ecosystem.domains.map((domain) => (
                      <section key={domain.id}>
                        <h4 className="mb-3 text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">
                          {domain.name}
                        </h4>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {domain.quizzes.map((quiz) => (
                            <QuizCard key={quiz.quiz.id} item={quiz} />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No completed quizzes yet.</p>
          )}
        </DossierCard>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
          <DossierCard className="p-5 sm:p-8">
            <SectionLabel
              icon={HeartHandshake}
              title={`Published shares, needs & solutions (${data.publications.length})`}
              detail="Public signals authored by this member."
            />
            {data.publications.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {data.publications.map((publication) => (
                  <article key={publication.id} className="border border-border p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                          {publicationLabel(publication.type)}
                        </p>
                        <h3 className="mt-2 text-lg font-black">{publication.title}</h3>
                      </div>
                      {publication.category && (
                        <Badge variant="outline" className="capitalize">
                          {publication.category}
                        </Badge>
                      )}
                    </div>
                    {publication.description && (
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {publication.description}
                      </p>
                    )}
                    <p className="mt-4 text-xs text-muted-foreground">
                      {[publication.ecosystem_name, publication.domain_name].filter(Boolean).join(" · ")}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No public signals published yet.</p>
            )}
          </DossierCard>

          <DossierCard className="p-5 sm:p-8">
            <SectionLabel icon={Award} title={`Badges (${data.badges.length})`} />
            {data.badges.length ? (
              <div className="space-y-3">
                {data.badges.map((badge) => (
                  <div key={badge.id} className="flex items-start gap-3 border border-border p-4">
                    <Award className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <h3 className="font-black">{badge.badge_name}</h3>
                      {badge.badge_description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {badge.badge_description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No badges earned yet.</p>
            )}
          </DossierCard>
        </div>

        <footer className="flex flex-col justify-between gap-2 border-t border-foreground py-6 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground sm:flex-row">
          <p>
            Powered by <span className="text-foreground">Charting the Course</span>
          </p>
          <p>NEOS / Public member record</p>
        </footer>
      </main>
    </div>
  );
}
