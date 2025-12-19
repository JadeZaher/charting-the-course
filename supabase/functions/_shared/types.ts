// Shared TypeScript types for Supabase Edge Functions
// These types align with the existing schema.ts structure

export type UserRole = "admin" | "facilitator" | "contributor" | "viewer";
export type ProfileVisibility = "public" | "private" | "link-only";

// Location data structure (from existing schema)
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

// Contact data structure (from existing schema)
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

// Profile structure (maps from existing users table)
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

// Role structure
export interface Role {
  id: number;
  key: UserRole;
  name: string;
  description: string | null;
  created_at: string;
}

// User role assignment
export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_id: number;
  assigned_at: string;
  assigned_by: string | null;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: unknown;
}

// Update profile request
export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  location_data?: LocationData;
  contact_data?: ContactData;
  profile_visibility?: ProfileVisibility;
}

// Assign role request
export interface AssignRoleRequest {
  user_id: string;
  role_key: UserRole;
}

// Quiz types (from existing schema)
export type QuizVisibility = "public" | "private" | "team" | "assigned";
export type QuizMode = "take" | "upload" | "both";

// Quiz structure
export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  course_id: string | null;
  mode: QuizMode;
  survey_json: Record<string, unknown>;
  questions: unknown | null; // deprecated
  time_limit: number | null;
  passing_score: number | null;
  allow_retakes: boolean;
  visibility: QuizVisibility;
  team_id: string | null;
  created_at: string;
  created_by: string;
  is_published: boolean;
  updated_at: string;
}

// Create/Update quiz request
export interface CreateQuizRequest {
  title: string;
  description?: string;
  course_id?: string;
  mode?: QuizMode;
  survey_json: Record<string, unknown>;
  time_limit?: number | null;
  passing_score?: number | null;
  allow_retakes?: boolean;
  visibility?: QuizVisibility;
  team_id?: string | null;
}

// Quiz assignment
export interface QuizAssignment {
  id: string;
  quiz_id: string;
  user_id: string | null;
  team_id: string | null;
  assigned_by: string | null;
  due_date: string | null;
  created_at: string;
}

// Create quiz assignment request
export interface CreateQuizAssignmentRequest {
  quiz_id: string;
  user_id?: string;
  team_id?: string;
  due_date?: string;
}

// Quiz result
export interface QuizResult {
  id: string;
  quiz_id: string;
  user_id: string;
  survey_results: Record<string, unknown>;
  answers: unknown | null; // deprecated
  score: number;
  is_passed: boolean | null;
  time_spent: number | null;
  is_imported: boolean;
  imported_data: unknown | null;
  completed_at: string;
}

// Submit quiz request
export interface SubmitQuizRequest {
  survey_results: Record<string, unknown>;
  time_spent?: number;
}

// Team structure
export interface Team {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
}

// Course structure
export interface Course {
  id: string;
  title: string;
  description: string | null;
  team_id: string | null;
  created_at: string;
  created_by: string | null;
}

// ============================================================================
// PHASE 4 TYPES: Enhanced Profiles, Badges & Achievements
// ============================================================================

// Social links structure
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

// Enhanced profile (extends base Profile)
export interface EnhancedProfile extends Profile {
  cover_url: string | null;
  headline: string | null;
  social_links: SocialLinks | null;
  share_slug: string | null;
  profile_tags: string[] | null;
}

// Update enhanced profile request
export interface UpdateEnhancedProfileRequest extends UpdateProfileRequest {
  cover_url?: string;
  headline?: string;
  social_links?: SocialLinks;
  share_slug?: string;
  profile_tags?: string[];
}

// Badge definition (admin-managed)
export interface BadgeDefinition {
  id: string;
  badge_key: string;
  badge_name: string;
  badge_description: string | null;
  badge_category: string | null;
  badge_icon: string | null;
  badge_color: string | null;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  conditions: BadgeConditions;
  xp_reward: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// Badge conditions structure
export interface BadgeConditions {
  type: "tag_match" | "quiz_score" | "quiz_count" | "tag_count" | "custom";
  required_tags?: string[];
  any_of_tags?: string[];
  tag_value_match?: { tag_key: string; value: string };
  min_quiz_score?: number;
  min_quiz_count?: number;
  quiz_ids?: string[];
  min_tag_count?: { category: string; count: number };
  min_streak?: number;
  description?: string;
}

// Create/Update badge definition request
export interface CreateBadgeDefinitionRequest {
  badge_key: string;
  badge_name: string;
  badge_description?: string;
  badge_category?: string;
  badge_icon?: string;
  badge_color?: string;
  is_active?: boolean;
  is_featured?: boolean;
  display_order?: number;
  conditions: BadgeConditions;
  xp_reward?: number;
}

// User badge (earned badge)
export interface UserBadge {
  id: string;
  user_id: string;
  badge_key: string;
  badge_name: string;
  badge_description: string | null;
  badge_category: string | null;
  badge_icon: string | null;
  strength: number;
  source_tag_keys: string[] | null;
  badge_definition_id: string | null;
  earned_at: string;
  updated_at: string;
}

// User achievement types
export type AchievementType =
  | "quiz_completed"
  | "quiz_passed"
  | "quiz_perfect_score"
  | "first_quiz"
  | "quiz_streak"
  | "category_mastery"
  | "badge_earned"
  | "level_up"
  | "xp_milestone"
  | "custom";

// User achievement
export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_type: AchievementType;
  achievement_key: string;
  achievement_name: string;
  achievement_description: string | null;
  achievement_icon: string | null;
  related_quiz_id: string | null;
  related_badge_id: string | null;
  achievement_data: Record<string, unknown>;
  xp_awarded: number;
  earned_at: string;
}

// User XP and levels
export interface UserXPLevel {
  user_id: string;
  total_xp: number;
  current_level: number;
  xp_to_next_level: number;
  level_history: LevelHistoryEntry[];
  quiz_streak: number;
  longest_streak: number;
  last_quiz_date: string | null;
  created_at: string;
  updated_at: string;
}

// Level history entry
export interface LevelHistoryEntry {
  level: number;
  achieved_at: string;
  xp_at_time: number;
}

// Level definition
export interface LevelDefinition {
  level: number;
  level_name: string;
  min_xp: number;
  max_xp: number | null;
  level_icon: string | null;
  level_color: string | null;
  perks: LevelPerk[];
}

// Level perk
export interface LevelPerk {
  perk_name: string;
  perk_description: string;
}

// Profile share link
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

// Create share link request
export interface CreateShareLinkRequest {
  expires_at?: string;
  show_badges?: boolean;
  show_achievements?: boolean;
  show_stats?: boolean;
  show_quiz_history?: boolean;
}

// Public profile response (what's returned for public viewing)
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
  badges: UserBadge[] | null;
  achievements: UserAchievement[] | null;
  level_info: LevelDefinition | null;
}

// Private profile response (full data for owner)
export interface PrivateProfileResponse extends PublicProfileResponse {
  profile: EnhancedProfile;
  xp_details: UserXPLevel | null;
  privacy_settings: {
    is_profile_public: boolean;
    show_badges: boolean;
    show_quiz_results: boolean;
    show_tags: boolean;
    shared_dimensions: string[] | null;
    allow_discovery: boolean;
  } | null;
  share_links: ProfileShareLink[] | null;
  quiz_history: QuizResult[] | null;
}

// Earned badge (from tag extraction)
export interface EarnedBadge {
  badge_key: string;
  badge_name: string;
  badge_description?: string;
  badge_category?: string;
  badge_icon?: string;
  strength: number;
  source_tag_keys: string[];
}

// User tag (extracted from quiz)
export interface UserTag {
  tag_key: string;
  tag_value: string;
  tag_category?: string;
  data_type: "string" | "number" | "boolean";
  numeric_value?: number;
  question_name?: string;
}

// User privacy settings
export interface UserPrivacySettings {
  user_id: string;
  is_profile_public: boolean;
  show_badges: boolean;
  show_quiz_results: boolean;
  show_tags: boolean;
  shared_dimensions: string[] | null;
  allow_discovery: boolean;
  created_at: string;
  updated_at: string;
}

// User profile data (stats)
export interface UserProfileData {
  user_id: string;
  profile_dimensions: Record<string, unknown> | null;
  total_quizzes_completed: number;
  total_tags_earned: number;
  total_badges_earned: number;
  last_calculated_at: string | null;
  updated_at: string;
}

