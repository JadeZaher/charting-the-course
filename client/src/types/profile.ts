// Profile Types for Phase 4

export type ProfileVisibility = 'public' | 'private' | 'link-only';

export interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  instagram?: string;
  youtube?: string;
  discord?: string;
  [key: string]: string | undefined;
}

export interface LocationData {
  continentsVisited?: string[];
  travelFrequency?: string;
  travelMotivation?: string[];
  locationPrivacy?: string;
  identitySensitivity?: string;
  meetupPreferences?: string[];
  communityActivities?: string[];
  [key: string]: unknown;
}

export interface ContactData {
  preferredMethods?: string[];
  communicationStyle?: string;
  responseTime?: string;
  energizingMethods?: string[];
  drainingMethods?: string[];
  boundaries?: string[];
  privacyLevel?: string;
  [key: string]: unknown;
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  location_data: LocationData | null;
  contact_data: ContactData | null;
  profile_visibility: ProfileVisibility;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface EnhancedProfile extends Profile {
  cover_url: string | null;
  headline: string | null;
  social_links: SocialLinks | null;
  share_slug: string | null;
  profile_tags: string[] | null;
}

export interface UpdateEnhancedProfileRequest {
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  headline?: string | null;
  social_links?: SocialLinks | null;
  share_slug?: string | null;
  profile_tags?: string[] | null;
  location_data?: LocationData | null;
  contact_data?: ContactData | null;
  profile_visibility?: ProfileVisibility;
}

export interface ProfileShareLink {
  id: string;
  user_id: string;
  share_token: string;
  is_active: boolean;
  expires_at: string | null;
  view_count: number;
  show_badges: boolean;
  show_achievements: boolean;
  show_stats: boolean;
  show_quiz_history: boolean;
  created_at: string;
  last_viewed_at: string | null;
}

export interface PublicProfileResponse {
  profile: {
    id: string;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    cover_url: string | null;
    headline: string | null;
    bio: string | null;
    social_links: SocialLinks | null;
    profile_tags: string[] | null;
  };
  stats: {
    total_quizzes_completed: number;
    total_badges_earned: number;
    current_level: number;
    level_name: string;
    level_icon: string | null;
    total_xp: number;
  } | null;
  badges: import('./badges').UserBadge[] | null;
  achievements: import('./achievements').UserAchievement[] | null;
  level_info: import('./achievements').LevelDefinition | null;
}

export interface PrivateProfileResponse extends PublicProfileResponse {
  profile: EnhancedProfile;
  xp_details: import('./achievements').UserXPLevel | null;
  privacy_settings: {
    is_profile_public: boolean;
    show_badges: boolean;
    show_quiz_results: boolean;
    show_tags: boolean;
    shared_dimensions: string[] | null;
    allow_discovery: boolean;
  } | null;
  share_links: ProfileShareLink[] | null;
  quiz_history: unknown[] | null;
}

