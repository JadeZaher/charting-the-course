// Auto-generated from Pydantic models — do not edit manually

export interface HealthResponse {
  status: string;
  skills_loaded: number;
  skills_available: boolean;
  database: string;
  version: string;
}

export interface SkillItem {
  name: string;
  description: string;
  layer: number;
  version: string;
  depends_on: string[];
}

export interface SkillsResponse {
  count: number;
  skills: SkillItem[];
}

export interface ApiError {
  error: string;
}

// Auth types
export interface MemberSummary {
  id: string;
  display_name: string;
  did: string;
  profile: string | null;
  ecosystem_id: string;
  current_status: string;
}

export interface AuthChallengeResponse {
  challenge: string;
}

export interface AuthVerifyResponse {
  success: boolean;
  display_name: string;
  member: MemberSummary;
}

export interface AuthMeResponse {
  member: MemberSummary;
  ecosystems: EcosystemSummary[];
}

// Ecosystem types
export interface EcosystemSummary {
  id: string;
  name: string;
  description: string | null;
  status: string;
  logo_url: string | null;
  location: string | null;
  member_count: number;
}

export interface EcosystemDetail extends EcosystemSummary {
  website: string | null;
  founded_date: string | null;
  tags: string[] | null;
  contact_email: string | null;
  governance_summary: string | null;
  visibility: string;
}

// Dashboard types
export interface SummaryCard {
  label: string;
  value: number;
  trend: string | null;
  href: string;
  breakdown: Record<string, number> | null;
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  status: string;
  timestamp: string;
  label: string;
  href: string;
}

export interface DashboardSummary {
  cards: SummaryCard[];
  activity: ActivityItem[];
}
