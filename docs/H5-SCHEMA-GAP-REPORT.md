# H5 — Schema Gap Report: Governance Data Contracts vs. Actual Schema

Date: 2026-07-27
Scope: `supabase/migrations/` (9 files) + `client/src/types/api.ts` (auto-generated from backend Pydantic models). No other sources consulted.

## 0. Sources examined

Migrations (all 9, complete inventory):

| File | Creates/Alters |
|---|---|
| 20260402_create_ethos_user_access.sql | `ethos_user_access(user_id, ethos_id, granted_by, granted_at)` + RLS; references `is_admin(uid)` |
| 20260403_add_did_to_profiles.sql | `profiles.did`, `profiles.public_key` |
| 20260403_create_ctc_handoff.sql | `ctc_handoff(user_id, did, completed_at, badge_summary, team_matches, areas_of_focus, orientation_path, orientation_status, ready_for_neos_den, genplan_payload, genplan_submitted, genplan_submitted_at, updated_at)` |
| 20260406_c1_solution_assignment_settings.sql | `app_settings` seeds: `primary_solution_survey`, `ethos_consent_text` |
| 20260406_c3_ethos_detail_columns.sql | `ethos.phase, map_url, map_type, map_title, external_links` |
| 20260406_rename_ready_for_neos_den.sql | column rename on `ctc_handoff` |
| 20260407_c4_participant_contacts.sql | `participant_contacts(user_id, ethos_id, phone, email, consented_at, ...)` + RLS |
| 20260407_c6_genplan_inputs.sql | `genplan_inputs(user_id, ethos_id, section_key, choice_key, choice_label, output_text, journey_step_id)` + RLS |
| 20260407_c7_ctc_handoff_genplan_columns.sql | no-op (comment only) |

`supabase/functions/`: `admin/set-neos-den-ready`, `ctc/assemble-handoff`, `did/generate`, `participants/list`, `participants/update-contact` — all CTC-handoff scope, none governance-contract relevant (not read further).

Key structural fact: the migrations layer contains **zero** governance-contract tables (no matching, assessments, decisions, proposals, shares/needs, roles). The entire runtime governance contract exists only in `client/src/types/api.ts`, generated from a separate backend's Pydantic models. Verdicts below cite `api.ts:<line>` or `migrations/<file>:<line>`.

## 1. Verdicts per contract item

### A. Guide §6 minimum records

| # | Contract item | Verdict | Evidence |
|---|---|---|---|
| A1 | ecosystem_matching_profile (published agreement/domain refs, dimensions, signal definitions, weights, version, review status) | MISSING | No interface in api.ts; grep `matching|affinity|dimension|signal|weight` = 0 hits; no table in migrations |
| A2 | member_matching_profile (voluntary answers, disclosure selections, selected ecosystems) | MISSING | No interface. Adjacent only: `MemberDetail.skills_offered/skills_needed/interests` api.ts:341-343, `privacy` api.ts:347 (opaque JSON) |
| A3 | affinity_assessment (immutable snapshot: algorithm version, profile version, agreement/domain versions, answers, dimension results, coverage, timestamp, stale state) | MISSING | No interface; no assessment/snapshot/stale fields anywhere in api.ts |
| A4 | matching_correction (correction vs source dispute, disposition, rationale) | MISSING | 0 hits for `correction`/`dispute` in matching context |
| A5 | directory_discovery_consent (separate visibility/contact/revocation per ecosystem, default off) | PARTIAL | `participant_contacts.consented_at` migrations/20260407_c4:8 — per-ethos contact consent only; no visibility grant, no `revoked_at`, no default-off structure; `ethos_consent_text` app_setting (20260406_c1:10-14) is display text, not a consent record; `DiscoverEcosystem` api.ts:726-737 exposes directory data with no consent gate type |

### B. Ceremony / lifecycle

| # | Contract item | Verdict | Evidence |
|---|---|---|---|
| B1 | Positions persisted distinctly (consent/stand_aside/object/withdrawn/pending) | PARTIAL | `CeremonyConsentRequest.position: 'consent'|'stand_aside'|'object'` api.ts:506; withdrawn via `AgreementMemberConsent.withdrawn_at` api.ts:151; `ConsentParticipant.position/objection_text/integration_*` api.ts:264-267. No `pending` state; `OnboardingSectionConsent = boolean \| OnboardingSectionPosition` api.ts:490 allows boolean shorthand that collapses position |
| B2 | Section-by-section consent with consented version | PARTIAL | `OnboardingState.section_consents: Record<string, OnboardingSectionConsent>` api.ts:496 + `uaf_version_consented` api.ts:500 — single global version, not per-section version |
| B3 | 48-hour reflection enforced on server time | PARTIAL | `cooling_off_start/cooling_off_end` exist: `MemberOnboardingSnapshot` api.ts:356-357, `OnboardingState` api.ts:497-498. Types carry no server-vs-client provenance; enforcement not verifiable from client contract (backend behavior, §3) |
| B4 | 7-day post-signature withdrawal window | PARTIAL | `AgreementMemberConsent.withdrawn_at` api.ts:151 records withdrawal; no window/deadline field (no `withdrawal_deadline`, no consent+7d computed value) |
| B5 | Lifecycle prospective->onboarding->active, independent per ecosystem | PARTIAL | Per-ecosystem rows: `MemberListItem.ecosystem_id` api.ts:327 + `current_status` api.ts:329 + `onboarding_status` api.ts:333; `MemberStatusTransition` api.ts:879-883. Status vocabulary is untyped `string`; the three named states are not in the contract |

### C. Decision receipts (lead-UX direction)

| # | Contract item | Verdict | Evidence |
|---|---|---|---|
| C1 | Proposals attach only to ecosystem/domain | EXISTS | `ProposalListItem.ecosystem_id` api.ts:228, `affected_domain` api.ts:235; `ProposalDetail.shared_ecosystem_ids` api.ts:300 |
| C2 | Resolution produces agreements/shares/needs | PARTIAL | `DecisionDetail.artifact_type/artifact_reference` api.ts:569-570 and `related_records` api.ts:573 are untyped; no typed outcome-ID linkage from decision to produced agreement/share/need |
| C3 | Immutable receipt linking proposal version + positions + outcome IDs | MISSING | No receipt interface. `ConsentRecord` api.ts:271-279 has positions + outcome but no proposal_version, no outcome IDs, no immutability marker |
| C4 | Share lifecycle (offered/accepted/active/consumed/expired/revoked) | PARTIAL | `SharesNeeds.status: string` api.ts:765, `type: 'share'|'need'|'solution'` api.ts:758; lifecycle vocabulary and per-transition timestamps absent from contract |
| C5 | Need fulfillment receipts (need x member x deliverable x verifier) | MISSING | 0 hits for `fulfillment|fulfilment`; no interface |

### D. Role tiers

| # | Contract item | Verdict | Evidence |
|---|---|---|---|
| D1 | Per-ecosystem membership roles user->mod->admin->owner, distinct from platform admin | MISSING | No role field on `MemberListItem`/`MemberDetail`. Adjacent: `TeamMember.role` api.ts:986 (team scope), `EthosAccessStatus.role_in_ethos/access_level` api.ts:939-940 (ethos scope), `ConversationDetail.participants[].role` api.ts:653 (chat scope). Platform flag: `is_admin(auth.uid())` in RLS policies, migrations/20260402:16,19 and 20260407_c6:27 |

### E. Collaboration agreements

| # | Contract item | Verdict | Evidence |
|---|---|---|---|
| E1 | `shared_ecosystem_ids` on AgreementDetail | EXISTS | api.ts:156 |
| E2 | Active only after admin consent from the OTHER ecosystem (activation/consent state) | PARTIAL | No per-ecosystem activation/consent field on `AgreementDetail` (single `status` api.ts:114). Analogous machinery at domain level: `Collaboration.status` api.ts:777 + `awaiting_ecosystem_id` api.ts:781 + `required_agreement_ids` api.ts:780 |

### F. Entry quizzes

| # | Contract item | Verdict | Evidence |
|---|---|---|---|
| F1 | `is_entry_quiz` flag | EXISTS | `QuizListItem.is_entry_quiz` api.ts:677; `QuizEcosystemAssignResult.is_entry_quiz` api.ts:682 |
| F2 | Enforcement as membership requirement | MISSING | No linkage from entry-quiz pass to membership activation on `MemberListItem`/`MemberOnboardingSnapshot`; `QuizStatusItem.is_passed` api.ts:366 is per-quiz status only; `QuizAssignment` api.ts:990-1001 is assignment tracking, not gating |

### G. Assessment staleness

| # | Contract item | Verdict | Evidence |
|---|---|---|---|
| G1 | Source change marks assessments outdated; snapshots never overwritten | MISSING | No assessment types exist (A3). Versioning primitives that could drive staleness do exist: `version_fingerprint` on `AgreementVersionRecord` api.ts:212, `DomainListItem` api.ts:520, `Collaboration` api.ts:785, `ComplianceSummary` api.ts:802 |

### Verdict summary

EXISTS: C1, E1, F1 (3)
PARTIAL: A5, B1, B2, B3, B4, B5, C2, C4, E2 (9)
MISSING: A1, A2, A3, A4, C3, C5, D1, F2, G1 (9)

## 2. Migration plan (ordered)

Note: the existing 9 migrations are a CTC handoff layer; the governance schema lives behind the Pydantic backend. The sketches below are proposed for whichever Postgres owns the governance tables. New tables vs alterations marked.

Order rationale: (1)-(5) are the guide §6 minimum records and are additive/no-risk; (6)-(8) extend the consent/decision core; (9)-(10) shares/needs lifecycle; (11) roles; (12)-(13) activation gates; (14) staleness wiring last (depends on 3).

### (1) ecosystem_matching_profile — NEW TABLE (A1)

```sql
CREATE TABLE ecosystem_matching_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ecosystem_id UUID NOT NULL REFERENCES ecosystems(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','published','archived')),
  agreement_refs UUID[] NOT NULL DEFAULT '{}',   -- published agreement ids
  domain_refs UUID[] NOT NULL DEFAULT '{}',      -- published domain ids
  dimensions JSONB NOT NULL DEFAULT '[]',        -- [{key,label,definition}]
  signal_definitions JSONB NOT NULL DEFAULT '[]',-- [{key,source,definition}]
  weights JSONB NOT NULL DEFAULT '{}',           -- {dimension_key: weight}
  review_status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (review_status IN ('pending_review','approved','rejected')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ecosystem_id, version)
);
```

### (2) member_matching_profile — NEW TABLE (A2)

```sql
CREATE TABLE member_matching_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  profile_version TEXT NOT NULL,
  voluntary_answers JSONB NOT NULL DEFAULT '{}',
  disclosure_selections JSONB NOT NULL DEFAULT '{}', -- {field_key: visibility_scope}
  selected_ecosystem_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(member_id, profile_version)
);
```

### (3) affinity_assessment — NEW TABLE, append-only (A3, G1)

```sql
CREATE TABLE affinity_assessment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  ecosystem_id UUID NOT NULL REFERENCES ecosystems(id) ON DELETE CASCADE,
  algorithm_version TEXT NOT NULL,
  profile_version TEXT NOT NULL,             -- member_matching_profile version used
  agreement_versions JSONB NOT NULL DEFAULT '{}', -- {agreement_id: version}
  domain_versions JSONB NOT NULL DEFAULT '{}',    -- {domain_id: version_fingerprint}
  answers JSONB NOT NULL DEFAULT '{}',            -- immutable input snapshot
  dimension_results JSONB NOT NULL DEFAULT '{}',
  coverage NUMERIC(5,4),                       -- fraction of dimensions answered
  is_stale BOOLEAN NOT NULL DEFAULT false,     -- G1: set by source-change trigger
  superseded_by UUID REFERENCES affinity_assessment(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now() -- assessment timestamp
);
-- Immutability: REVOKE UPDATE/DELETE on affinity_assessment FROM app_role;
-- corrections land in matching_correction (4), never edits here.
```

### (4) matching_correction — NEW TABLE (A4)

```sql
CREATE TABLE matching_correction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES affinity_assessment(id),
  kind TEXT NOT NULL CHECK (kind IN ('correction','source_dispute')),
  rationale TEXT NOT NULL,
  disposition TEXT NOT NULL DEFAULT 'open'
    CHECK (disposition IN ('open','accepted','rejected','superseded')),
  resolved_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
```

### (5) directory_discovery_consent — NEW TABLE (A5)

Distinct from `participant_contacts` (which is contact-detail sharing inside an ethos). Default off via insert-only-when-granted + explicit flags.

```sql
CREATE TABLE directory_discovery_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  ecosystem_id UUID NOT NULL REFERENCES ecosystems(id) ON DELETE CASCADE,
  visibility_granted BOOLEAN NOT NULL DEFAULT false,
  contact_granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,                      -- revocation = set revoked_at + flags false
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(member_id, ecosystem_id)
);
```

### (6) member_section_consents — NEW TABLE (B1, B2) — replaces boolean-capable JSONB

`OnboardingState.section_consents` (api.ts:496) currently permits `boolean | position`. Persist normalized rows instead; keep JSONB as read cache if desired.

```sql
CREATE TABLE member_section_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  ecosystem_id UUID NOT NULL REFERENCES ecosystems(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  position TEXT NOT NULL DEFAULT 'pending'
    CHECK (position IN ('pending','consent','stand_aside','object','withdrawn')),
  objection_text TEXT,
  consented_version TEXT NOT NULL,             -- per-section version (fixes B2)
  consented_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  UNIQUE(member_id, ecosystem_id, section_key)
);
```

### (7) onboarding cooling-off provenance — ALTER (B3)

```sql
ALTER TABLE member_onboarding              -- existing table behind MemberOnboardingSnapshot
  ADD COLUMN IF NOT EXISTS cooling_off_start TIMESTAMPTZ,   -- server-set only
  ADD COLUMN IF NOT EXISTS cooling_off_end   TIMESTAMPTZ    -- server-set only (= start + 48h)
;
-- Both columns must be written by the backend with now() (server clock), never from client payloads.
```

### (8) agreement_member_consent withdrawal window — ALTER (B4)

```sql
ALTER TABLE agreement_member_consent       -- existing table behind AgreementMemberConsent
  ADD COLUMN IF NOT EXISTS withdrawal_deadline TIMESTAMPTZ;  -- = attested_at + interval '7 days', server-computed
```

### (9) decision_receipts — NEW TABLE (C2, C3)

```sql
CREATE TABLE decision_receipt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- receipt id
  proposal_id UUID NOT NULL REFERENCES proposals(id),
  proposal_version TEXT NOT NULL,                 -- pinned version at resolution
  ecosystem_id UUID NOT NULL REFERENCES ecosystems(id),
  positions_snapshot JSONB NOT NULL,              -- [{member_id, position, objection_text, at}]
  outcome_agreement_ids UUID[] NOT NULL DEFAULT '{}',
  outcome_share_ids UUID[] NOT NULL DEFAULT '{}',
  outcome_need_ids UUID[] NOT NULL DEFAULT '{}',
  decision_record_id UUID REFERENCES decision_records(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- REVOKE UPDATE/DELETE on decision_receipt FROM app_role;  -- immutable
```

### (10) shares/needs lifecycle + fulfillment — ALTER + NEW TABLE (C4, C5)

```sql
ALTER TABLE shares_needs                     -- existing table behind SharesNeeds
  ALTER COLUMN status SET DEFAULT 'offered',
  ADD CONSTRAINT shares_needs_status_check
    CHECK (status IN ('offered','accepted','active','consumed','expired','revoked')),
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

CREATE TABLE need_fulfillment_receipt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id UUID NOT NULL REFERENCES shares_needs(id),       -- type='need' row
  fulfilled_by_member_id UUID NOT NULL REFERENCES members(id),
  deliverable_ref TEXT NOT NULL,                            -- link/id of deliverable
  verifier_member_id UUID REFERENCES members(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(need_id, fulfilled_by_member_id, deliverable_ref)
);
```

### (11) membership role tiers — ALTER (D1)

```sql
ALTER TABLE members                          -- existing table behind MemberListItem
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user','mod','admin','owner'));
-- Distinct from platform-level is_admin() already used in RLS
-- (migrations/20260402:16,19; 20260407_c6:27). Do not reuse that flag.
```

### (12) agreement cross-ecosystem activation — NEW TABLE (E2)

```sql
CREATE TABLE agreement_ecosystem_activation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES agreements(id),
  ecosystem_id UUID NOT NULL REFERENCES ecosystems(id),   -- the OTHER ecosystem
  consented_by UUID REFERENCES members(id),               -- that ecosystem's admin
  consented_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','consented','declined','revoked')),
  UNIQUE(agreement_id, ecosystem_id)
);
-- Agreement becomes active only when all rows for its shared_ecosystem_ids are 'consented'.
```

### (13) entry-quiz gating — ALTER (F2)

```sql
ALTER TABLE member_onboarding
  ADD COLUMN IF NOT EXISTS entry_quiz_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS entry_quiz_passed_at TIMESTAMPTZ;
-- Activation to 'active' requires entry_quiz_required=false OR entry_quiz_passed_at NOT NULL.
```

### (14) staleness trigger — NEW TRIGGER (G1, depends on 3)

```sql
-- When an agreement version or domain version_fingerprint changes, mark dependent
-- assessments stale. Historical rows are never updated except is_stale/superseded_by.
CREATE OR REPLACE FUNCTION mark_assessments_stale() RETURNS trigger AS $$
BEGIN
  UPDATE affinity_assessment
     SET is_stale = true
   WHERE ecosystem_id = NEW.ecosystem_id
     AND is_stale = false
     AND (agreement_versions ? NEW.id::text OR domain_versions ? NEW.id::text);
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
-- Attach to agreement_versions and domains on version change.
```

## 3. Backend behaviors required (for the API owner)

1. Server-time 48h reflection: set `cooling_off_start = now()`, `cooling_off_end = now() + 48h` on consent submission; reject activation requests where `now() < cooling_off_end`. Never accept client-supplied timestamps. (B3)
2. Idempotent join: ecosystem join endpoint must be safe to retry — unique constraint on `(member_id, ecosystem_id)` for membership + `ON CONFLICT DO NOTHING`/upsert semantics; return the existing membership on conflict.
3. Withdrawal endpoint: `POST /agreements/{id}/withdraw` — allowed only while `now() <= attested_at + 7 days`; sets `withdrawn_at`, records `withdrawal_deadline` at attestation time. (B4)
4. Role-tier enforcement: per-ecosystem `members.role` checked server-side for mod/admin/owner actions; orthogonal to the platform `is_admin()` RLS flag. (D1)
5. Assessment immutability: no UPDATE of `affinity_assessment` content columns; only `is_stale`/`superseded_by` mutable; disputes go through `matching_correction` insert + disposition flow. (A3, A4, G1)
6. Staleness marking: any publish of a new agreement version or domain version triggers `is_stale=true` on dependent assessments; assessment reads must surface stale state. (G1)
7. Collaboration activation gate: shared agreement activates only after `agreement_ecosystem_activation.status='consented'` for every ecosystem in `shared_ecosystem_ids`; consent must come from a member with admin/owner role in the OTHER ecosystem. (E2, D1)
8. Entry-quiz gate: member cannot transition to `active` in an ecosystem with an entry quiz until a passed `QuizResultItem` exists for it. (F2)
9. Directory consent default-off: discovery/directory endpoints must exclude members without `visibility_granted=true AND revoked_at IS NULL` per ecosystem; revocation endpoint sets `revoked_at` and clears grants atomically. (A5)
10. Decision receipt issuance: on proposal resolution, write one immutable `decision_receipt` pinning proposal version, positions snapshot, and produced agreement/share/need IDs. (C3)
11. Position vocabulary: stop accepting bare boolean section consents; require the enum (`pending|consent|stand_aside|object|withdrawn`) and persist per-section `consented_version`. (B1, B2)

## 4. Items not verifiable from the two sources

- Whether `cooling_off_start/end` are server-set today (B3): types expose them as nullable strings with no provenance.
- Actual status vocabularies for `MemberListItem.current_status`/`onboarding_status`, `SharesNeeds.status`, `AgreementListItem.status` (B5, C4): all untyped `string` in the client contract.
- Whether `ConsentRecord`/`DecisionDetail` rows are treated as immutable by the backend (C3): no contract-level marker exists.
- The base (pre-20260402) Supabase schema for `profiles`, `ethos`, `app_settings` and the `is_admin()` function — referenced by migrations but defined outside the examined sources.
