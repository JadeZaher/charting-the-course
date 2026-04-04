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

// Agreement types
export interface AgreementListItem {
  id: string;
  agreement_id: string;
  type: string;
  title: string;
  version: string;
  status: string;
  proposer: string | null;
  domain: string | null;
  hierarchy_level: string;
  review_date: string | null;
  sunset_date: string | null;
  created_at: string;
}

export interface RatificationRecord {
  id: string;
  participant: string;
  role: string | null;
  position: string | null;
  date: string | null;
}

export interface AgreementDetail extends AgreementListItem {
  ecosystem_id: string;
  text: string | null;
  affected_parties: string[] | null;
  parent_agreement_id: string | null;
  ratification_date: string | null;
  created_date: string | null;
  updated_at: string;
  ratification_records: RatificationRecord[];
}

export interface AmendmentRecord {
  id: string;
  amendment_id: string;
  amendment_type: string;
  proposed_by: string | null;
  date: string | null;
  changes: Record<string, any> | null;
  rationale: string | null;
  status: string;
  new_agreement_version: string | null;
  created_at: string;
}

export interface ReviewRecord {
  id: string;
  review_id: string;
  review_type: string;
  trigger: string | null;
  date: string | null;
  outcome: string | null;
  next_review_date: string | null;
  created_at: string;
}

export interface AgreementHistory {
  amendments: AmendmentRecord[];
  reviews: ReviewRecord[];
}

// Proposal types
export interface ProposalListItem {
  id: string;
  proposal_id: string;
  type: string;
  decision_type: string | null;
  title: string;
  version: string;
  status: string;
  proposer: string | null;
  affected_domain: string | null;
  urgency: string | null;
  created_at: string;
}

export interface AdviceEntry {
  id: string;
  advisor: string;
  role: string | null;
  ethos: string | null;
  advice_type: string | null;
  content: string | null;
  concerns: string | null;
  date: string | null;
}

export interface AdviceLog {
  id: string;
  advice_window_start: string | null;
  advice_window_end: string | null;
  urgency: string | null;
  summary: string | null;
  proposer_modifications: string | null;
  entries: AdviceEntry[];
}

export interface ConsentParticipant {
  id: string;
  member_name: string;
  position: string | null;
  objection_text: string | null;
  integration_attempted: boolean | null;
  integration_outcome: string | null;
  date: string | null;
}

export interface ConsentRecord {
  id: string;
  consent_mode: string;
  facilitator: string | null;
  date: string | null;
  quorum_met: boolean;
  outcome: string | null;
  participants: ConsentParticipant[];
}

export interface TestSuccessCriterion {
  id: string;
  criterion: string | null;
  metric: string | null;
  target: string | null;
  actual: string | null;
  met: boolean | null;
}

export interface TestReport {
  id: string;
  test_start_date: string | null;
  test_end_date: string | null;
  outcome: string | null;
  observations: string | null;
  success_criteria: TestSuccessCriterion[];
}

export interface ProposalDetail extends ProposalListItem {
  ecosystem_id: string;
  co_sponsors: string[] | null;
  impacted_parties: string[] | null;
  proposed_change: string | null;
  rationale: string | null;
  created_date: string | null;
  advice_deadline: string | null;
  consent_deadline: string | null;
  test_duration: string | null;
  updated_at: string;
  advice_logs: AdviceLog[];
  consent_records: ConsentRecord[];
  test_reports: TestReport[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}
