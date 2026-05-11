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
export interface OAuthProvider {
  id: string;
  name: string;
}

export interface MemberSummary {
  id: string;
  display_name: string;
  did: string | null;
  profile: string | null;
  ecosystem_id: string;
  current_status: string;
  has_password: boolean;
  has_did: boolean;
  oauth_provider: string | null;
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
  ecosystem_id: string;
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

export interface AgreementVersionRecord {
  id: string;
  agreement_id: string;
  version: string;
  status: string;
  title: string;
  text: string | null;
  type: string;
  proposer: string | null;
  domain: string | null;
  hierarchy_level: string;
  affected_parties: any | null;
  review_date: string | null;
  sunset_date: string | null;
  ratification_date: string | null;
  version_fingerprint: string | null;
  change_reason: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface AgreementHistory {
  amendments: AmendmentRecord[];
  reviews: ReviewRecord[];
  versions: AgreementVersionRecord[];
}

// Proposal types
export interface ProposalListItem {
  id: string;
  proposal_id: string;
  ecosystem_id: string;
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

// Member types
export interface MemberListItem {
  id: string;
  member_id: string;
  ecosystem_id: string;
  display_name: string;
  current_status: string;
  profile: string | null;
  did: string | null;
  phone: string | null;
  created_at: string;
}

export interface MemberDetail extends MemberListItem {
  ecosystem_id: string;
  profile_picture: string | null;
  skills_offered: string[] | null;
  skills_needed: string[] | null;
  interests: string[] | null;
  updated_at: string;
  onboarding: OnboardingState | null;
}

export interface QuizStatusItem {
  quiz_id: string;
  quiz_title: string;
  status: 'completed' | 'in_progress' | 'not_started';
  score: number | null;
  is_passed: boolean | null;
  completed_at: string | null;
}

export interface QuizSummary {
  total_available: number;
  completed: number;
  passed: number;
  in_progress: number;
  not_started: number;
  quizzes: QuizStatusItem[];
}

export interface MemberProfileResponse extends MemberDetail {
  user_id: string;
  username: string | null;
  user_display_name: string | null;
  quiz_summary: QuizSummary;
  badges: UserBadgeItem[];
  tags: UserTagItem[];
}

export interface OnboardingState {
  id: string;
  facilitator: string | null;
  completion_percentage: number;
  section_consents: Record<string, boolean> | null;
  cooling_off_start: string | null;
  cooling_off_end: string | null;
  consent_date: string | null;
}

// Domain types
export interface DomainListItem {
  id: string;
  domain_id: string;
  ecosystem_id: string;
  version: string;
  status: string;
  purpose: string | null;
  current_steward: string | null;
  created_at: string;
}

export interface DomainElement {
  id: string;
  element_name: string;
  element_value: Record<string, any> | null;
}

export interface DomainMetric {
  id: string;
  metric: string;
  target: string | null;
  measurement_method: string | null;
}

export interface DomainDetail extends DomainListItem {
  ecosystem_id: string;
  created_by: string | null;
  parent_domain_id: string | null;
  elements: DomainElement[];
  metrics: DomainMetric[];
  updated_at: string;
}

// Decision types
export interface DecisionListItem {
  id: string;
  record_id: string;
  ecosystem_id: string;
  date: string | null;
  holding: string | null;
  domain: string | null;
  precedent_level: string | null;
  status: string;
  source_skill: string | null;
  created_at: string;
}

export interface DecisionDetail extends DecisionListItem {
  ecosystem_id: string;
  ratio_decidendi: string | null;
  obiter_dicta: string | null;
  deliberation_summary: string | null;
  source_layer: number | null;
  artifact_type: string | null;
  artifact_reference: string | null;
  overruled_by: string | null;
  superseded_by: string | null;
  updated_at: string;
}

// Conflict types
export interface ConflictListItem {
  id: string;
  case_id: string;
  ecosystem_id: string;
  title: string;
  status: string;
  severity: string | null;
  urgency: string | null;
  domain: string | null;
  safety_flag: boolean;
  created_at: string;
}

export interface RepairAgreement {
  id: string;
  title: string;
  responsible_party: string | null;
  status: string;
  commitments: Record<string, any> | null;
  completed_date: string | null;
}

export interface ConflictDetail extends ConflictListItem {
  ecosystem_id: string;
  description: string | null;
  scope: string | null;
  tier: number | null;
  root_cause_category: string | null;
  parties: string[] | null;
  reporter_id: string | null;
  facilitator_id: string | null;
  updated_at: string;
  repair_agreements: RepairAgreement[];
}

// Messaging types
export interface ConversationSummary {
  id: string;
  type: string;
  title: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  participants: { id: string; display_name: string }[];
}

export interface MessageItem {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  message_type: string;
  created_at: string;
  edited_at: string | null;
}

export interface ConversationDetail {
  id: string;
  type: string;
  title: string | null;
  participants: { id: string; display_name: string; role: string }[];
  messages: MessageItem[];
  total_messages: number;
}

// Chat types
export interface ChatSession {
  id: string;
  title: string | null;
  last_message: string | null;
  created_at: string;
}

// Course types
export interface CourseListItem {
  id: string; ecosystem_id: string; domain_id: string | null; title: string;
  description: string | null; is_onboarding_required: boolean; sort_order: number; created_at: string;
}
export interface CourseDetail extends CourseListItem { quizzes: QuizListItem[]; }
export interface QuizListItem {
  id: string; course_id: string | null; ecosystem_id: string | null; domain_id: string | null;
  title: string; description: string | null;
  mode: string; time_limit: number | null; passing_score: number | null;
  allow_retakes: boolean; visibility: string; is_published: boolean;
  is_entry_quiz: boolean; created_at: string;
}
export interface QuizDetail extends QuizListItem { survey_json: Record<string, any> | null; }
export interface QuizResultItem {
  id: string; quiz_id: string; member_id: string; score: number | null;
  is_passed: boolean | null; time_spent: number | null; completed_at: string | null; created_at: string;
}
export interface UserBadgeItem {
  id: string; badge_key: string; badge_name: string; badge_description: string | null;
  badge_category: string | null; badge_icon: string | null; strength: number | null; earned_at: string | null;
}
export interface UserTagItem {
  id: string; tag_key: string; tag_value: string | null; tag_category: string | null; numeric_value: number | null;
}

// Discover types
export interface DiscoverQuiz {
  id: string;
  title: string;
  description: string | null;
  mode: string;
  time_limit: number | null;
  passing_score: number | null;
  allow_retakes: boolean;
  completions: number;
  course_name: string | null;
  created_at: string | null;
}
export interface DiscoverEcosystem {
  id: string;
  name: string;
  description: string | null;
  status: string;
  logo_url: string | null;
  location: string | null;
  tags: string[];
  member_count: number;
  founded_date: string | null;
  website: string | null;
}
export interface DiscoverSection<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}
export interface DiscoverResponse {
  quizzes?: DiscoverSection<DiscoverQuiz>;
  ecosystems?: DiscoverSection<DiscoverEcosystem>;
}

// Shares & Needs types
export interface SharesNeeds {
  id: string;
  ecosystem_id: string;
  domain_id: string;
  type: 'share' | 'need';
  title: string;
  description: string | null;
  category: string | null;
  capacity: string | null;
  tags: string[];
  visibility: string;
  status: string;
  domain_name?: string;
  ecosystem_name?: string;
  created_at: string | null;
}

export interface Collaboration {
  id: string;
  source_domain_id: string;
  target_domain_id: string;
  title: string;
  description: string | null;
  status: string;
  engagement_tier: string;
  terms: Record<string, any> | null;
  linked_shares_needs: Record<string, any> | null;
  started_date: string | null;
  review_date: string | null;
  version_fingerprint: string | null;
  source_domain_name?: string;
  target_domain_name?: string;
  source_ecosystem_name?: string;
  target_ecosystem_name?: string;
  created_at: string | null;
}

export interface ComplianceSummary {
  id: string;
  ecosystem_id: string;
  generated_at: string;
  summary: string | null;
  score_data: Record<string, any> | null;
  agreement_coverage: Record<string, any> | null;
  domain_health: Record<string, any> | null;
  flagged_issues: Record<string, any> | null;
  version_fingerprint: string | null;
}

// Emergency types
export interface EmergencyStateItem {
  id: string;
  state: string;
  declared_at: string | null;
  declared_by: string | null;
  auto_revert_at: string | null;
  closed_at: string | null;
  post_review_status: string | null;
  created_at: string;
}

export interface EmergencyStateDetail extends EmergencyStateItem {
  ecosystem_id: string;
  criteria_met: any;
  recovery_entered_at: string | null;
  pre_authorized_roles: any;
  actions_log: any;
  notes: string | null;
  updated_at: string;
}

export interface EmergencyListResponse {
  current: EmergencyStateDetail | null;
  items: EmergencyStateItem[];
  total: number;
  page: number;
  per_page: number;
}

// Exit types
export interface ExitListItem {
  id: string;
  member_id: string;
  ecosystem_id: string;
  member_name: string;
  exit_type: string;
  status: string;
  reason: string | null;
  created_at: string;
}

export interface ExitDetail extends ExitListItem {
  unwinding_tracker: Record<string, any> | null;
  ecosystem_id: string;
  updated_at: string;
}

// Safeguards types
export interface GovernanceAudit {
  id: string;
  ecosystem_id: string;
  auditor: string;
  status: string;
  findings: string | null;
  recommendations: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface SafeguardsOverview {
  latest_audit: GovernanceAudit | null;
  recent_audits: GovernanceAudit[];
  health_score: number;
}
