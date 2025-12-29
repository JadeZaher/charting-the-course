// Badge Types for Phase 4

export interface BadgeConditions {
  type: 'tag_match' | 'quiz_score' | 'quiz_count' | 'tag_count' | 'custom';
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

