// Achievement Types for Phase 4

export type AchievementType =
  | 'quiz_completed'
  | 'quiz_passed'
  | 'quiz_perfect_score'
  | 'first_quiz'
  | 'quiz_streak'
  | 'category_mastery'
  | 'badge_earned'
  | 'level_up'
  | 'xp_milestone'
  | 'custom';

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

export interface LevelHistoryEntry {
  level: number;
  achieved_at: string;
  xp_at_time: number;
}

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

export interface LevelDefinition {
  level: number;
  level_name: string;
  min_xp: number;
  max_xp: number | null;
  level_icon: string | null;
  level_color: string | null;
  perks: LevelPerk[];
}

export interface LevelPerk {
  perk_name: string;
  perk_description: string;
}

// Calculation result from achievement calculation
export interface AchievementCalculationResult {
  badges_earned: string[];
  achievements_earned: string[];
  xp_awarded: number;
  leveled_up: boolean;
  new_level: number | null;
}

