import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BriefcaseBusiness,
  Check,
  Clipboard,
  ExternalLink,
  GraduationCap,
  Loader2,
  MapPin,
  Network,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { fetchMyPublicProfile, updateMyPublicProfile } from "@/lib/api-client";
import { resolveMediaUrl } from "@/lib/media";
import type { PublicProfileProject, PublicProfileResponse, SharesNeeds } from "@/types/api";

interface ProfileForm {
  displayName: string;
  username: string;
  headline: string;
  bio: string;
  location: string;
  website: string;
  profilePicture: string;
  linkedin: string;
  github: string;
  skills: string;
  interests: string;
}

const EMPTY_FORM: ProfileForm = {
  displayName: "",
  username: "",
  headline: "",
  bio: "",
  location: "",
  website: "",
  profilePicture: "",
  linkedin: "",
  github: "",
  skills: "",
  interests: "",
};

function splitList(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

function newProject(): PublicProfileProject {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `project-${Date.now()}`,
    name: "",
    description: null,
    url: null,
    role: null,
    started_at: null,
    ended_at: null,
  };
}

function publicationLabel(type: SharesNeeds["type"]) {
  if (type === "share") return "Share";
  if (type === "need") return "Need";
  return "Solution";
}

export default function Profile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [projects, setProjects] = useState<PublicProfileProject[]>([]);
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error } = useQuery<PublicProfileResponse>({
    queryKey: ["my-public-profile"],
    queryFn: fetchMyPublicProfile,
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      displayName: data.profile.display_name,
      username: data.profile.username ?? "",
      headline: data.profile.headline ?? "",
      bio: data.profile.bio ?? "",
      location: data.profile.location ?? "",
      website: data.profile.website ?? "",
      profilePicture: data.profile.profile_picture ?? "",
      linkedin: data.profile.social_links.linkedin ?? "",
      github: data.profile.social_links.github ?? "",
      skills: data.profile.skills.join(", "),
      interests: data.profile.interests.join(", "),
    });
    setProjects(data.profile.projects);
  }, [data]);

  const updateProfile = useMutation({
    mutationFn: updateMyPublicProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(["my-public-profile"], updated);
      queryClient.invalidateQueries({ queryKey: ["public-profile"] });
      toast({
        title: "Public profile saved",
        description: "Your changes are now visible to other users.",
      });
    },
    onError: (updateError: Error) => {
      toast({
        title: "Profile could not be saved",
        description: updateError.message,
        variant: "destructive",
      });
    },
  });

  const domainsByEcosystem = useMemo(() => {
    const grouped = new Map<string, PublicProfileResponse["domains"]>();
    for (const domain of data?.domains ?? []) {
      const domains = grouped.get(domain.ecosystem.id) ?? [];
      domains.push(domain);
      grouped.set(domain.ecosystem.id, domains);
    }
    return grouped;
  }, [data]);

  const completedQuizCount = data?.quiz_results.reduce(
    (total, group) => total + group.results.length,
    0,
  ) ?? 0;

  const profileHandle = data?.profile.username || data?.profile.id;
  const publicProfilePath = profileHandle
    ? `/users/${encodeURIComponent(profileHandle)}`
    : null;

  const setField = (field: keyof ProfileForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const setProjectField = (
    id: string,
    field: keyof PublicProfileProject,
    value: string,
  ) => {
    setProjects((current) =>
      current.map((project) =>
        project.id === id ? { ...project, [field]: value || null } : project,
      ),
    );
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    const displayName = form.displayName.trim();
    if (!displayName) {
      toast({
        title: "Display name is required",
        description: "Add the name you want other members to see.",
        variant: "destructive",
      });
      return;
    }

    const normalizedProjects = projects
      .filter((project) => project.name.trim())
      .map((project) => ({
        ...project,
        name: project.name.trim(),
        description: project.description?.trim() || null,
        role: project.role?.trim() || null,
        url: project.url?.trim() || null,
        started_at: project.started_at || null,
        ended_at: project.ended_at || null,
      }));

    updateProfile.mutate({
      display_name: displayName,
      username: form.username.trim() || null,
      headline: form.headline.trim() || null,
      bio: form.bio.trim() || null,
      location: form.location.trim() || null,
      website: form.website.trim() || null,
      profile_picture: form.profilePicture.trim() || null,
      social_links: {
        linkedin: form.linkedin.trim(),
        github: form.github.trim(),
      },
      skills: splitList(form.skills),
      interests: splitList(form.interests),
      projects: normalizedProjects,
    });
  };

  const handleCopy = async () => {
    if (!publicProfilePath) return;
    await navigator.clipboard.writeText(`${window.location.origin}${publicProfilePath}`);
    setCopied(true);
    toast({ title: "Profile link copied" });
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="grid min-h-72 place-items-center border border-foreground bg-card">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin motion-reduce:animate-none" />
          <p className="text-xs font-black uppercase tracking-[0.16em]">Loading profile</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="rounded-none border-destructive">
        <CardHeader>
          <CardTitle>Profile unavailable</CardTitle>
          <CardDescription>
            {(error as Error)?.message || "Your public profile could not be loaded."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const avatarUrl = resolveMediaUrl(data.profile.profile_picture);
  const initials =
    data.profile.display_name
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-foreground pb-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
            Member record
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.04em]">Your profile</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Your profile is always public to other users. Keep your biography, skills, projects,
            memberships, and published work current.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {publicProfilePath && (
            <Button asChild type="button" variant="outline">
              <Link href={publicProfilePath}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View public profile
              </Link>
            </Button>
          )}
          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save profile
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
        <Card className="rounded-none border-foreground">
          <CardHeader className="border-b border-foreground">
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              Public identity
            </CardTitle>
            <CardDescription>The introduction every profile visitor will see.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="flex items-center gap-4 border border-border p-4">
              <Avatar className="h-20 w-20 rounded-none border border-foreground">
                <AvatarImage src={avatarUrl ?? ""} alt="" />
                <AvatarFallback className="rounded-none bg-foreground text-xl font-black text-background">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-black">{data.profile.display_name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {data.profile.headline || "Add a headline that describes your work."}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Display name</Label>
                <Input
                  id="profile-name"
                  value={form.displayName}
                  onChange={(event) => setField("displayName", event.target.value)}
                  maxLength={255}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-username">Username</Label>
                <Input
                  id="profile-username"
                  value={form.username}
                  onChange={(event) => setField("username", event.target.value)}
                  maxLength={100}
                  placeholder="public-handle"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-headline">Headline</Label>
              <Input
                id="profile-headline"
                value={form.headline}
                onChange={(event) => setField("headline", event.target.value)}
                maxLength={255}
                placeholder="Community builder · Researcher · Systems designer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-bio">Biography</Label>
              <Textarea
                id="profile-bio"
                value={form.bio}
                onChange={(event) => setField("bio", event.target.value)}
                maxLength={4000}
                rows={7}
                placeholder="Share your background, focus, and the kind of work you want to do with others."
              />
              <p className="text-right text-xs text-muted-foreground">{form.bio.length}/4000</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-location">Location</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="profile-location"
                    value={form.location}
                    onChange={(event) => setField("location", event.target.value)}
                    className="pl-9"
                    maxLength={255}
                    placeholder="Denver, Colorado"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-avatar">Profile image URL</Label>
                <Input
                  id="profile-avatar"
                  type="url"
                  value={form.profilePicture}
                  onChange={(event) => setField("profilePicture", event.target.value)}
                  maxLength={500}
                  placeholder="https://…"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-none border-foreground">
            <CardHeader className="border-b border-foreground">
              <CardTitle>Public profile link</CardTitle>
              <CardDescription>This page cannot be made private.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={publicProfilePath ? `${window.location.origin}${publicProfilePath}` : ""}
                  aria-label="Public profile URL"
                />
                <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                  <span className="sr-only">Copy public profile link</span>
                </Button>
              </div>
              <div className="border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Authentication details, phone numbers, private notes, and raw quiz answers are never
                included on this page.
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-foreground">
            <CardHeader className="border-b border-foreground">
              <CardTitle>Links</CardTitle>
              <CardDescription>Professional profiles and a primary website.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="profile-website">Website</Label>
                <Input
                  id="profile-website"
                  type="url"
                  value={form.website}
                  onChange={(event) => setField("website", event.target.value)}
                  maxLength={500}
                  placeholder="https://your-site.example"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-linkedin">LinkedIn</Label>
                <Input
                  id="profile-linkedin"
                  type="url"
                  value={form.linkedin}
                  onChange={(event) => setField("linkedin", event.target.value)}
                  maxLength={500}
                  placeholder="https://linkedin.com/in/…"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-github">GitHub</Label>
                <Input
                  id="profile-github"
                  type="url"
                  value={form.github}
                  onChange={(event) => setField("github", event.target.value)}
                  maxLength={500}
                  placeholder="https://github.com/…"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-none border-foreground">
        <CardHeader className="border-b border-foreground">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Skills & interests
          </CardTitle>
          <CardDescription>Use comma-separated terms so they remain easy to scan.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 pt-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-skills">Skills</Label>
            <Textarea
              id="profile-skills"
              value={form.skills}
              onChange={(event) => setField("skills", event.target.value)}
              rows={4}
              placeholder="Facilitation, Data analysis, Community governance"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-interests">Interests</Label>
            <Textarea
              id="profile-interests"
              value={form.interests}
              onChange={(event) => setField("interests", event.target.value)}
              rows={4}
              placeholder="Bioregionalism, Shared infrastructure, Cooperative finance"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none border-foreground">
        <CardHeader className="border-b border-foreground">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BriefcaseBusiness className="h-5 w-5" />
                Projects
              </CardTitle>
              <CardDescription className="mt-1">
                Add current and past work as a LinkedIn-style project record.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={() => setProjects((items) => [...items, newProject()])}>
              <Plus className="mr-2 h-4 w-4" />
              Add project
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {projects.length ? (
            projects.map((project, index) => (
              <fieldset key={project.id} className="space-y-4 border border-border p-5">
                <div className="flex items-center justify-between gap-3">
                  <legend className="text-xs font-black uppercase tracking-[0.15em]">
                    Project {String(index + 1).padStart(2, "0")}
                  </legend>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setProjects((items) => items.filter((item) => item.id !== project.id))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove {project.name || "project"}</span>
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`project-name-${project.id}`}>Project name</Label>
                    <Input
                      id={`project-name-${project.id}`}
                      value={project.name}
                      onChange={(event) => setProjectField(project.id, "name", event.target.value)}
                      maxLength={255}
                      placeholder="Project or initiative"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`project-role-${project.id}`}>Your role</Label>
                    <Input
                      id={`project-role-${project.id}`}
                      value={project.role ?? ""}
                      onChange={(event) => setProjectField(project.id, "role", event.target.value)}
                      maxLength={255}
                      placeholder="Co-founder, contributor, researcher"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`project-description-${project.id}`}>Description</Label>
                  <Textarea
                    id={`project-description-${project.id}`}
                    value={project.description ?? ""}
                    onChange={(event) =>
                      setProjectField(project.id, "description", event.target.value)
                    }
                    maxLength={2000}
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor={`project-url-${project.id}`}>Project URL</Label>
                    <Input
                      id={`project-url-${project.id}`}
                      type="url"
                      value={project.url ?? ""}
                      onChange={(event) => setProjectField(project.id, "url", event.target.value)}
                      maxLength={500}
                      placeholder="https://…"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`project-start-${project.id}`}>Started</Label>
                    <Input
                      id={`project-start-${project.id}`}
                      type="date"
                      value={project.started_at ?? ""}
                      onChange={(event) =>
                        setProjectField(project.id, "started_at", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`project-end-${project.id}`}>Ended</Label>
                    <Input
                      id={`project-end-${project.id}`}
                      type="date"
                      value={project.ended_at ?? ""}
                      onChange={(event) =>
                        setProjectField(project.id, "ended_at", event.target.value)
                      }
                    />
                  </div>
                </div>
              </fieldset>
            ))
          ) : (
            <div className="border border-dashed border-foreground p-8 text-center">
              <p className="font-black">No projects added yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a project to show what you have built or contributed to.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-none border-foreground">
          <CardHeader className="border-b border-foreground">
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Ecosystems & domains
            </CardTitle>
            <CardDescription>Memberships are managed by each ecosystem.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {data.ecosystems.length ? (
              data.ecosystems.map((ecosystem) => {
                const domains = domainsByEcosystem.get(ecosystem.id) ?? [];
                return (
                  <article key={ecosystem.id} className="border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-black">{ecosystem.name}</h3>
                        {ecosystem.location && (
                          <p className="mt-1 text-xs text-muted-foreground">{ecosystem.location}</p>
                        )}
                      </div>
                      {ecosystem.membership.profile && (
                        <Badge variant="outline" className="capitalize">
                          {ecosystem.membership.profile.replaceAll("_", " ")}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {domains.length ? (
                        domains.map((domain) => (
                          <Badge key={domain.id} variant="secondary">
                            {domain.domain_id} · {domain.role}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No active domains</span>
                      )}
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No ecosystem memberships yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-none border-foreground">
          <CardHeader className="border-b border-foreground">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Quiz achievements
                </CardTitle>
                <CardDescription className="mt-1">
                  {data.quiz_results.length} quizzes · {completedQuizCount} completed attempts
                </CardDescription>
              </div>
              <Button asChild type="button" variant="outline" size="sm">
                <Link href="/my-quiz-history">View history</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {data.quiz_results.length ? (
              data.quiz_results.slice(0, 6).map((group) => (
                <div key={group.quiz.id} className="flex items-start justify-between gap-4 border border-border p-4">
                  <div>
                    <h3 className="font-black">{group.quiz.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[group.ecosystem?.name, group.domain?.domain_id]
                        .filter(Boolean)
                        .join(" · ") || "Network-wide"}
                    </p>
                  </div>
                  <Badge variant="secondary">{group.results.length}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No completed quizzes yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-none border-foreground">
        <CardHeader className="border-b border-foreground">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Your shares, needs & solutions
              </CardTitle>
              <CardDescription className="mt-1">
                Public active signals are included on your profile.
              </CardDescription>
            </div>
            <Button asChild type="button">
              <Link href="/discover/shares-needs/new">
                <Plus className="mr-2 h-4 w-4" />
                Publish
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {data.publications.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.publications.map((publication) => (
                <article key={publication.id} className="border border-border p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-black">{publication.title}</h3>
                    <Badge variant="outline">{publicationLabel(publication.type)}</Badge>
                  </div>
                  {publication.description && (
                    <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                      {publication.description}
                    </p>
                  )}
                  <p className="mt-4 text-xs text-muted-foreground">
                    {[publication.ecosystem_name, publication.domain_name]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-foreground p-8 text-center">
              <p className="font-black">You have not published a signal yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Share a capability, name a need, or publish a solution.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-none border-foreground">
        <CardHeader className="border-b border-foreground">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Badges
          </CardTitle>
          <CardDescription>Achievements earned across your ecosystem memberships.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {data.badges.length ? (
            <div className="flex flex-wrap gap-2">
              {data.badges.map((badge) => (
                <Badge key={badge.id} variant="secondary" title={badge.badge_description ?? undefined}>
                  {badge.badge_name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No badges earned yet.</p>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
