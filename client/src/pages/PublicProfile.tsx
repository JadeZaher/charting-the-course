import { useState, useMemo } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft, Loader2 as LoaderIcon,
  Globe, Linkedin, Twitter, Github, Compass, Share2,
  Lock, Check, Settings, ChevronRight, Award, Edit
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProfileTile } from "@/components/profile/tiles";
import { useAuth } from "@/contexts/AuthContext";
import { getDimensionConfig } from "@/lib/dimensions";
import { fetchMember, fetchMemberBadges, fetchMemberTags, fetchMemberQuizHistory } from "@/lib/api-client";
import { iconMap } from "@/components/profile/tiles/BadgeTile";
import { resolveExternalUrl, resolveMediaUrl } from "@/lib/media";
import type { UserBadgeItem } from "@/types/api";

interface PublicProfileData {
  profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    avatar_url: string | null;
    cover_url: string | null;
    bio: string | null;
    headline: string | null;
    profile_visibility: string;
    social_links: any;
    profile_tags: string[];
    share_slug: string | null;
    created_at: string;
    profile_dimensions?: Record<string, any>;
  } | null;
  badges: UserBadgeItem[];
  tags: Array<{
    id: string;
    tag_key: string;
    tag_value: string;
    dimension: string | null;
  }>;
  quizResults: Array<{
    id: string;
    quiz_id: string;
    score: number;
    completed_at: string;
    quiz_title?: string;
    survey_results?: Record<string, any>;
    survey_json?: any;
  }>;
  privacy: {
    is_profile_public: boolean;
    show_badges: boolean;
    show_tags: boolean;
    show_quiz_results: boolean;
    allow_discovery: boolean;
  } | null;
}

// Dossier panel shared by public profile sections.
function CrystalCard({ children, className = "" }: {
  children: React.ReactNode;
  className?: string;
  featured?: boolean;
}) {
  return <section className={`border border-foreground bg-card ${className}`}>{children}</section>;
}

function SectionLabel({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4 border-b border-foreground pb-4">
      <span className="text-xs font-black uppercase tracking-[0.18em]">{title}</span>
      <Icon className="h-4 w-4" aria-hidden="true" />
    </div>
  );
}

// Quiz Result Card with questions and answers
function QuizResultCard({ result }: { result: PublicProfileData['quizResults'][0] }) {
  const [expanded, setExpanded] = useState(false);
  
  // Extract key takeaways from survey results
  const getKeyTakeaways = () => {
    if (!result.survey_results || !result.survey_json) return [];
    
    const takeaways: Array<{ question: string; answer: string }> = [];
    const surveyJson = typeof result.survey_json === 'string' 
      ? JSON.parse(result.survey_json) 
      : result.survey_json;
    
    // Get questions from survey JSON
    const pages = surveyJson?.pages || [];
    const allQuestions: any[] = [];
    
    pages.forEach((page: any) => {
      if (page.elements) {
        allQuestions.push(...page.elements);
      }
    });
    
    // Match answers to questions
    Object.entries(result.survey_results).forEach(([key, value]) => {
      const question = allQuestions.find(q => q.name === key);
      if (question && value) {
        let answerText = '';
        
        if (Array.isArray(value)) {
          answerText = value.join(', ');
        } else if (typeof value === 'object') {
          answerText = Object.entries(value)
            .filter(([_, v]) => v)
            .map(([k, v]) => typeof v === 'boolean' ? k : `${k}: ${v}`)
            .join(', ');
        } else {
          answerText = String(value);
        }
        
        if (answerText && answerText !== 'undefined') {
          takeaways.push({
            question: question.title || question.name,
            answer: answerText
          });
        }
      }
    });
    
    return takeaways.slice(0, expanded ? undefined : 3);
  };
  
  const takeaways = getKeyTakeaways();
  const hasMoreTakeaways = result.survey_results && Object.keys(result.survey_results).length > 3;
  
  // Get quiz type icon based on quiz title
  const getQuizTypeIcon = (title: string) => {
    const lowerTitle = (title || '').toLowerCase();
    if (lowerTitle.includes('personality') || lowerTitle.includes('style')) return '🎭';
    if (lowerTitle.includes('communication') || lowerTitle.includes('contact')) return '💬';
    if (lowerTitle.includes('collaboration') || lowerTitle.includes('team')) return '🤝';
    if (lowerTitle.includes('problem') || lowerTitle.includes('solving')) return '🧩';
    if (lowerTitle.includes('leadership') || lowerTitle.includes('leader')) return '👑';
    if (lowerTitle.includes('work') || lowerTitle.includes('values')) return '💼';
    if (lowerTitle.includes('travel') || lowerTitle.includes('location')) return '🌍';
    if (lowerTitle.includes('learning') || lowerTitle.includes('skill')) return '📚';
    if (lowerTitle.includes('creative') || lowerTitle.includes('innovation')) return '💡';
    return '📋'; // Default quiz icon
  };
  
  return (
    <CrystalCard>
      <div className="p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-5 border-b border-foreground pb-5">
          <div className="flex-1">
            <h4 className="mb-1 text-lg font-black uppercase tracking-tight text-foreground">{result.quiz_title || 'Quiz'}</h4>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Completed {new Date(result.completed_at).toLocaleDateString('en-US', { 
                month: 'short', day: 'numeric', year: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center border border-foreground bg-foreground text-background">
            <span className="text-xl" aria-hidden="true">{getQuizTypeIcon(result.quiz_title || '')}</span>
          </div>
        </div>
        
        {/* Key Takeaways */}
        {takeaways.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-foreground">Key takeaways</div>
            {takeaways.map((item, idx) => (
              <div key={idx} className="border border-border bg-muted/35 p-4">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{item.question}</p>
                <p className="text-sm leading-relaxed text-foreground">{item.answer}</p>
              </div>
            ))}
            
            {hasMoreTakeaways && (
              <button 
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 border-b border-foreground pb-0.5 text-xs font-black uppercase tracking-wide text-foreground transition-colors hover:text-muted-foreground motion-reduce:transition-none"
              >
                {expanded ? 'Show less' : 'Show more'}
                <ChevronRight className={`h-3 w-3 transition-transform motion-reduce:transition-none ${expanded ? 'rotate-90' : ''}`} />
              </button>
            )}
          </div>
        )}
        
        {/* Fallback if no parsed answers */}
        {takeaways.length === 0 && (
          <p className="text-sm italic text-muted-foreground">Quiz completed successfully</p>
        )}
      </div>
    </CrystalCard>
  );
}

export default function PublicProfile() {
  const [, params] = useRoute("/users/:username");
  const username = params?.username;
  const { toast } = useToast();
  const { member: user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error } = useQuery<PublicProfileData>({
    queryKey: ['public-profile', username],
    queryFn: async () => {
      if (!username) throw new Error('No username');

      // Fetch member by id or slug via the API
      const memberData = await fetchMember(username).catch(() => null);
      if (!memberData) throw new Error('Profile not found');

      const profile: PublicProfileData['profile'] = {
        id: (memberData as any).id,
        first_name: (memberData as any).display_name?.split(' ')[0] ?? null,
        last_name: (memberData as any).display_name?.split(' ').slice(1).join(' ') ?? null,
        username: (memberData as any).username ?? null,
        avatar_url: (memberData as any).avatar_url ?? null,
        cover_url: (memberData as any).cover_url ?? null,
        bio: (memberData as any).bio ?? null,
        headline: (memberData as any).headline ?? null,
        profile_visibility: (memberData as any).profile_visibility ?? 'public',
        social_links: (memberData as any).social_links ?? {},
        profile_tags: (memberData as any).profile_tags ?? [],
        share_slug: (memberData as any).share_slug ?? null,
        created_at: (memberData as any).created_at,
        profile_dimensions: (memberData as any).profile_dimensions,
      };

      if (profile?.profile_visibility === 'private') throw new Error('This profile is private');

      const memberId = profile.id;

      const [badgesResult, tagsResult, historyResult] = await Promise.all([
        fetchMemberBadges(memberId).catch(() => ({ badges: [] })),
        fetchMemberTags(memberId).catch(() => ({ tags: [] })),
        fetchMemberQuizHistory(memberId).catch(() => ({ results: [] })),
      ]);

      const badges = ((badgesResult as any).badges || []);
      const tags = ((tagsResult as any).tags || []);
      const quizResults = ((historyResult as any).results || []).slice(0, 10).map((r: any) => ({
        id: r.id,
        quiz_id: r.quiz_id,
        score: r.score,
        completed_at: r.completed_at,
        survey_results: r.survey_results ?? r.answers ?? {},
        quiz_title: r.quiz?.title ?? r.quiz_title,
        survey_json: r.quiz?.survey_json ?? r.survey_json,
      }));

      const privacy: PublicProfileData['privacy'] = (memberData as any).privacy
        ? {
            is_profile_public: (memberData as any).privacy.is_profile_public ?? true,
            show_badges: (memberData as any).privacy.show_badges ?? true,
            show_tags: (memberData as any).privacy.show_tags ?? true,
            show_quiz_results: (memberData as any).privacy.show_quiz_results ?? true,
            allow_discovery: (memberData as any).privacy.allow_discovery ?? true,
          }
        : null;

      return { profile, badges, tags, quizResults, privacy };
    },
    enabled: !!username,
  });

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${data?.profile?.first_name || 'User'}'s Profile`, url });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link copied!", description: "Profile link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isViewingOwnProfile = user?.id === data?.profile?.id;

  // Helper to extract values from profile dimensions JSON
  const extractValues = (obj: any): string[] => {
    const results: string[] = [];
    if (typeof obj === 'string' || typeof obj === 'number') {
      results.push(String(obj));
    } else if (Array.isArray(obj)) {
      obj.forEach(item => results.push(...extractValues(item)));
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(value => {
        results.push(...extractValues(value));
      });
    }
    return results;
  };

  // Convert legacy tags to tiles grouped by dimension
  const legacyTilesByDimension = useMemo(() => {
    const tilesByDim: Record<string, ProfileTile[]> = {};
    const timestamp = new Date().toISOString();
    
    // Helper to add tiles
    const addTile = (dim: string, items: any[], titleOverride?: string) => {
      if (!tilesByDim[dim]) tilesByDim[dim] = [];
      
      tilesByDim[dim].push({
        id: `legacy-tile-${dim}-${tilesByDim[dim].length}`,
        user_id: data?.profile?.id || '',
        submission_id: 'legacy',
        tile_type: 'list',
        dimension: dim,
        title: titleOverride || 'Key Traits',
        content: {
          items: items.map(t => ({ 
            label: t.tag_key || t.tag_value, 
            value: t.tag_key ? t.tag_value : undefined 
          }))
        },
        display_order: 999,
        is_visible: true,
        created_at: timestamp,
        updated_at: timestamp
      });
    };

    const tags = data?.tags || [];
    
    // If we have tags from the user_tags table, use them
    if (tags.length > 0) {
      const grouped = tags.reduce((acc, tag) => {
        const dim = tag.dimension || 'general';
        if (!acc[dim]) acc[dim] = [];
        acc[dim].push(tag);
        return acc;
      }, {} as Record<string, typeof tags>);
      
      Object.entries(grouped).forEach(([dim, items]) => addTile(dim, items, getDimensionConfig(dim).title));
      return tilesByDim;
    }

    // Fallback: Try to extract from profile_dimensions if user_tags is empty (likely due to RLS)
    
    // Priority 2: Fallback to profile_dimensions if user_tags is empty (likely due to RLS)
    const dimensions = data?.profile?.profile_dimensions;
    if (dimensions && Object.keys(dimensions).length > 0) {
      Object.entries(dimensions).forEach(([dim, content]) => {
        const values = extractValues(content);
        if (values.length > 0) {
          const items = values.map((val, i) => ({
            tag_key: val,
            tag_value: val
          }));
          addTile(dim, items, getDimensionConfig(dim).title);
        }
      });
      return tilesByDim;
    }

    return {};
  }, [data?.tags, data?.profile]);

  // Loading
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <div className="w-full max-w-sm border border-foreground bg-card p-8 text-center">
          <LoaderIcon className="mx-auto mb-5 h-7 w-7 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          <p className="text-xs font-black uppercase tracking-[0.18em]">Loading public dossier</p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !data?.profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <CrystalCard className="max-w-md w-full">
          <div className="p-8 sm:p-10">
            <div className="mb-8 flex items-center justify-between border-b border-foreground pb-5">
              <span className="text-xs font-black uppercase tracking-[0.18em]">Access status</span>
              <Lock className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mb-3 text-3xl font-black uppercase tracking-[-0.04em]">Profile not available</h2>
            <p className="mb-8 leading-relaxed text-muted-foreground">{(error as Error)?.message || "This profile doesn't exist or is private."}</p>
            <Button asChild variant="outline" className="w-full border-foreground">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Go Back
              </Link>
            </Button>
          </div>
        </CrystalCard>
      </div>
    );
  }

  const profile = data.profile;
  const coverUrl = resolveMediaUrl(profile.cover_url);
  const avatarUrl = resolveMediaUrl(profile.avatar_url);
  const socialLinks = {
    website: resolveExternalUrl(profile.social_links?.website),
    linkedin: resolveExternalUrl(profile.social_links?.linkedin),
    twitter: resolveExternalUrl(profile.social_links?.twitter),
    github: resolveExternalUrl(profile.social_links?.github),
  };
  const displayName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || 'Anonymous';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  
  const badges = data.badges || [];
  const showBadgesSection = badges.length > 0;
  const hasSocialLinks = Object.values(socialLinks).some(Boolean);
  const hasLegacyTiles = Object.keys(legacyTilesByDimension).length > 0;
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-foreground bg-background">
        <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-xs font-black uppercase tracking-[0.16em]">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            System index
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground sm:inline">Public dossier</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">

        {/* Own-profile action bar */}
        {isViewingOwnProfile && (
          <div className="flex flex-wrap items-center justify-between gap-3 border border-foreground bg-card p-3 sm:p-4">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Owner controls</span>
            <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="outline" className="border-foreground">
              <Link href="/profile">
                <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                Edit Profile
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-foreground">
              <Link href="/profile?tab=privacy">
                <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                Privacy Settings
              </Link>
            </Button>
            </div>
          </div>
        )}

        {/* Main Profile Card */}
        <CrystalCard featured>
          {coverUrl ? (
            <div className="relative h-40 overflow-hidden border-b border-foreground sm:h-56 lg:h-64">
              <img
                src={coverUrl}
                alt=""
                className="h-full w-full object-cover grayscale contrast-125 dark:brightness-75"
              />
              <div className="absolute left-0 top-0 bg-foreground px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-background">
                Member record / {profile.username || 'unlisted'}
              </div>
            </div>
          ) : (
            <div className="flex h-24 items-end border-b border-foreground bg-muted p-4">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Member record / {profile.username || 'unlisted'}</span>
            </div>
          )}
          <div className="p-5 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12">
              {/* Left: Avatar & Name */}
              <div className="flex min-w-0 flex-col items-start gap-6 sm:flex-row sm:gap-8">
                <div className="flex-shrink-0 border border-foreground bg-background p-1">
                  <Avatar className="h-24 w-24 rounded-none border border-foreground sm:h-28 sm:w-28">
                    <AvatarImage src={avatarUrl || ''} />
                    <AvatarFallback className="rounded-none bg-foreground text-2xl font-black text-background">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {/* Name & Info */}
                <div className="min-w-0 flex-1">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Identity / 01</p>
                  <h1 className="mb-2 break-words text-4xl font-black uppercase leading-[0.88] tracking-[-0.055em] sm:text-5xl lg:text-6xl">{displayName}</h1>
                  {profile.headline && (
                    <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{profile.headline}</p>
                  )}
                  
                  {/* Badge icons row */}
                  {badges.length > 0 && (
                    <div className="mt-5 flex flex-wrap items-center gap-1.5">
                      {badges.slice(0, 6).map(badge => {
                        const iconKey = (badge.badge_icon || 'award').toLowerCase();
                        const IconComponent = iconMap[iconKey] || Award;
                        return (
                          <span key={badge.id} className="inline-flex h-8 w-8 items-center justify-center border border-foreground bg-background" title={badge.badge_name}>
                            <IconComponent className="h-4 w-4" aria-hidden="true" />
                          </span>
                        );
                      })}
                      {badges.length > 6 && (
                        <span className="ml-1 text-xs font-black">+{badges.length - 6}</span>
                      )}
                    </div>
                  )}

                </div>
              </div>

              <aside className="flex flex-col justify-between gap-8 border-t border-foreground pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                <dl className="space-y-5 text-xs">
                  <div>
                    <dt className="font-black uppercase tracking-[0.16em] text-muted-foreground">Handle</dt>
                    <dd className="mt-1 break-all font-bold">@{profile.username || 'unlisted'}</dd>
                  </div>
                  <div>
                    <dt className="font-black uppercase tracking-[0.16em] text-muted-foreground">Member since</dt>
                    <dd className="mt-1 font-bold">{new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</dd>
                  </div>
                </dl>
                <Button size="sm" onClick={handleShare} className="w-full">
                  {copied ? <Check className="mr-2 h-4 w-4" aria-hidden="true" /> : <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />}
                  {copied ? 'Copied' : 'Share profile'}
                </Button>
              </aside>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-10 grid gap-3 border-t border-foreground pt-6 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-8">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Statement / 02</span>
                <p className="max-w-3xl text-base leading-relaxed sm:text-lg">{profile.bio}</p>
              </div>
            )}

            {/* Social Links */}
            {hasSocialLinks && (
              <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-foreground pt-6">
                <span className="mr-3 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">External links</span>
                {socialLinks.website && (
                  <a href={socialLinks.website} target="_blank" rel="noopener noreferrer"
                     aria-label="Visit website"
                     className="inline-flex h-11 w-11 items-center justify-center border border-foreground bg-background transition-colors hover:bg-foreground hover:text-background motion-reduce:transition-none">
                    <Globe className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                     aria-label="Visit LinkedIn profile"
                     className="inline-flex h-11 w-11 items-center justify-center border border-foreground bg-background transition-colors hover:bg-foreground hover:text-background motion-reduce:transition-none">
                    <Linkedin className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}
                {socialLinks.twitter && (
                  <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer"
                     aria-label="Visit X or Twitter profile"
                     className="inline-flex h-11 w-11 items-center justify-center border border-foreground bg-background transition-colors hover:bg-foreground hover:text-background motion-reduce:transition-none">
                    <Twitter className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}
                {socialLinks.github && (
                  <a href={socialLinks.github} target="_blank" rel="noopener noreferrer"
                     aria-label="Visit GitHub profile"
                     className="inline-flex h-11 w-11 items-center justify-center border border-foreground bg-background transition-colors hover:bg-foreground hover:text-background motion-reduce:transition-none">
                    <Github className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </div>
        </CrystalCard>

        {/* Badges Section */}
        {showBadgesSection && (
          <CrystalCard>
            <div className="p-5 sm:p-8">
              <SectionLabel icon={Award} title={`Badges & Achievements (${badges.length})`} />
              <div className="grid grid-cols-2 gap-px border border-foreground bg-foreground sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {badges.map(badge => {
                  const iconKey = (badge.badge_icon || 'award').toLowerCase();
                  const IconComponent = iconMap[iconKey] || Award;

                  return (
                    <div
                      key={badge.id}
                      className="flex min-h-32 flex-col items-start justify-between bg-card p-4 transition-colors hover:bg-muted motion-reduce:transition-none"
                      title={badge.badge_description || badge.badge_name}
                    >
                      <IconComponent className="mb-5 h-7 w-7" aria-hidden="true" />
                      <span className="line-clamp-2 text-left text-[10px] font-black uppercase tracking-[0.12em]">{badge.badge_name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CrystalCard>
        )}
        
            {/* Empty State */}
            {!showBadgesSection && !hasLegacyTiles && !profile.bio && (
              <CrystalCard>
                <div className="grid min-h-56 place-items-center p-8 text-center sm:p-12">
                  <div>
                    <Compass className="mx-auto mb-5 h-10 w-10" aria-hidden="true" />
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-muted-foreground">This user hasn't added any public information yet.</p>
                  </div>
                </div>
              </CrystalCard>
            )}

        {/* Footer */}
        <div className="flex flex-col justify-between gap-2 border-t border-foreground py-6 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground sm:flex-row">
          <p>
            Powered by <span className="text-foreground">Charting the Course</span>
          </p>
          <p>NEOS / Public record</p>
        </div>
      </main>
    </div>
  );
}
