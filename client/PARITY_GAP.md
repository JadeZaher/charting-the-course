# Parity Gap Analysis

> Diff of `API_INVENTORY.md` against `CLIENT_CALLS.md` — 2026-06-10

## 🔴 Critical Gaps (No Client Wrapper + No UI)

| # | Backend Endpoint | Severity | Notes |
|---|-----------------|----------|-------|
| 1 | ⚠ `POST /api/v1/emergency/:id/complete-recovery` | **CRITICAL** | In-progress S2 patch. No client wrapper, no UI. Recovery finalization flow. |
| 2 | `POST /api/v1/notifications/subscribe` | HIGH | No client wrappers at all for notifications API (4 endpoints) |
| 3 | `DELETE /api/v1/notifications/subscribe` | HIGH | Unsubscribe flow missing |
| 4 | `GET /api/v1/notifications/preferences` | HIGH | Preferences read missing |
| 5 | `PUT /api/v1/notifications/preferences` | HIGH | Preferences write missing |
| 6 | `POST /api/v1/members/:id/status` | HIGH | Member status transition — no client wrapper, no UI |
| 7 | `PUT /api/v1/conflicts/:id/repair/:repair_id` | MEDIUM | Repair agreement update (check-ins) — no client wrapper, no dedicated UI |
| 8 | `GET /api/v1/ecosystems/:id/quiz-results` | MEDIUM | Ecosystem quiz results view — no client wrapper |
| 9 | `GET /api/v1/domains/:id/quiz-results` | MEDIUM | Domain quiz results view — no client wrapper |
| 10 | `PUT /api/v1/courses/:id` | LOW | Course update — no client wrapper |
| 11 | `GET /api/v1/chat/shared/:token` | LOW | Shared chat session view — no client wrapper |
| 12 | `GET /api/v1/orientation/ethos/:id` | LOW | Ethos detail endpoint — no client wrapper |
| 13 | `GET /api/v1/orientation/journey-maps` | LOW | All journey maps list — no client wrapper |
| 14 | `GET /api/v1/orientation/journey-maps/:id` | LOW | Single journey map detail — no client wrapper |
| 15 | `POST /api/v1/orientation/journey-maps/:id/deactivate` | LOW | Journey map deactivation — no client wrapper |

## 🟡 UI Parity Gaps (API Wrapper Exists but Component Lacking)

| Area | Status | Backend Covered | Client API | UI |
|------|--------|---------------|------------|-----|
| **Conflict triage panel** | Missing dedicated UI | `PUT /conflicts/:id` | `updateConflict()` | No triage-specific modal/flow |
| **Governance health audit request** | Basic page exists | `POST /safeguards/audits` | `requestAudit()` | `SafeguardsDashboard` + `AuditList` exist but no audit-request form with health indicators |
| **Exit data export** | Missing UI flow | Fields on ExitRecord | `updateExitStatus()` | No export request/completion tracking UI in ExitDetail |
| **Emergency recovery** | Missing entire flow | `POST /emergency/:id/complete-recovery` ⚠ S2 | MISSING | MISSING |

## Priority Ranking for Component Build

1. ⚠ **Emergency Complete Recovery** — S2 in-progress, highest priority
2. **Exit Data Export Flow** — Modal/page to track data_export_requested/completed
3. **Governance Health Audit Request** — Audit request form with health indicator preview
4. **Conflict Triage Modal** — Dedicated triage form (severity, urgency, scope, tier, root_cause_category, facilitator)
5. **Notifications Management** — Subscribe/unsubscribe preferences page
6. **Repair Agreement Check-in** — 30/60/90-day check-in modal
