# Backend API Inventory

> Auto-generated from `neos-operating-system/agent/src/neos_agent/api/` — read-only snapshot 2026-06-10

## Health

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/api/v1/health` | GET | No | — | `{status, skills_loaded, skills_available, database, version}` |

## Skills

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/api/v1/skills` | GET | No | `?layer=N` | `{count, skills: [{name, description, layer, version, depends_on}]}` |

## Auth (`/api/v1/auth`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/challenge` | POST | No | `{did}` | `{challenge}` |
| `/verify` | POST | No | `{did, challenge, signature, display_name?}` | AuthVerifyResponse + cookie |
| `/me` | GET | Session | — | `{user, member, ecosystems}` |
| `/logout` | POST | Session | — | `{success}` |
| `/login` | POST | No | `{username, password}` | AuthVerifyResponse + cookie |
| `/register` | POST | No | `{username, password, display_name?}` | AuthVerifyResponse + cookie |
| `/did/reset` | POST | Session | — | `{success, message}` |
| `/did/link` | POST | Session | `{did, challenge, signature}` | `{success, did}` |
| `/set-credentials` | POST | Session | `{username, password}` | `{success, username}` |

## OAuth (`/api/v1/auth/oauth`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/providers` | GET | No | — | `{providers: [{id, name}]}` |
| `/:provider` | GET | No | — | `{url}` |
| `/:provider/callback` | GET | No | `?code=&error=` | 302 redirect (server-side only) |

## Ecosystems (`/api/v1/ecosystems`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/` | GET | Session | `?status=&q=&page=&per_page=` | `{ecosystems, total, page, per_page}` |
| `/:id` | GET | Session | — | EcosystemDetail |
| `/` | POST | Session | EcosystemCreateRequest | EcosystemDetail (201) |
| `/:id` | PUT | Session | EcosystemUpdateRequest | EcosystemDetail |
| `/:id/join` | POST | Session | — | `{status, message}` |
| `/:id/quizzes` | GET | Session | — | `{quizzes: [...]}` |
| `/:id/quizzes/assign` | POST | Session | `{quiz_id, is_entry_quiz}` | `{status, quiz_id, is_entry_quiz}` |
| `/:id/quizzes/unassign` | POST | Session | `{quiz_id}` | `{status, quiz_id}` |
| `/:id/quiz-results` | GET | Session | — | `{results: [...]}` |
| `/:id/shares-needs` | GET | Session | `?type=&category=&status=` | `{items: [...]}` |

## Dashboard (`/api/v1/dashboard`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/summary` | GET | Session | — | DashboardSummary `{cards, activity}` |

## Agreements (`/api/v1/agreements`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/` | GET | Session | `?type=&status=&domain=&q=&page=&per_page=` | PaginatedResponse |
| `/:id` | GET | Session | — | AgreementDetail |
| `/` | POST | Session | AgreementCreateRequest | AgreementDetail (201) |
| `/:id` | PUT | Session | AgreementUpdateRequest | AgreementDetail |
| `/:id/status` | POST | Session | `{status}` | AgreementDetail |
| `/:id/history` | GET | Session | — | AgreementHistory `{amendments, reviews, versions}` |
| `/:id/rollback/:version_id` | POST | Session | — | AgreementDetail |

## Proposals (`/api/v1/proposals`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/` | GET | Session | `?phase=&type=&domain=&urgency=&q=&page=&per_page=` | PaginatedResponse |
| `/:id` | GET | Session | — | ProposalDetail |
| `/` | POST | Session | ProposalCreateRequest | ProposalDetail (201) |
| `/:id` | PUT | Session | ProposalUpdateRequest | ProposalDetail |
| `/:id/status` | POST | Session | `{status}` | ProposalDetail |
| `/:id/advice` | GET | Session | — | `{advice_logs}` |
| `/:id/advice` | POST | Session | AdviceEntryCreateRequest | AdviceLog (201) |
| `/:id/consent` | GET | Session | — | `{consent_records}` |
| `/:id/consent` | POST | Session | ConsentPositionRequest | ConsentRecord (201) |
| `/:id/test` | GET | Session | — | `{test_reports}` |
| `/:id/test` | POST | Session | TestReportCreateRequest | TestReport (201) |

## Members (`/api/v1/members`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/` | GET | Session | `?status=&profile=&q=&page=&per_page=` | PaginatedResponse |
| `/:id` | GET | Session | — | MemberDetail |
| `/:id/profile` | GET | Session | — | MemberProfileResponse (with quiz_summary, badges, tags) |
| `/` | POST | Session | MemberCreateRequest | MemberDetail (201) |
| `/:id` | PUT | Session | MemberUpdateRequest | MemberDetail |
| `/:id/status` | POST | Session | `{status, trigger?, notes?}` | MemberDetail |
| `/:id/onboarding` | GET | Session | — | OnboardingChecklistItem |

## Domains (`/api/v1/domains`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/` | GET | Session | `?status=&q=&page=&per_page=` | PaginatedResponse |
| `/:id` | GET | Session | — | DomainDetail |
| `/` | POST | Session | DomainCreateRequest | DomainDetail (201) |
| `/:id` | PUT | Session | DomainUpdateRequest | DomainDetail |
| `/:id/quizzes` | GET | Session | — | `{items, total}` |
| `/:id/quizzes/assign` | POST | Session | `{quiz_id, is_entry_quiz}` | `{success, quiz_id, domain_id}` |
| `/:id/quizzes/unassign` | POST | Session | `{quiz_id}` | `{success, quiz_id}` |
| `/:id/quiz-results` | GET | Session | — | `{items, total}` |
| `/:id/shares-needs` | GET | Session | `?type=&category=&status=` | `{items}` |

## Decisions (`/api/v1/decisions`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/` | GET | Session | `?status=&domain=&source_layer=&q=&page=&per_page=` | PaginatedResponse |
| `/:id` | GET | Session | — | DecisionDetail |

## Onboarding (`/api/v1/onboarding`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/` | GET | Session | `?page=&per_page=` | `{items, total, page, per_page}` |
| `/:member_id/ceremony` | GET | Session | — | CeremonyState |
| `/:member_id/ceremony` | POST | Session | `{section, consented, position?, objection_text?}` | CeremonyState |

## Conflicts (`/api/v1/conflicts`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/` | GET | Session | `?status=&severity=&urgency=&q=&page=&per_page=` | PaginatedResponse |
| `/:id` | GET | Session | — | ConflictDetail |
| `/` | POST | Session | ConflictCreateRequest | ConflictDetail (201) |
| `/:id` | PUT | Session | ConflictUpdateRequest | ConflictDetail |
| `/:id/repair` | POST | Session | RepairCreateRequest | RepairAgreementSchema (201) |
| `/:id/repair/:repair_id` | PUT | Session | RepairUpdateRequest | RepairAgreementSchema |

## Emergency (`/api/v1/emergency`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/` | GET | Session | `?page=&per_page=` | `{current, items, total, page, per_page}` |
| `/:id` | GET | Session | — | EmergencyDetail |
| `/declare` | POST | Session | `{ecosystem_id, declared_by, reason?, auto_revert_days}` | EmergencyDetail (201) |
| `/:id/resolve` | POST | Session | — | EmergencyDetail |
| ⚠ `/:id/complete-recovery` | POST | Session | — (requires post_review_status=="complete") | EmergencyDetail | **⚠ in-progress (S2)** |

## Exit (`/api/v1/exit`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/` | GET | Session | `?status=&exit_type=&q=&page=&per_page=` | PaginatedResponse |
| `/:id` | GET | Session | — | ExitDetail |
| `/` | POST | Session | ExitCreateRequest | ExitDetail (201) |
| `/:id/status` | POST | Session | `{new_status}` | ExitDetail |

## Safeguards (`/api/v1/safeguards`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/` | GET | Session | — | HealthSummary `{latest_audit, recent_audits, health_score, indicator_scores, triggered_safeguards}` |
| `/audits` | GET | Session | `?status=&overall_health=&q=&page=&per_page=` | PaginatedResponse |
| `/audits/:id` | GET | Session | — | AuditDetail |
| `/audits` | POST | Session | `{ecosystem_id, auditor}` | AuditDetail (201) |

## Messaging (`/api/v1/messaging`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/conversations` | GET | Session | — | `{conversations}` |
| `/conversations/:id` | GET | Session | — | ConversationDetail |
| `/conversations` | POST | Session | `{type, title?, participant_ids}` | ConversationDetail (201) |
| `/conversations/:id/messages` | POST | Session | `{content}` | MessageSchema (201) |
| `/conversations/:id/messages` | GET | Session | `?page=&per_page=` | `{messages, total}` |
| `/search` | GET | Session | `?q=` | `{messages}` |
| `/members` | GET | Session | — | `{members}` |

## Courses (`/api/v1/courses`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/` | GET | Session | `?q=&page=&per_page=` | PaginatedResponse |
| `/:id` | GET | Session | — | CourseDetail |
| `/` | POST | Session | CourseCreateRequest | CourseListItem (201) |
| `/:id` | PUT | Session | CourseUpdateRequest | CourseListItem |

## Quizzes (`/api/v1/quizzes`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/` | GET | Session | `?course_id=&ecosystem_id=&domain_id=&visibility=&is_published=&q=&page=&per_page=` | PaginatedResponse |
| `/:id` | GET | Session | — | QuizDetail |
| `/` | POST | Session | QuizCreateRequest | QuizListItem (201) |
| `/:id` | PUT | Session | QuizUpdateRequest | QuizListItem |
| `/:id` | DELETE | Session | — | `{ok, message}` |
| `/:id/submit` | POST | Session | `{survey_results, time_spent}` | `{result, grading}` |
| `/:id/results` | GET | Session | `?page=&per_page=` | `{items, total, page, per_page}` |
| `/:id/results/all` | GET | Session | `?page=&per_page=` | `{items, quiz_title, total}` (admin, with member_name) |

## Member Quiz/Badge/Tag (`/api/v1/members`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/:member_id/quiz-history` | GET | Session | — | `{results, total}` |
| `/:member_id/badges` | GET | Session | — | `{items}` |
| `/:member_id/tags` | GET | Session | — | `{items}` |

## Chat (`/api/v1/chat`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/sessions` | GET | Session | `?q=&limit=&offset=` | `{sessions}` |
| `/sessions/:id` | GET | Session | — | `{id, title, skill, privacy, share_token, messages, created_at, updated_at}` |
| `/sessions/:id` | DELETE | Session | — | `{ok}` |
| `/sessions/:id/privacy` | PATCH | Session | `{privacy}` | `{privacy, share_token}` |
| `/send` | POST (SSE) | Session | `{message, page_context?, history?, active_skill?, session_id?}` | SSE stream |
| `/shared/:token` | GET | Session | — | `{id, title, privacy, messages, created_at}` |

## Discover (`/api/v1/discover`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/` | GET | Session | `?q=&tab=&mode=&tag=&page=&per_page=` | `{quizzes?, ecosystems?}` |
| `/shares-needs` | GET | Session | `?q=&type=&category=&ecosystem_id=&page=&per_page=` | `{items, total, page, per_page}` |
| `/shares-needs/admin` | GET | Session (admin) | `?q=&type=&category=&status=&ecosystem_id=&page=&per_page=` | `{items, total, page, per_page, stats}` |
| `/shares-needs` | POST | Session | `{ecosystem_id, domain_id, type, title, ...}` | SharesNeeds (201) |
| `/shares-needs/:id` | PUT | Session | `{title?, description?, ...}` | SharesNeeds |
| `/shares-needs/:id/status` | POST | Session | `{status}` | SharesNeeds |
| `/shares-needs/:id` | DELETE | Session | — | `{ok, message}` |
| `/collaborations` | GET | Session | `?q=&status=&engagement_tier=&page=&per_page=` | `{items, total, page, per_page}` |
| `/collaborations` | POST | Session | `{source_domain_id, target_domain_id, title, ...}` | Collaboration (201) |

## Compliance (`/api/v1/compliance`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/generate` | POST | Session | — | ComplianceSummary (201) |
| `/latest` | GET | Session | — | ComplianceSummary |
| `/history` | GET | Session | `?page=&per_page=` | `{items, total, page, per_page}` |

## AI Assist (`/api/v1/ai`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/assist` | POST | Session | `{field_label, field_context, current_text, action}` | `{text}` |

## Notifications (`/api/v1/notifications`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/subscribe` | POST | Session | `{endpoint, keys: {p256dh, auth}, notification_types?}` | `{status}` (201) |
| `/subscribe` | DELETE | Session | `{endpoint}` | 204 |
| `/preferences` | GET | Session | — | `{notification_types}` |
| `/preferences` | PUT | Session | `{notification_types}` | `{status, notification_types}` |

## Orientation (`/api/v1/orientation`)

| Endpoint | Method | Auth | Payload | Response |
|----------|--------|------|---------|----------|
| `/ethos/:id` | GET | Session | — | Ethos detail `{id, name, slug, description, sector, member_count, tags, governance_summary}` |
| `/ethos/:id/journey-maps` | GET | Session | `?include_inactive=` | `[{id, slug, title, ...}]` |
| `/journey-maps` | GET | Session | `?ethos_id=&is_active=` | `{maps: [...]}` |
| `/journey-maps/:id` | GET | Session | — | JourneyMap detail |
| `/ethos/:id/journey-maps` | POST | Session | `{title, slug?, content_sequence, ...}` | JourneyMap (201) |
| `/journey-maps/:id` | PUT | Session | `{title?, description?, ...}` | JourneyMap |
| `/journey-maps/:id` | DELETE | Session | — | `{ok, message}` |
| `/journey-maps/:id/deactivate` | POST | Session | — | `{ok, message}` |
| `/ethos/:id/progress` | GET | Session | — | UserJourneyProgress |
| `/ethos/:id/progress` | POST | Session | `{journey_map_id?, current_step?, ...}` | Progress summary |
| `/genplan-input` | POST | Session | any | `{status, received}` |

---

## Summary

- **Total endpoints**: ~98 unique route patterns
- **Auth required**: ~95 (only `/health`, `/skills`, and auth challenge/verify/login/register are public)
- **⚠ in-progress**: `POST /api/v1/emergency/:id/complete-recovery` (S2 patch, uncommitted)
