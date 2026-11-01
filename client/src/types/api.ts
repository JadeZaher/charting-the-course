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
  detail?: string | null;
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

export interface RequiredAgreement {
  id: string;
  title: string;
  version: string | null;
}

/** A membership still behind its ecosystem's agreement-consent gate. */
export interface PendingConsentGate {
  ecosystem_id: string;
  ecosystem_name: string;
  required_agreements: RequiredAgreement[];
}

export interface AuthVerifyResponse {
  success: boolean;
  display_name: string;
  member: MemberSummary;
  /** Present when the call created a membership (register, first DID sign-in). */
  status?: 'consent_required' | 'joined';
  required_agreements?: RequiredAgreement[];
}

export interface AuthMeResponse {
  member: MemberSummary;
  ecosystems: EcosystemSummary[];
  pending_consents?: PendingConsentGate[];
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

export interface AgreementCeremony {
  id: string;
  stage: string;
  outcome: string;
  evidence: string | null;
  completed_at: string;
}

export interface AgreementConsentSummary {
  required: number;
  consented: number;
  outstanding: number;
  complete: boolean;
}

export interface AgreementMemberConsent {
  id: string;
  member_id: string;
  agreement_version: string;
  attested_at: string;
  withdrawn_at: string | null;
  alignment_awarded: number;
}

// ACT gate declaration (made at the proposal/agreement level) and its
// live evaluation. Gate sub-fields differ slightly between proposals and
// agreements, so they are optional.
export interface ActPolicy {
  min_advice_rounds: number;
  consent_required: boolean;
  consent_quorum: number | null;
  test_cases: string[];
}

// Agent token for MCP access (minted per user, session-scoped). The
// plaintext token is only present in the mint response.
export interface AgentToken {
  id: string;
  label: string;
  created_at: string | null;
  expires_at: string | null;
  revoked: boolean;
  last_used_at: string | null;
  token?: string;
}

export interface ActGates {
  policy: ActPolicy;
  policy_source?: 'proposal' | 'agreement' | 'default';
  advice: { met: boolean; rounds: number; required_rounds: number };
  consent: {
    met: boolean;
    required: boolean;
    positions?: number;
    quorum?: number | null;
    open_objections?: number;
    consented?: number;
    outstanding?: number;
  };
  test: {
    met: boolean;
    declared_cases: string[];
    cases_met?: string[];
    cases_missing?: string[];
    reports?: number;
    evidence?: number;
    required_evidence?: number;
  };
  complete: boolean;
}

export interface AgreementDetail extends AgreementListItem {
  shared_ecosystem_ids: string[] | null;
  text: string | null;
  affected_parties: string[] | Record<string, unknown> | null;
  parent_agreement_id: string | null;
  ratification_date: string | null;
  created_date: string | null;
  updated_at: string;
  ratification_records: RatificationRecord[];
  ceremonies: AgreementCeremony[];
  requires_explicit_consent: boolean;
  prerequisite_scopes: string[];
  prerequisite_domain_ids: string[];
  alignment_points: number;
  consent_summary: AgreementConsentSummary | null;
  current_member_consent: AgreementMemberConsent | null;
  act_policy: ActPolicy | null;
  gates: ActGates | null;
  auto_transitions?: string[];
  decision_record_id?: string;
  caller_role: string | null;
  caller_can_conduct: boolean;
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
  /** Authoring member; null on legacy proposals (steward-managed only). */
  proposer_member_id?: string | null;
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

/** What an ACT participation write reports: the gates after it and any automatic advance it caused. */
export interface ActSubmitOutcome {
  gates?: ActGates;
  /** Automatic moves in order, e.g. ['advice->consent']; empty when the proposal stayed put. */
  auto_transitions?: string[];
  /** Set when the cascade reached ratified and minted a decision record. */
  decision_record_id?: string;
}

/** POST /proposals/:id/advice response: the log plus any ACT auto-advance it caused. */
export interface AdviceSubmitResult extends AdviceLog, ActSubmitOutcome {}

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

/** POST /proposals/:id/consent response: the record plus any ACT auto-advance it caused. */
export interface ConsentSubmitResult extends ConsentRecord, ActSubmitOutcome {}

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

/** POST /proposals/:id/test response: the report plus any ACT auto-advance (ratification included). */
export interface TestReportSubmitResult extends TestReport, ActSubmitOutcome {}

export interface ProposalDetail extends ProposalListItem {
  shared_ecosystem_ids: string[] | null;
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
  act_policy: ActPolicy | null;
  own_act_policy: ActPolicy | null;
  gates: ActGates | null;
  governing_agreement_id: string | null;
  governing_agreement: { id: string; agreement_id: string; title: string } | null;
  auto_transitions?: string[];
  decision_record_id?: string;
  advice_logs: AdviceLog[];
  consent_records: ConsentRecord[];
  test_reports: TestReport[];
  caller_role: string | null;
  /** May participate (advice, consent, test). */
  caller_can_conduct: boolean;
  /** May edit and make manual status moves: the author or an ecosystem steward (mod+). */
  caller_can_manage: boolean;
  caller_is_proposer: boolean;
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
  role: 'user' | 'mod' | 'admin' | 'owner';
  profile: string | null;
  phone: string | null;
  profile_picture: string | null;
  onboarding_status: string | null;
  created_at: string;
}

export interface RoleUpdateRequest {
  role: 'user' | 'mod' | 'admin' | 'owner';
}

export interface MemberDetail extends MemberListItem {
  shared_ecosystem_ids: string[] | null;
  ecosystem_id: string;
  did: string | null;
  skills_offered: string[] | Record<string, unknown> | null;
  skills_needed: string[] | Record<string, unknown> | null;
  interests: string[] | Record<string, unknown> | null;
  kyc_status: string | null;
  last_governance_activity_date: string | null;
  notes: string | null;
  privacy: Record<string, unknown> | null;
  updated_at: string;
  onboarding: MemberOnboardingSnapshot | null;
}

export interface MemberOnboardingSnapshot {
  id: string;
  facilitator: string | null;
  completion_percentage: number | null;
  cooling_off_start: string | null;
  cooling_off_end: string | null;
  consent_date: string | null;
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

export interface PublicProfileProject {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  role: string | null;
  started_at: string | null;
  ended_at: string | null;
}

export interface PublicProfileDomain {
  id: string;
  domain_id: string;
  /** Server-derived label: name, else the purpose's "Name — " prefix, else domain_id. */
  display_name?: string | null;
  purpose: string | null;
  role: string;
  status: string;
  joined_date: string | null;
  member_id: string;
  ecosystem: {
    id: string;
    name: string;
  };
}

export interface PublicProfileMembership {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  location: string | null;
  website: string | null;
  membership: {
    id: string;
    member_id: string;
    status: string;
    profile: string | null;
    skills_offered: string[] | Record<string, unknown> | null;
    skills_needed: string[] | Record<string, unknown> | null;
    interests: string[] | Record<string, unknown> | null;
    created_at: string;
  };
}

export interface PublicProfileQuizAttempt {
  id: string;
  score: number | null;
  is_passed: boolean | null;
  time_spent: number | null;
  result_metadata: Record<string, unknown> | null;
  completed_at: string | null;
}

export interface PublicProfileQuizResult {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    mode: string;
  };
  domain: {
    id: string;
    domain_id: string;
    display_name?: string | null;
    purpose: string | null;
  } | null;
  ecosystem: {
    id: string;
    name: string;
  } | null;
  results: PublicProfileQuizAttempt[];
}

export interface PublicProfileResponse {
  profile: {
    id: string;
    username: string | null;
    display_name: string;
    profile_picture: string | null;
    headline: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    social_links: Record<string, string>;
    skills: string[];
    interests: string[];
    projects: PublicProfileProject[];
    created_at: string;
  };
  ecosystems: PublicProfileMembership[];
  domains: PublicProfileDomain[];
  quiz_results: PublicProfileQuizResult[];
  badges: (UserBadgeItem & { member_id: string })[];
  tags: (UserTagItem & { member_id: string })[];
  publications: SharesNeeds[];
  is_owner: boolean;
}

export interface OnboardingSectionPosition {
  consented: boolean;
  position: string | null;
  objection_text: string | null;
}

export type OnboardingSectionConsent = boolean | OnboardingSectionPosition;

export interface OnboardingState {
  member_id: string;
  facilitator: string | null;
  completion_percentage: number;
  section_consents: Record<string, OnboardingSectionConsent>;
  cooling_off_start: string | null;
  cooling_off_end: string | null;
  consent_date: string | null;
  uaf_version_consented: string | null;
}

export interface CeremonyConsentRequest {
  section: string;
  consented: boolean;
  position?: 'consent' | 'stand_aside' | 'object';
  objection_text?: string;
}

// Domain types
export interface DomainListItem {
  id: string;
  /** Generated business code (DOM-XXXXXXXX); show it as secondary text only. */
  domain_id: string;
  ecosystem_id: string;
  name: string | null;
  /** Server-derived label: name, else the purpose's "Name — " prefix, else domain_id. */
  display_name: string;
  version: string;
  status: string;
  purpose: string | null;
  current_steward: string | null;
  parent_domain_id: string | null;
  version_fingerprint: string | null;
  created_at: string;
  caller_is_participant: boolean;
  caller_is_steward: boolean;
}

/** GET /domains envelope: caller_can_create is true when the caller is mod+ in a scoped ecosystem. */
export interface DomainListResponse extends PaginatedResponse<DomainListItem> {
  caller_can_create?: boolean;
}

export interface DomainParticipant {
  member_id: string;
  display_name: string;
  role: string;
}

export interface DomainElement {
  id: string;
  element_name: string;
  element_value: unknown;
}

export interface DomainMetric {
  id: string;
  metric: string;
  target: string | null;
  measurement_method: string | null;
}

export interface DomainDetail extends DomainListItem {
  shared_ecosystem_ids: string[] | null;
  ecosystem_id: string;
  steward_id: string | null;
  created_by: string | null;
  metric_definitions: string | Record<string, unknown> | null;
  elements: Record<string, unknown> | null;
  domain_elements: DomainElement[];
  domain_metrics: DomainMetric[];
  updated_at: string;
  /** The domain's steward or an ecosystem steward (mod+). */
  caller_can_edit: boolean;
  participants: DomainParticipant[];
  participant_count: number;
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
  artifact_type: string | null;
  created_at: string;
}

export interface DecisionParticipant {
  id: string;
  name: string;
  role: string | null;
  position: string | null;
}

export interface DecisionDissentRecord {
  id: string;
  objector: string;
  objection: string | null;
  resolution: string | null;
  notes: string | null;
}

export interface DecisionSemanticTag {
  id: string;
  topic: Record<string, unknown> | null;
  affected_parties: Record<string, unknown> | null;
  ecosystem_scope: string | null;
  urgency_at_time: string | null;
  related_precedents: Record<string, unknown> | null;
}

export interface DecisionDetail extends DecisionListItem {
  ecosystem_id: string;
  ratio_decidendi: string | null;
  obiter_dicta: string | null;
  deliberation_summary: string | null;
  source_layer: number | null;
  artifact_reference: string | null;
  source_proposal_id: string | null;
  source_agreement_id: string | null;
  overruled_by: string | null;
  superseded_by: string | null;
  related_records: Record<string, unknown> | null;
  review_date: string | null;
  recorder: string | null;
  recorder_role: string | null;
  verification_by: string | null;
  verification_date: string | null;
  updated_at: string;
  dissent_records: DecisionDissentRecord[];
  participants: DecisionParticipant[];
  semantic_tags: DecisionSemanticTag[];
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
  /** Plain-language stage, what happens next and who decides (server-built). */
  stage: string;
  next_step: string;
  decided_by: string;
  caller_is_reporter: boolean;
}

export interface RepairAgreement {
  id: string;
  title: string;
  responsible_party: string | null;
  status: string;
  commitments: Record<string, any> | null;
  completed_date: string | null;
  checkin_30_date: string | null;
  checkin_30_notes: string | null;
  checkin_60_date: string | null;
  checkin_60_notes: string | null;
  checkin_90_date: string | null;
  checkin_90_notes: string | null;
  created_at: string;
  next_checkin_date: string | null;
  next_checkin_overdue: boolean;
}

export interface ConflictDetail extends ConflictListItem {
  ecosystem_id: string;
  description: string | null;
  scope: string | null;
  tier: number | null;
  root_cause_category: string | null;
  /** Current names of the people involved (access is by member id on the server). */
  party_names: string[];
  reporter_id: string | null;
  reporter_name: string | null;
  facilitator_id: string | null;
  facilitator_name: string | null;
  /** The caller is a steward or the facilitator (and not a named party). */
  caller_can_triage: boolean;
  /** Statuses the caller may move this case to. */
  allowed_next: string[];
  triage_notes: string | null;
  resolution_summary: string | null;
  resolved_date: string | null;
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
export interface QuizDomainAssignResult { success: boolean; quiz_id: string; domain_id: string; }
export interface QuizDomainUnassignResult { success: boolean; quiz_id: string; }
export interface QuizEcosystemAssignResult { status: string; quiz_id: string; is_entry_quiz: boolean; }
export interface QuizEcosystemUnassignResult { status: string; quiz_id: string; }
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

// Orientation types (backend orientation.py journey-map list/create/update response shape;
// distinct from the richer, partly-speculative JourneyMap in @/types/orientation)
export interface JourneyMapSummary {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  ecosystem_id: string | null;
  step_count: number;
  content_sequence: Record<string, unknown>[];
  exit_package: Record<string, unknown>;
  is_default: boolean;
  is_active: boolean;
  created_at: string | null;
}
export interface SaveGenplanInputResult { status: string; received: boolean; }

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
  author_member_id: string | null;
  author_user_id?: string | null;
  author_name?: string | null;
  author_username?: string | null;
  type: 'share' | 'need' | 'solution';
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
  required_agreement_ids?: string[];
  awaiting_ecosystem_id?: string;
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

// Emergency types: the G-Safety section below (EmergencyRecord, EmergencyOverview).

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
  declared_date: string | null;
  target_completion_date: string | null;
  completed_date: string | null;
}


// Notifications types
export interface NotificationPreferences {
  agreement_reviews: boolean;
  consent_rounds: boolean;
  proposal_deadlines: boolean;
  conflict_updates: boolean;
}

export interface PushSubscriptionRequest {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  notification_types?: NotificationPreferences;
}

// Member status transition
export interface MemberStatusTransition {
  status: string;
  trigger?: string;
  notes?: string;
}

// Safeguards types
export interface IndicatorScore {
  indicator_id: string;
  indicator_name: string;
  measured_value: string | number | null;
  status: 'healthy' | 'warning' | 'critical' | null;
  prior_value: string | number | null;
  trend: 'improving' | 'stable' | 'degrading' | 'baseline' | null;
  notes: string | null;
}

export interface TriggeredSafeguard {
  trigger_id: string;
  indicator_id: string;
  threshold_crossed: string;
  recommended_action: string;
}

export interface GovernanceAudit {
  id: string;
  ecosystem_id: string;
  auditor: string;
  status: string;
  findings: string | null;
  recommendations: string | null;
  created_at: string;
  completed_at: string | null;
  // Extended fields (optional for backward compat)
  audit_scope?: string | null;
  audit_period_start?: string | null;
  audit_period_end?: string | null;
  auditor_ids?: string[] | null;
  overall_health?: 'healthy' | 'mixed' | 'degrading' | 'critical' | null;
  indicator_scores?: IndicatorScore[] | null;
  triggered_safeguards?: TriggeredSafeguard[] | null;
  structured_recommendations?: string[] | null;
  next_audit_due?: string | null;
  trigger_type?: string | null;
  /** The caller is the auditor recording this draft. */
  caller_can_edit?: boolean;
  overall_health_score?: number | null;
}

export interface SafeguardsOverview {
  latest_audit: GovernanceAudit | null;
  recent_audits: GovernanceAudit[];
  health_score: number | null;
  indicator_scores?: IndicatorScore[] | null;
  triggered_safeguards?: TriggeredSafeguard[] | null;
}

// ---------------------------------------------------------------------------
// Admin CRUD + participation consent (added for hardening/completeness pass)
// ---------------------------------------------------------------------------

export interface EthosAccessStatus {
  has_access: boolean;
  role_in_ethos: string | null;
  access_level: string | null;
}

export interface EthosAccessGrant {
  id: string;
  member_id: string;
  member_name: string | null;
  ecosystem_id: string;
  role_in_ethos: string | null;
  access_level: string | null;
  granted_at: string;
  granted_by: string | null;
}

export interface BadgeDefinition {
  id: string;
  ecosystem_id: string | null;
  badge_key: string;
  badge_name: string;
  badge_description: string | null;
  badge_category: string | null;
  badge_icon: string | null;
  strength: number | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  ecosystem_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface TeamMember {
  id: string;
  team_id: string;
  member_id: string;
  member_name: string | null;
  role: string;
  created_at: string;
}

export interface QuizAssignment {
  id: string;
  quiz_id: string;
  quiz_title: string | null;
  member_id: string;
  member_name: string | null;
  ecosystem_id: string | null;
  assigned_by: string | null;
  due_date: string | null;
  status: string;
  created_at: string;
}

export interface AppSettingResponse {
  key: string;
  value: Record<string, unknown> | null;
}

export interface CtcHandoffItem {
  member_id: string;
  ready_for_neos_den: boolean;
  updated_at: string | null;
}

// Member decisions — one member's personal decision about a subject
// (agreement, proposal, share, or need), doubling as a follow-up task.
// Distinct from DecisionRecord (the ecosystem artifact ledger): these are
// user-owned and only readable/editable by their owner.
export type MemberDecisionState = 'intended' | 'in_progress' | 'done' | 'follow_up' | 'dropped';

export type MemberDecisionSubjectType = 'agreement' | 'proposal' | 'share' | 'need';

export interface MemberDecision {
  id: string;
  ecosystem_id: string;
  subject_type: MemberDecisionSubjectType;
  subject_id: string;
  decision: string;
  state: MemberDecisionState;
  notes: string | null;
  subject_title: string | null;
  created_at: string;
  updated_at: string;
}

// G-Care

/** An indicator the auditor rated by hand. */
export type RatedIndicator = Pick<IndicatorScore, 'indicator_id' | 'indicator_name' | 'status'> & { notes?: string | null };

/** Fields of POST/PUT /safeguards/audits: the auditor is always the caller. */
export interface AuditDraftFields {
  audit_scope?: string;
  audit_period_start?: string;
  audit_period_end?: string;
  indicator_scores?: RatedIndicator[];
  findings?: string;
  structured_recommendations?: string[];
}

// G-Safety: emergency co-sign and Recovery, self-filed exit and the portable record.
// Shapes of neos_agent api/emergency.py and api/exit.py; see api/AGENTS.md "Emergency and exit".
export type EmergencyPhase = 'pending' | 'open' | 'recovery' | 'closed' | 'withdrawn';

export interface EmergencyTimeline {
  phase: EmergencyPhase;
  next_step: string;
  cosign_deadline: string | null;
  authority_ends_at: string | null;
  recovery_started_at: string | null;
  review_schedule_by: string | null;
  review_due_at: string | null;
  review_overdue: boolean;
}

export interface EmergencySummary extends EmergencyTimeline {
  id: string;
  ecosystem_id: string;
  state: string;
  declared_at: string | null;
  declared_by: string | null;
  co_signed_by: string | null;
  auto_revert_at: string | null;
  closed_at: string | null;
  post_review_status: 'scheduled' | 'complete' | null;
  created_at: string | null;
}

export interface EmergencyLogEntry {
  action: string;
  timestamp: string;
  note?: string;
  actor?: string;
  trigger?: string;
  outcome?: 'scheduled' | 'complete';
  summary?: string;
}

export interface EmergencyRecord extends EmergencySummary {
  ecosystem_name: string | null;
  notes: string | null;
  authority_days: number | null;
  co_signed_at: string | null;
  half_open_entered_at: string | null;
  actions_log: EmergencyLogEntry[];
  updated_at: string | null;
  caller_is_steward: boolean;
  caller_can_cosign: boolean;
  caller_can_withdraw: boolean;
  caller_can_end: boolean;
  caller_can_review: boolean;
  caller_can_complete_recovery: boolean;
}

export interface EmergencyLimits {
  default_authority_days: number;
  max_authority_days: number;
  cosign_window_hours: number;
  review_schedule_days: number;
  recovery_window_days: number;
}

export interface EmergencyOverview {
  current: EmergencyRecord | null;
  active: EmergencyRecord[];
  items: EmergencySummary[];
  total: number;
  page: number;
  per_page: number;
  limits: EmergencyLimits;
  caller_can_declare_in: string[];
}

export interface EmergencyDeclaration {
  ecosystem_id: string;
  reason: string;
  auto_revert_days: number;
}

export interface EmergencyReview {
  outcome: 'scheduled' | 'complete';
  summary: string;
}

export interface ExitView extends ExitListItem {
  coordinator_id: string | null;
  data_export_requested: boolean;
  data_export_completed: string | null;
  departure_notice: string | null;
  re_entry_eligible: boolean;
  updated_at: string | null;
  handoff_max_days: number;
  next_step: string;
  caller_is_leaver: boolean;
  allowed_next: string[];
}

export interface ExitFiling {
  ecosystem_id: string;
  exit_type: 'standard' | 'urgent';
  reason: string | null;
}

export interface PortableRecord {
  format: string;
  generated_at: string;
  memberships: Array<{ ecosystem_id: string; ecosystem: string; member_key: string; display_name: string; role: string; status: string; joined_at: string | null }>;
  proposals_authored: Array<{ ecosystem: string; proposal_id: string; title: string; status: string }>;
  advice_given: Array<{ ecosystem: string; proposal_id: string; proposal: string; date: string | null; advice: string | null }>;
  consent_positions: Array<{ ecosystem: string; proposal_id: string; proposal: string; position: string | null; reason: string | null; round: number | null }>;
  agreements_consented: Array<{ ecosystem: string; agreement_id: string; title: string; version: string; attested_at: string; withdrawn_at: string | null }>;
  omitted: Array<{ ecosystem: string; reason: string }>;
  exit: { id: string; ecosystem_id: string; status: string; exit_type: string; declared_date: string | null; handoff_ends: string | null };
}

// G-ACT: fields added to existing payloads by interface merging (api/AGENTS.md "ACT integrity (G-ACT)").
/** A manual move the server offers the caller now (act_gates.proposal_next_moves). */
export interface ProposalMoveOption {
  to: string;
  /** The move's gate is met (forward moves are offered only when ready). */
  ready: boolean;
  gate: 'advice' | 'consent' | 'test' | null;
  /** Sending back for revision needs a written note. */
  note_required: boolean;
  /** Only an ecosystem steward may make it (confirming ratification). */
  steward_only: boolean;
  /** Shown, not offered: the caller wrote the proposal, so another steward must confirm it; or the caller is a
   *  steward who did not write it, so the proposer closes advice until its deadline has passed. */
  blocked?: 'needs_another_steward' | 'proposer_closes_advice' | null;
}

/** id, key, title, status and version of an agreement a proposal links to. */
export interface AgreementBrief {
  id: string;
  agreement_id: string;
  title: string;
  status: string;
  version?: string;
}

export interface ProposalDetail {
  allowed_next?: ProposalMoveOption[];
  /** The caller's position in the latest consent record. */
  caller_position?: { position: string; reason: string | null } | null;
  /** A steward may register this ratified, unregistered proposal as an agreement. */
  caller_can_register?: boolean;
  amends_agreement_id?: string | null;
  amends_agreement?: AgreementBrief | null;
  registered_agreement_id?: string | null;
  registered_agreement?: AgreementBrief | null;
}

export interface ConsentParticipant {
  member_id?: string | null;
}

export interface AdviceEntry {
  member_id?: string | null;
}

export interface TestReport {
  reporter_member_id?: string | null;
  reporter_name?: string | null;
}

export interface AgreementDetail {
  /** An in-force agreement changes through an amending proposal. */
  caller_can_propose_change?: boolean;
  /** The ratified proposal that created it: its ACT gates were completed there (api/agreements.py). */
  registered_from_proposal?: { id: string; proposal_id: string; title: string } | null;
}

/** A member the page can name and link (/members/:id). */
export interface MemberRef {
  id: string;
  display_name: string;
}

// Pass 02 (ACT lifecycle): what the proposal page needs to say who acts next.
export interface ProposalDetail {
  /** The caller gave advice in the current advice round (the form collapses to a done state). */
  caller_has_advised?: boolean;
  /** The caller filed a test report since the latest send-back. */
  caller_has_reported?: boolean;
  /** The caller's row here waits on the consent gate: they read, but cannot take part yet. */
  caller_consent_pending?: boolean;
  /** In test: the active stewards who may confirm ratification (never the author). */
  ratification_confirmers?: MemberRef[];
}

export interface DecisionDetail {
  /** The agreement its source proposal was registered as, once registered. */
  registered_agreement?: { id: string; agreement_id: string; title: string } | null;
}

/** Extra fields of gates.advice on a proposal (the deadline is a prompt, never a move). */
export interface ActAdviceGateDetail {
  deadline?: string | null;
  deadline_passed?: boolean;
}

/** Extra fields of gates.consent: where the quorum came from and the decision mode. */
export interface ActConsentGateDetail {
  quorum_source?: 'proposal' | 'agreement' | 'default' | 'all_members' | null;
  mode?: 'consent' | 'consensus' | null;
}

export interface RoleGrant {
  /** A role tier change, or a profile change (co_creator/builder carry administration rights). */
  kind?: 'role' | 'profile';
  from_role: string;
  to_role: string;
  date: string;
  /** The granter as they are named now (stored by member id). */
  granted_by: string | null;
}

export interface MemberProfileResponse {
  /** Tiers the caller may give this member now; empty means no picker. */
  caller_assignable_roles?: Array<'user' | 'mod' | 'admin' | 'owner'>;
  /** Profiles the caller may give this member now (whoever could make them an admin); empty means no picker. */
  caller_grantable_profiles?: Array<'co_creator' | 'builder' | 'collaborator' | 'townhall'>;
  /** The profile is the caller's own row in this ecosystem (the picker reads "Step down to"). */
  caller_is_self?: boolean;
  role_history?: RoleGrant[];
}

export interface OnboardingState {
  /** The member themselves or a steward of their ecosystem. */
  caller_can_record?: boolean;
}

// G-Next: "what is waiting for me" and "what happens next here" (neos_agent services/next_steps.py).
// See api/AGENTS.md "Next steps (G-Next)"; the assistant's what_needs_me and explain_status return the same shapes.

export type NextStepKind = 'proposal' | 'agreement' | 'conflict' | 'emergency' | 'exit' | 'audit'
  | 'newcomer' | 'share_need' | 'collaboration'; // FX-Maint: the kinds the registered queue sources emit

/** One thing waiting for the caller (GET /me/next-steps item). `due` is YYYY-MM-DD or an ISO timestamp ending in Z. */
export interface NextStepItem {
  uid: string;
  kind: NextStepKind;
  id: string;
  key: string | null;
  title: string;
  ecosystem_id: string;
  ecosystem: string | null;
  action: string;
  what: string;
  why: string;
  due: string | null;
  overdue: boolean;
  link: string;
}

export interface NextStepsResponse {
  items: NextStepItem[];
  count: number;
}

export type ExplainKind = 'proposal' | 'agreement' | 'conflict' | 'emergency' | 'exit' | 'audit';

/** A move the caller may make now; `ready` false means its gate is not met yet. */
export interface StatusMove {
  move: string;
  label: string;
  ready: boolean;
  blocked: string | null;
}

/** GET /explain/<kind>/<id>: state, what happens next, who decides, by when, the caller's moves. */
export interface StatusExplanation {
  kind: ExplainKind;
  id: string;
  key: string | null;
  title: string;
  ecosystem: string | null;
  status: string;
  state: string;
  next_step: string;
  decided_by: string | null;
  due: string | null;
  due_label: string | null;
  overdue: boolean;
  your_moves: StatusMove[];
  waiting_on_you: NextStepItem[];
  link: string;
}

// G-Maint: agreement review outcomes, per-ecosystem health, the computed snapshot (see AGENTS.md "Maintenance and health").
export type HealthBand = 'healthy' | 'warning' | 'critical';
export type MeasuredUnit = '%' | 'ratio' | 'cycles' | 'per quarter';

export interface AgreementListItem {
  /** In force and its review date has passed; never invalidates the agreement. */
  review_overdue: boolean;
}

export interface AgreementDetail {
  /** While under review: the per-type default for the next review date, and the sunset end date, YYYY-MM-DD. */
  default_next_review_date: string | null;
  sunset_ends_on: string | null;
  caller_can_rollback: boolean;
}

export interface ReviewRecord {
  findings: string | null;
  conducted_by: string | null;
  agreement_version: string | null;
  on_time: boolean | null;
}

export interface AgreementHistory {
  caller_can_rollback: boolean;
}

/** POST /agreements/:id/status: leaving under_review needs findings; renew may set the next review date. */
export interface AgreementStatusChange {
  status: string;
  evidence?: string;
  next_review_date?: string;
}

export interface IndicatorScore {
  unit?: MeasuredUnit | null;
  basis?: string | null;
  band?: HealthBand | null;
  computable?: boolean;
}

export interface GovernanceAudit {
  self_assessment?: boolean;
}

export interface EcosystemHealth {
  ecosystem_id: string;
  ecosystem: string;
  latest_audit: GovernanceAudit | null;
  published_on: string | null;
  /** Null when the ecosystem has no start date and no audit yet (FX-Maint F17). */
  audit_due: string | null;
  audit_overdue: boolean;
  critical_count: number;
  caller_can_record_audit: boolean;
  caller_records_self_assessment: boolean;
}

export interface SafeguardsOverview {
  ecosystems: EcosystemHealth[];
}

export interface HealthIndicatorValue {
  indicator_id: string;
  name: string;
  measured_value: number | null;
  unit: MeasuredUnit | null;
  computable: boolean;
  basis: string;
  band: HealthBand | null;
  thresholds: { healthy: string; warning: string; critical: string };
  higher_is_better: boolean;
  detail: string | null;
}

export interface HealthAttention {
  key: string;
  label: string;
  count: number;
  detail: string | null;
  link: string;
}

/** GET /safeguards/snapshot: values computed from the records, statuses still rated by a person. */
export interface HealthSnapshot {
  ecosystem_id: string;
  ecosystem: string;
  period: { start: string; end: string };
  generated_at: string;
  indicators: HealthIndicatorValue[];
  attention: HealthAttention[];
}

// FX-Maint: closing loops (wave-c F2, F6, F7, domain authority); interface merging onto earlier shapes.
export interface StatusMove {
  /** "consent": the consent act (POST /agreements/:id/consent), never a status move (F2). */
  kind?: 'consent';
}

/** What a steward recorded on an audit: the response to a published one, or why a draft was abandoned. */
export interface AuditStewardRecord {
  note: string;
  recorded_by: string | null;
  date: string | null;
  proposal: { id: string; proposal_id: string; title: string } | null;
}

export interface GovernanceAudit {
  response?: AuditStewardRecord | null;
  abandonment?: AuditStewardRecord | null;
  /** A draft: its auditor or a steward of the ecosystem. */
  caller_can_abandon?: boolean;
  /** A published audit with no response yet: a steward of the ecosystem. */
  caller_can_respond?: boolean;
}

/** POST /safeguards/audits/:id/respond. */
export interface AuditResponseRequest {
  note: string;
  proposal_id?: string;
}

export interface DomainDetail {
  /** A steward of the ecosystem who does not steward this domain: may change its steward or status, with a reason. */
  caller_can_change_authority?: boolean;
}

// G-Exchange: shares, needs and the collaborations they lead to (see client/src/AGENTS.md "Exchange (G-Exchange)").
export type SharesNeedsType = 'share' | 'need' | 'solution';
export type SharesNeedsVisibility = 'public' | 'ecosystem' | 'domain';
export type SharesNeedsStatus = 'active' | 'fulfilled' | 'withdrawn';
/** Why the caller may not answer a post; null when they may. */
export type SharesNeedsRespondBlocked = 'OWN_POST' | 'POST_CLOSED' | 'AUTHOR_INACTIVE' | 'CONSENT_PENDING' | 'MEMBERSHIP_REQUIRED';

/** A status move the author may make now, labelled by the server. */
export interface SharesNeedsMove {
  status: SharesNeedsStatus;
  label: string;
}

export interface SharesNeedsResponder {
  member_id: string;
  name: string;
}

/** One share, need or solution as every exchange read and write returns it, with the caller's flags. */
export interface SharesNeedsPost {
  id: string;
  type: SharesNeedsType;
  title: string;
  description: string | null;
  category: string | null;
  capacity: string | null;
  tags: string[];
  visibility: SharesNeedsVisibility;
  status: SharesNeedsStatus;
  ecosystem_id: string;
  ecosystem_name: string | null;
  domain_id: string;
  domain_name: string | null;
  author_member_id: string | null;
  author_name: string | null;
  created_at: string;
  updated_at: string;
  /** Whole days since it was posted, reopened or kept open. */
  age_days: number;
  status_reason: string | null;
  status_changed_at: string | null;
  fulfilled_by_member_id: string | null;
  fulfilled_by_name: string | null;
  hidden: boolean;
  hidden_reason: string | null;
  hidden_at: string | null;
  hidden_by_name: string | null;
  /** Author and moderators only; null for everyone else. */
  response_count: number | null;
  /** Author only; empty for everyone else. */
  responders: SharesNeedsResponder[];
  caller_is_author: boolean;
  caller_can_edit: boolean;
  /** A steward of the post's ecosystem. */
  caller_can_moderate: boolean;
  caller_can_manage: boolean;
  /** The author, while nobody has answered. */
  caller_can_delete: boolean;
  caller_can_respond: boolean;
  respond_blocked: SharesNeedsRespondBlocked | null;
  caller_has_responded: boolean;
  caller_conversation_id: string | null;
  /** The author's moves now; empty for everyone else. */
  allowed_next: SharesNeedsMove[];
}

/** Fields an author writes on create (plus ecosystem_id/domain_id) and edit. */
export interface SharesNeedsDraft {
  type: SharesNeedsType;
  title: string;
  description: string | null;
  category: string | null;
  capacity: string | null;
  visibility: SharesNeedsVisibility;
  tags?: string[];
}

export interface SharesNeedsStatusChange {
  status: SharesNeedsStatus;
  note?: string;
  fulfilled_by_member_id?: string;
}

export interface SharesNeedsRespondResult {
  conversation_id: string;
  created: boolean;
  post: SharesNeedsPost;
}

export interface ExchangeEcosystemRef {
  id: string;
  name: string;
}

/** GET /discover/shares-needs/admin: posts in the ecosystems the caller stewards. */
export interface SharesNeedsModerationPage extends PaginatedResponse<SharesNeedsPost> {
  stats: { total: number; shares: number; needs: number; solutions: number; active: number; fulfilled: number; withdrawn: number; hidden: number };
  moderated_ecosystems: ExchangeEcosystemRef[];
}

export interface PublicProfileResponse {
  /** GET /profiles/me only: every post the caller wrote, in every status, visibility and hidden state, newest first. */
  own_publications?: SharesNeedsPost[];
}

export type CollaborationStatus = 'proposed' | 'active' | 'completed' | 'dissolved';
export type CollaborationEndOutcome = 'completed' | 'dissolved';

export interface CollaborationSide {
  ecosystem_id: string;
  ecosystem_name: string | null;
}

export interface CollaborationApprovalRecord extends CollaborationSide {
  approved_by: string | null;
  approved_at: string | null;
}

export interface CollaborationLinkedPost {
  id: string;
  title: string;
  type: SharesNeedsType;
  status: SharesNeedsStatus;
}

/** GET /discover/collaborations/:id and every collaboration write. */
export interface CollaborationDetailView {
  id: string;
  title: string;
  description: string | null;
  status: CollaborationStatus;
  engagement_tier: string;
  terms: Record<string, unknown> | null;
  required_agreement_ids: string[];
  source_domain_id: string;
  source_domain_name: string | null;
  source_ecosystem_id: string;
  source_ecosystem_name: string | null;
  target_domain_id: string;
  target_domain_name: string | null;
  target_ecosystem_id: string;
  target_ecosystem_name: string | null;
  started_date: string | null;
  review_date: string | null;
  review_due: boolean;
  created_at: string | null;
  proposed_by_member_id: string | null;
  proposed_by_name: string | null;
  approvals: CollaborationApprovalRecord[];
  awaiting: CollaborationSide[];
  caller_can_approve_for: CollaborationSide[];
  caller_can_end: boolean;
  end_outcomes: CollaborationEndOutcome[];
  ended_by_name: string | null;
  end_reason: string | null;
  ended_at: string | null;
  linked_publications: CollaborationLinkedPost[];
  /** FX-Exchange: a steward of either side may record a review of an active collaboration. */
  caller_can_review: boolean;
  /** The last recorded review: who, what it found, when (it also set `review_date`). */
  reviewed_by_name: string | null;
  review_note: string | null;
  reviewed_at: string | null;
}

/** FX-Exchange: POST /discover/collaborations/:id/review (next review date YYYY-MM-DD; omitted = a year out). */
export interface CollaborationReview {
  note: string;
  next_review_date?: string;
}

export interface CollaborationProposal {
  source_domain_id: string;
  target_domain_id: string;
  title: string;
  description?: string | null;
  engagement_tier?: string;
  terms?: Record<string, unknown> | null;
  /** YYYY-MM-DD */
  review_date?: string;
  linked_share_need_id?: string;
}

// G-Onboard: per-ecosystem membership status on /auth/me, join answers, steward member moves and the newcomers list
// (see client/src/AGENTS.md "Onboarding (G-Onboard)"; shapes of neos_agent api/auth.py, api/ecosystems.py, api/members.py, api/onboarding.py).
export type MembershipRole = 'user' | 'mod' | 'admin' | 'owner';

export interface AuthMeResponse {
  /** Co-creator/builder on the caller's home-ecosystem row (set server-side; never derived from a member profile). */
  is_platform_admin?: boolean;
}

export interface EcosystemSummary {
  /** /auth/me `ecosystems[]` only: the caller's own row status there (active, pending_consent, exited, suspended, ...). */
  membership_status?: string;
  /** /auth/me `ecosystems[]` only: the caller's role tier there. */
  role?: MembershipRole;
  /** /auth/me `ecosystems[]` only (FX-Onboard): the server's "steward of this ecosystem" (mod+ or a founder there). */
  is_steward?: boolean;
}

/** POST /ecosystems/:id/join (201 new membership, 200 an existing row changed). */
export interface JoinEcosystemResponse {
  status: 'joined' | 'consent_required';
  outcome: 'joined' | 'gate_cleared' | 're_entry';
  membership_status: 'active' | 'pending_consent';
  message: string;
  ecosystem_name: string;
  required_agreements: RequiredAgreement[];
}

/** A status move the caller may make on this member now, with the server's own label and confirm sentence. */
export interface MemberMove {
  status: string;
  label: string;
  confirm: string;
}

export interface MemberProfileResponse {
  /** Empty when the caller may make no move. */
  caller_member_moves?: MemberMove[];
}

export type NewcomerOrientationStatus = 'not_started' | 'in_progress' | 'complete' | 'opted_out';

/** GET /onboarding/newcomers item: a pending member, or one who joined in the last 30 days, in an ecosystem the caller stewards. */
export interface NewcomerItem {
  id: string;
  display_name: string;
  ecosystem_id: string;
  ecosystem_name: string;
  current_status: string;
  joined_at: string | null;
  required_agreements: RequiredAgreement[];
  orientation_status: NewcomerOrientationStatus;
  /** Pending with nothing left to consent to: a steward confirms them on their member page. */
  stuck: boolean;
}

export interface NewcomersResponse {
  items: NewcomerItem[];
  total: number;
}
