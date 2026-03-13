// Orientation Portal type definitions

export interface EthosSummary {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  sector?: string;
  ethos_type: string;
  image_url?: string;
  member_count: number;
  member_avatars: string[];
  alignment_score?: number; // 0-100
}

export interface EthosDetail extends EthosSummary {
  description?: string;
  mission?: string;
  external_url?: string;
  parent_ethos?: EthosSummary | null;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
}

export interface EthosMemberWithProfile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  role_in_ethos?: string;
  member_type: string;
  profile_url: string;
}

export interface JourneyStep {
  step: number;
  type: 'video' | 'choice' | 'ai_conversation' | 'confirmation' | 'reflection' | 'survey';
  title: string;
  description?: string;
  video_url?: string;
  required: boolean;
  branch_condition?: { dimension: string; min_score: number };
  choices?: { value: string; label: string; description?: string }[];
  choice_routes?: Record<string, number>;
  ai_prompt_template?: string;
  confirmation_label?: string;
  reflection_prompt?: string;
  quiz_id?: string;
}

export interface JourneyExitPackage {
  docs?: { title: string; url: string }[];
  tools?: { name: string; description: string; url: string }[];
  next_steps?: string[];
  omnibot_prompt?: string;
}

export interface JourneyMap {
  id: string;
  slug: string;
  title: string;
  description?: string;
  ethos_id?: string;
  sector_alignment?: string[];
  role_types?: string[];
  min_alignment_score?: number;
  content_sequence: JourneyStep[];
  exit_package: JourneyExitPackage;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface OrientationPath {
  path: 'ready' | 'explorer';
  confidence: number;
  signals: string[];
}

export interface UserJourneyProgress {
  id: string;
  user_id: string;
  ethos_id: string;
  journey_map_id: string;
  orientation_path: 'ready' | 'explorer';
  current_step: number;
  completed_steps: number[];
  step_responses: Record<string, unknown>;
  status: 'not_started' | 'in_progress' | 'complete' | 'opted_out';
  started_at?: string;
  completed_at?: string;
  was_recommended: boolean;
  misalignment_flags: string[];
  created_at: string;
  updated_at: string;
}

export interface OmniBotMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface OmniBotContext {
  ethos_name?: string;
  current_step?: string;
  session_type?: 'orientation' | 'intake' | 'ongoing' | 'team_building';
  user_profile_summary?: string;
}
