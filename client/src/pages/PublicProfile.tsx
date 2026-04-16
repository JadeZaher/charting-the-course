import { useState, useEffect, useRef, useMemo } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft, Sparkles, Heart, Target, Loader2 as LoaderIcon,
  Globe, Linkedin, Twitter, Github, Compass, Share2,
  ExternalLink, Lock, Copy, Check, Settings, Link2, ChevronRight,
  Users, Award, Edit
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TileGrid, ProfileTile } from "@/components/profile/tiles";
import { calculateAlignment, createAlignmentTile } from "@/lib/alignment";
import { useAuth } from "@/contexts/AuthContext";
import { DIMENSION_CONFIGS, getDimensionConfig } from "@/lib/dimensions";
import { fetchMember, fetchMemberBadges, fetchMemberTags, fetchMemberQuizHistory } from "@/lib/api-client";
import { iconMap } from "@/components/profile/tiles/BadgeTile";

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
  badges: Array<{
    id: string;
    badge_key: string;
    badge_name: string;
    badge_description: string | null;
    badge_icon: string | null;
    badge_color: string | null;
    badge_category: string | null;
    earned_at: string;
  }>;
  tags: Array<{
    id: string;
    tag_key: string;
    tag_value: string;
    dimension: string | null;
  }>;
  tiles: ProfileTile[];
  agreements: Array<{
    id: string;
    agreement_key: string;
    agreement_statement: string;
    agreement_category: string | null;
    source_quiz_id: string;
    quiz_title?: string;
    created_at: string;
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

// Crystal glass card with visible frosted border and subtle hover glow
function CrystalCard({ children, className = "", featured = false }: { 
  children: React.ReactNode; 
  className?: string;
  featured?: boolean;
}) {
  return (
    <div className={`relative group ${className}`}>
      {/* Subtle hover glow effect - minimal spread */}
      <div className={`
        absolute inset-0 rounded-2xl transition-all duration-300 ease-out
        opacity-0 group-hover:opacity-100 group-hover:-inset-1 group-hover:blur-md
        bg-gradient-to-br from-cyan-500/20 via-teal-400/15 to-emerald-500/20
      `} />
      
      {/* Crystal border frame */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        {/* Top edge highlight */}
        <div className="absolute top-0 left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-white/60 to-transparent transition-colors duration-300 group-hover:via-cyan-300/70" />
        {/* Left edge highlight */}
        <div className="absolute top-4 bottom-4 left-0 w-[2px] bg-gradient-to-b from-transparent via-white/40 to-transparent transition-colors duration-300 group-hover:via-cyan-300/50" />
        {/* Right edge highlight */}
        <div className="absolute top-4 bottom-4 right-0 w-[2px] bg-gradient-to-b from-transparent via-white/30 to-transparent transition-colors duration-300 group-hover:via-teal-300/40" />
        {/* Bottom edge */}
        <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-colors duration-300 group-hover:via-teal-300/30" />
        
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-6 h-6">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-white/70 to-transparent transition-colors duration-300 group-hover:from-cyan-400/80" />
          <div className="absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-white/70 to-transparent transition-colors duration-300 group-hover:from-cyan-400/80" />
        </div>
        <div className="absolute top-0 right-0 w-6 h-6">
          <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-white/70 to-transparent transition-colors duration-300 group-hover:from-teal-400/80" />
          <div className="absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-white/70 to-transparent transition-colors duration-300 group-hover:from-teal-400/80" />
        </div>
        <div className="absolute bottom-0 left-0 w-6 h-6">
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-white/40 to-transparent transition-colors duration-300 group-hover:from-emerald-400/60" />
          <div className="absolute bottom-0 left-0 h-full w-[2px] bg-gradient-to-t from-white/40 to-transparent transition-colors duration-300 group-hover:from-emerald-400/60" />
        </div>
        <div className="absolute bottom-0 right-0 w-6 h-6">
          <div className="absolute bottom-0 right-0 w-full h-[1px] bg-gradient-to-l from-white/40 to-transparent transition-colors duration-300 group-hover:from-teal-400/60" />
          <div className="absolute bottom-0 right-0 h-full w-[2px] bg-gradient-to-t from-white/40 to-transparent transition-colors duration-300 group-hover:from-teal-400/60" />
        </div>
      </div>
      
      {/* Main card background */}
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl border border-white/10 overflow-hidden transition-all duration-300 group-hover:border-cyan-500/20">
        {/* Inner top highlight */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}

// Section title with icon
function SectionLabel({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-cyan-400" />
      <span className="text-xs font-semibold uppercase tracking-wider text-white/70">{title}</span>
    </div>
  );
}

// Tag pill component
function TagPill({ children, variant = "default" }: { 
  children: React.ReactNode; 
  variant?: "default" | "cyan" | "emerald" | "amber" | "rose";
}) {
  const variants = {
    default: "bg-white/10 text-white/80 border-white/20",
    cyan: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    rose: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  };
  
  return (
    <span className={`
      inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium
      border backdrop-blur-sm
      ${variants[variant]}
    `}>
      {children}
    </span>
  );
}

// Crystal decoration SVG with 3D animation
function CrystalDecoration({ 
  className = "", 
  rotateY = 0,
  floatOffset = 0,
  glowIntensity = 1
}: { 
  className?: string;
  rotateY?: number;
  floatOffset?: number;
  glowIntensity?: number;
}) {
  return (
    <div 
      className={`transition-transform duration-75 ${className}`}
      style={{
        transform: `perspective(1000px) rotateY(${rotateY}deg) translateY(${floatOffset}px)`,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Glow effect behind crystal */}
      <div 
        className="absolute inset-0 blur-xl rounded-full"
        style={{
          background: `radial-gradient(ellipse, rgba(34, 211, 238, ${0.3 * glowIntensity}), transparent 70%)`,
          transform: 'translateZ(-20px) scale(1.5)',
        }}
      />
      <svg viewBox="0 0 80 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative">
        <defs>
          <linearGradient id="crystalMain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(34, 211, 238, 0.6)" />
            <stop offset="50%" stopColor="rgba(20, 184, 166, 0.4)" />
            <stop offset="100%" stopColor="rgba(16, 185, 129, 0.3)" />
          </linearGradient>
          <linearGradient id="crystalHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.7)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </linearGradient>
          <linearGradient id="crystalShine" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.5)" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0.1)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </linearGradient>
          <filter id="crystalGlow">
            <feGaussianBlur stdDeviation="2" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Main crystal body */}
        <path 
          d="M40 5 L70 50 L65 140 L40 195 L15 140 L10 50 Z" 
          fill="url(#crystalMain)" 
          filter="url(#crystalGlow)"
        />
        {/* Crystal edges with glow */}
        <path 
          d="M40 5 L70 50 L65 140 L40 195 L15 140 L10 50 Z" 
          stroke="rgba(34, 211, 238, 0.6)" 
          strokeWidth="1.5" 
          fill="none" 
        />
        {/* Internal facets */}
        <path d="M40 5 L40 195" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
        <path d="M10 50 L70 50" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
        <path d="M15 140 L65 140" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
        <path d="M40 5 L15 140" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        <path d="M40 5 L65 140" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        <path d="M40 50 L10 50" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        <path d="M40 50 L15 140" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        {/* Highlight shine */}
        <path d="M25 20 L35 15 L50 40 L30 60 Z" fill="url(#crystalHighlight)" />
        {/* Additional shine based on rotation */}
        <path d="M50 30 L60 45 L55 80 L45 60 Z" fill="url(#crystalShine)" opacity="0.6" />
      </svg>
    </div>
  );
}

// Animated crystal container with scroll effects and idle heartbeat
function AnimatedCrystals({ scrollY, isScrolling }: { scrollY: number; isScrolling: boolean }) {
  const [idleTime, setIdleTime] = useState(0);
  
  // Idle animation timer
  useEffect(() => {
    if (!isScrolling) {
      const interval = setInterval(() => {
        setIdleTime(t => t + 16); // ~60fps
      }, 16);
      return () => clearInterval(interval);
    } else {
      setIdleTime(0);
    }
  }, [isScrolling]);

  // Orbit angle based on scroll (crystals rotate around each other)
  const orbitAngle = scrollY * 0.15; // Degrees of orbit rotation
  
  // Orbit radius and positions for 3 crystals rotating around center
  const orbitRadius = 50;
  const crystalConfigs = [
    { 
      angle: orbitAngle, 
      size: 'w-20 h-48', 
      opacity: 1,
      orbitR: orbitRadius,
      zOffset: 0 
    },
    { 
      angle: orbitAngle + 120, 
      size: 'w-14 h-36', 
      opacity: 0.75,
      orbitR: orbitRadius * 0.8,
      zOffset: -30 
    },
    { 
      angle: orbitAngle + 240, 
      size: 'w-10 h-28', 
      opacity: 0.55,
      orbitR: orbitRadius * 0.6,
      zOffset: -60 
    },
  ];

  // Idle vertical float (2-3 pixels up/down)
  const idleFloat = isScrolling 
    ? 0 
    : Math.sin(idleTime * 0.002) * 3;
  
  // Light glow effect
  const glowIntensity = isScrolling 
    ? 0.5 + Math.sin(scrollY * 0.005) * 0.2
    : 0.4 + Math.sin(idleTime * 0.003) * 0.15;

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 pointer-events-none hidden lg:block z-20">
      {/* Crystal orbit container */}
      <div 
        className="relative w-40 h-64"
        style={{
          transform: `translateY(${idleFloat}px)`,
          transition: isScrolling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {/* Orbiting crystals */}
        {crystalConfigs.map((config, index) => {
          // Convert angle to radians for position calculation
          const angleRad = (config.angle * Math.PI) / 180;
          
          // Calculate X position based on orbit (horizontal movement)
          const xPos = Math.cos(angleRad) * config.orbitR;
          // Y position is more subtle (creates 3D feel)
          const yPos = Math.sin(angleRad) * (config.orbitR * 0.3);
          // Z for depth effect (crystals in front/back)
          const zPos = Math.sin(angleRad) * 50 + config.zOffset;
          
          // Rotation changes as crystal orbits
          const rotateY = isScrolling 
            ? Math.sin(angleRad) * 45 // More rotation when scrolling
            : Math.sin(idleTime * 0.001 + index) * 5; // Gentle sway when idle
          
          return (
            <div
              key={index}
              className="absolute left-1/2 top-1/2"
              style={{
                transform: `
                  translateX(${xPos - 40}px) 
                  translateY(${yPos - 80}px) 
                  translateZ(${zPos}px)
                `,
                zIndex: Math.round(50 + zPos),
                opacity: config.opacity,
                transition: isScrolling ? 'transform 0.05s linear' : 'transform 0.3s ease-out',
              }}
            >
              <CrystalDecoration 
                className={config.size}
                rotateY={rotateY} 
                floatOffset={0}
                glowIntensity={glowIntensity * config.opacity}
              />
            </div>
          );
        })}
        
        {/* Center glow effect */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(ellipse, rgba(34, 211, 238, ${0.15 * glowIntensity}), transparent 70%)`,
          }}
        />
      </div>
      
      {/* Floating particles around crystals */}
      <div className="absolute -inset-8 overflow-hidden">
        {[...Array(15)].map((_, i) => {
          const particleAngle = ((scrollY * 0.1) + (i * 24)) * (Math.PI / 180);
          const particleRadius = 60 + (i % 3) * 20;
          const px = Math.cos(particleAngle) * particleRadius + 80;
          const py = Math.sin(particleAngle) * particleRadius * 0.5 + 120;
          
          return (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full"
              style={{
                left: `${px}px`,
                top: `${py}px`,
                opacity: isScrolling 
                  ? 0.4 + Math.sin(scrollY * 0.01 + i) * 0.3
                  : 0.2 + Math.sin(idleTime * 0.003 + i * 0.5) * 0.3,
                transform: `scale(${0.5 + (i % 3) * 0.3})`,
                boxShadow: '0 0 4px rgba(34, 211, 238, 0.8)',
                transition: isScrolling ? 'none' : 'all 0.3s ease-out',
              }}
            />
          );
        })}
      </div>
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
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h4 className="font-semibold text-white mb-1">{result.quiz_title || 'Quiz'}</h4>
            <p className="text-xs text-white/40">
              Completed {new Date(result.completed_at).toLocaleDateString('en-US', { 
                month: 'short', day: 'numeric', year: 'numeric' 
              })}
            </p>
          </div>
          {/* Quiz type icon instead of percentage */}
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30">
            <span className="text-xl">{getQuizTypeIcon(result.quiz_title || '')}</span>
          </div>
        </div>
        
        {/* Key Takeaways */}
        {takeaways.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-medium text-cyan-400 uppercase tracking-wider">Key Takeaways</div>
            {takeaways.map((item, idx) => (
              <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/5">
                <p className="text-xs text-white/50 mb-1">{item.question}</p>
                <p className="text-sm text-white/90">{item.answer}</p>
              </div>
            ))}
            
            {hasMoreTakeaways && (
              <button 
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {expanded ? 'Show less' : 'Show more'}
                <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
              </button>
            )}
          </div>
        )}
        
        {/* Fallback if no parsed answers */}
        {takeaways.length === 0 && (
          <p className="text-sm text-white/50 italic">Quiz completed successfully</p>
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
  const [scrollY, setScrollY] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track scroll position and activity for crystal animation
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setIsScrolling(true);
      
      // Clear previous timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set scrolling to false after 150ms of no scroll
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

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

      // Agreements - TODO: fetch from Sanic API when agreements per-member endpoint is available
      const agreements: any[] = [];

      // Profile tiles - TODO: fetch from Sanic API when member tiles endpoint is available
      const tiles: ProfileTile[] = [];

      const privacy: PublicProfileData['privacy'] = (memberData as any).privacy
        ? {
            is_profile_public: (memberData as any).privacy.is_profile_public ?? true,
            show_badges: (memberData as any).privacy.show_badges ?? true,
            show_tags: (memberData as any).privacy.show_tags ?? true,
            show_quiz_results: (memberData as any).privacy.show_quiz_results ?? true,
            allow_discovery: (memberData as any).privacy.allow_discovery ?? true,
          }
        : null;

      return { profile, badges, tags, tiles, agreements, quizResults, privacy };
    },
    enabled: !!username,
  });

  // Viewer tiles for alignment — TODO: fetch from Sanic API when tiles endpoint is available
  const viewerTiles: ProfileTile[] = [];

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

  // Calculate alignment if viewer is logged in and not viewing own profile
  const isViewingOwnProfile = user?.id === data?.profile?.id;
  const alignment = (!isViewingOwnProfile && viewerTiles && viewerTiles.length > 0 && data?.tiles && data.tiles.length > 0)
    ? calculateAlignment(viewerTiles, data.tiles)
    : null;
    
  const alignmentTile = alignment ? createAlignmentTile(alignment) : null;
  
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

  // Merge legacy badges and tags into tiles for unified display
  const mergedTiles = useMemo(() => {
    if (!data?.profile) return [];

    // Legacy badges are no longer converted to tiles for this view.
    // The "Badges & Achievements" section will now only show tile-based badges.
    return [...(data.tiles || [])];
  }, [data]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500/30 to-teal-500/30 animate-pulse border border-cyan-500/30" />
          <p className="text-white/60">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !data?.profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 flex items-center justify-center p-4">
        <CrystalCard className="max-w-md w-full">
          <div className="p-8 text-center">
            <Lock className="h-16 w-16 mx-auto mb-4 text-cyan-400/50" />
            <h2 className="text-xl font-bold text-white mb-2">Profile Not Available</h2>
            <p className="text-white/60 mb-6">{(error as Error)?.message || "This profile doesn't exist or is private."}</p>
            <Link href="/">
              <Button variant="outline" className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
            </Button>
          </Link>
        </div>
        </CrystalCard>
      </div>
    );
  }

  const profile = data.profile;
  const privacy = data.privacy;
  const displayName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || 'Anonymous';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  
  const allTiles = mergedTiles;
  const badgeTiles = allTiles.filter(t => t.tile_type === 'badge');
  const insightTiles = allTiles.filter(t => t.tile_type !== 'badge');

  const displayInsightTiles = alignmentTile ? [alignmentTile, ...insightTiles] : insightTiles;
  const tilesByDimension = (displayInsightTiles || []).reduce((acc, tile) => {
    const dim = tile.dimension || 'general';
    if (!acc[dim]) {
      acc[dim] = [];
    }
    acc[dim].push(tile);
    return acc;
  }, {} as Record<string, ProfileTile[]>);

  const dimensionOrder = Object.keys(DIMENSION_CONFIGS);
  const sortedDimensions = Object.keys(tilesByDimension).sort((a, b) => {
    const indexA = dimensionOrder.indexOf(a);
    const indexB = dimensionOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b); // both are custom
    if (indexA === -1) return 1; // custom dimensions at the end
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
  const showBadgesSection = badgeTiles.length > 0;
  const showInsightsSection = displayInsightTiles.length > 0;
  const hasSocialLinks = profile.social_links && Object.values(profile.social_links).some(v => v);
  const hasLegacyTiles = Object.keys(legacyTilesByDimension).length > 0;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 relative overflow-hidden">
      {/* Aurora background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[800px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[150px]" />
      </div>
      
      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(80)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.1,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Animated Crystal decorations - sticky and 3D rotating on scroll */}
      <AnimatedCrystals scrollY={scrollY} isScrolling={isScrolling} />
      
      <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-6 space-y-4">

        {/* Own-profile action bar */}
        {isViewingOwnProfile && (
          <div className="flex items-center justify-end gap-2">
            <Link href="/profile">
              <Button size="sm" variant="outline" className="border-white/20 text-white/80 hover:bg-white/10">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </Link>
            <Link href="/profile?tab=privacy">
              <Button size="sm" variant="outline" className="border-white/20 text-white/80 hover:bg-white/10">
                <Settings className="h-4 w-4 mr-2" />
                Privacy Settings
              </Button>
            </Link>
          </div>
        )}

        {/* Main Profile Card */}
        <CrystalCard featured>
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left: Avatar & Name */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 flex-1">
                {/* Avatar with glow */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/40 to-teal-400/40 rounded-full blur-xl scale-110" />
                  <Avatar className="relative h-24 w-24 border-2 border-white/30 shadow-2xl">
                    <AvatarImage src={profile.avatar_url || ''} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {/* Name & Info */}
                <div className="text-center sm:text-left flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{displayName}</h1>
                  {profile.headline && (
                    <p className="text-cyan-300/80 mb-2">{profile.headline}</p>
                  )}
                  
                  {/* Badge icons row */}
                  {badgeTiles.length > 0 && (
                    <div className="flex items-center justify-center sm:justify-start gap-1 mb-3 flex-wrap">
                      {badgeTiles.slice(0, 6).map(tile => {
                        const iconKey = (tile.content.badge_icon as string || 'award').toLowerCase();
                        const IconComponent = iconMap[iconKey] || Award;
                        return (
                          <span key={tile.id} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10" title={tile.title}>
                            <IconComponent className="w-3.5 h-3.5 text-cyan-400" />
                          </span>
                        );
                      })}
                      {badgeTiles.length > 6 && (
                        <span className="text-xs text-white/40 ml-1">+{badgeTiles.length - 6}</span>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Button 
                      size="sm"
                      onClick={handleShare}
                      className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-500 hover:to-teal-500 border-0"
                    >
                      {copied ? <Check className="h-3 w-3 mr-1" /> : <Share2 className="h-3 w-3 mr-1" />}
                      {copied ? 'Copied!' : 'Share Profile'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-white/70 text-sm mt-4 pt-4 border-t border-white/10">{profile.bio}</p>
            )}

            {/* Social Links */}
            {hasSocialLinks && (
              <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-white/10">
                {profile.social_links?.website && (
                  <a href={profile.social_links.website} target="_blank" rel="noopener noreferrer" 
                     className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                    <Globe className="h-4 w-4 text-white/60" />
                  </a>
                )}
                {profile.social_links?.linkedin && (
                  <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer"
                     className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                    <Linkedin className="h-4 w-4 text-white/60" />
                  </a>
                )}
                {profile.social_links?.twitter && (
                  <a href={profile.social_links.twitter} target="_blank" rel="noopener noreferrer"
                     className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                    <Twitter className="h-4 w-4 text-white/60" />
                  </a>
                )}
                {profile.social_links?.github && (
                  <a href={profile.social_links.github} target="_blank" rel="noopener noreferrer"
                     className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                    <Github className="h-4 w-4 text-white/60" />
                  </a>
                )}
              </div>
            )}
          </div>
        </CrystalCard>

        {/* Badges Section */}
        {showBadgesSection && (
          <CrystalCard>
            <div className="p-4">
              <SectionLabel icon={Award} title={`Badges & Achievements (${badgeTiles.length})`} />
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                
                {/* New Badge Tiles */}
                {badgeTiles.map(tile => {
                  const iconKey = (tile.content.badge_icon as string || 'award').toLowerCase();
                  const IconComponent = iconMap[iconKey] || Award;
                  
                  return (
                    <div
                      key={tile.id}
                      className="flex flex-col items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105 cursor-pointer"
                      title={(tile.content.badge_description as string) || tile.title}
                    >
                      <IconComponent className="w-8 h-8 text-cyan-400 mb-1" />
                      <span className="text-[10px] text-white/70 text-center line-clamp-2">{tile.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CrystalCard>
        )}

        {/* Profile Insights Section - Grouped by Dimension */}
        {showInsightsSection && (
          <div className="space-y-4">
            {isLoading ? (
              <CrystalCard>
                <div className="p-8 text-center text-white/60">
                  <LoaderIcon className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading insights...
                </div>
              </CrystalCard>
            ) : sortedDimensions.map(dim => {
              const config = getDimensionConfig(dim);
              const tiles = tilesByDimension[dim];
              if (!tiles || tiles.length === 0) return null;

              return (
                <CrystalCard key={dim}>
                  <div className="p-4">
                    <SectionLabel icon={config.icon} title={config.title} />
                    <div className="[&_.grid]:grid-cols-1 [&_.grid]:md:grid-cols-2 [&_.grid]:lg:grid-cols-3 [&_>div>div]:bg-white/5 [&_>div>div]:border-white/10 [&_>div>div]:text-white [&_h3]:text-white [&_p]:text-white/70">
                      <TileGrid 
                        tiles={tiles} 
                        isOwner={false}
                      />
                    </div>
                  </div>
                </CrystalCard>
              );
            })}
          </div>
        )}
        
            {/* Empty State */}
            {!showBadgesSection && !hasLegacyTiles && !showInsightsSection && !profile.bio && (
              <CrystalCard>
                <div className="p-8 text-center">
                  <Compass className="h-12 w-12 mx-auto mb-4 text-cyan-400/30" />
                  <p className="text-white/50">This user hasn't added any public information yet.</p>
                </div>
              </CrystalCard>
            )}

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-xs text-white/30">
            Powered by <span className="text-cyan-400/60">Charting the Course</span>
          </p>
        </div>
      </div>

      {/* CSS for star twinkle animation */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
