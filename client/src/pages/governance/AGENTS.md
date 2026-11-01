# Governance pages

## Caller flags drive controls

Governance detail payloads describe what the signed-in caller may do. Pages
render controls from these flags and never infer permissions from the profile
role or from local component state. The server enforces every rule (see
`neos-operating-system/agent/src/neos_agent/api/AGENTS.md`).

Proposals (`ProposalDetail`):

- `caller_can_conduct`: may participate (advice, consent, test).
- `caller_can_manage`: may edit and make manual status moves. This is the
  author or an ecosystem steward. Edit and the lifecycle action buttons render
  only when it is true.
- `caller_is_proposer`: during advice, the proposer sees "You are the proposer:
  advice from others appears here" instead of the advice form and the "Your
  input is needed" banner. The server refuses self-advice with 409.
- `allowed_next`: the manual moves this caller may make now, from the server's
  lifecycle table (`ready` = gate met). The page draws buttons from it through
  `groupProposalMoves` and keeps no copy of the table.
- `caller_position`: the caller's position in the current consent round. The
  consent tab shows "You recorded Object" with "Change my position" and
  "Withdraw my objection"; there is no member-name field (the server records the
  caller, one position per member).
- `caller_can_register`: a steward may register this ratified proposal.
- `caller_has_advised` / `caller_has_reported`: the advice and test forms start
  collapsed to a done state ("You advised in this round" with an explicit "Add
  more advice"; "You filed a test report" with "File another report"), and the
  input panel stops saying "Your input is needed".
- `caller_consent_pending`: the read-only note says the membership waits on
  the consent gate instead of "not a member".
- `ratification_confirmers`: "Another steward needs to confirm this" names
  them, each linking to `/members/:id`.

Agreements: `registered_from_proposal` makes `ActGatesPanel` say the proposal
completed advice, consent and test (with a link) instead of showing the
agreement's own (never run) gates as pending; member consent there is labelled
"Member attestation", not a gate.

Members (`MemberDetail` -> `components/governance/MemberRoleCard`):
`caller_assignable_roles` is the role picker (empty: no picker, and the card
says why) and `role_history` the recorded grants. Onboarding
(`OnboardingCeremony`): `caller_can_record` gates the section buttons.
Agreements: `caller_can_propose_change` shows "Propose a change", which opens
`/proposals/new?amends=<id>` pre-filled with the agreement's text.

Domains (`DomainDetail`, `DomainList`):

- `caller_is_participant`: show "You participate in this domain" instead of
  Join. Never track this with a local `joined` flag, because it resets on
  reload.
- `caller_is_steward`: show "You steward this domain". Stewardship is not
  participation, so a steward who has not joined still sees "Join as a
  participant".
- `caller_can_edit` gates Edit. The list's `caller_can_create` gates New Domain.

## Lifecycle actions, not raw status values

Proposal status changes use labelled buttons from `lib/proposal-vocab.ts`
(`PROPOSAL_TRANSITION_LABELS`), drawn from `allowed_next`. Forward moves appear
only when their gate is met. Owner decisions (2026-10-31) shape the rest:

- **The proposer closes advice.** "Close advice and move to consent…" is a
  forward move behind a confirmation (`closeAdviceConfirmation`: what advice
  was received, the deadline, what happens next; the author is "you", a
  non-author steward "acting as a steward for the proposer"), from both the
  header and the prompt banner. `adviceClosePrompt` adds a banner once the gate
  is met ("Close advice and move to consent: enough advice is in", the bell's
  words), and "Advice deadline passed: move to consent?" once
  `gates.advice.deadline_passed`. Nothing moves by itself. Only the proposer
  reads "You decide" (`isProposer`). Owner decision 2026-11-01: a steward who
  did not write it may close advice only once the deadline has passed (never
  without one); before that `allowed_next` lists the move `blocked:
  "proposer_closes_advice"`, `groupProposalMoves` keeps it out of `forward`
  and sets `proposerClosesAdvice`, and the page shows
  `proposerClosesAdviceNote` ("The proposer, Ines, closes advice. You can
  close it after the deadline (<date>) if they haven't.") instead of a button.
  After the deadline the steward's banner reads "Advice deadline passed: close
  advice for the proposer?", the steward's bell item word for word.
- **No preselected position.** The consent select starts empty (required),
  the hint defines Consent as well as Stand aside and Object, and
  `consentCompletesRound` warns before the press when this position would
  complete the round (the proposal then moves to Test at once).
- **A steward confirms ratification.** "Confirm ratification…" opens a dialog
  that shows every test report (outcome, reporter, criteria) as the evidence.
  A steward who wrote the proposal gets no button: `allowed_next` marks the move
  `blocked: "needs_another_steward"` and the page says "Another steward needs to
  confirm this" (`groupProposalMoves().ratifyNeedsAnotherSteward`).
- **Send back for revision…** (consent or test -> advice) asks for a note in a
  dialog; the server bumps the version and opens a fresh advice round and
  consent record, so earlier rounds render as "Earlier round" history.
- **Ratified is not registered.** The banner (`ratifiedBanner`) never says
  "now active"; a steward's "Register as agreement…" confirms, then links the
  agreement. "Your own follow-up" is the member's private note, not the
  ecosystem decision.
- Withdraw (non-terminal only) and role changes confirm in a dialog.

The quorum is explained from `gates.consent.quorum_source`
(`quorumExplanation`): "Needs 2 positions, set by the governing agreement
“How we decide”" or "(the usual number, since nobody set one)". Decision types are
`consent` and `consensus` only (`DECISION_TYPE_OPTIONS`); the governing
agreement picker lists agreements in force. After a change, `useUpdateProposalStatus` toasts the phase
the proposal actually landed in (`proposalPhaseAnnouncement(updated.status)`,
since gates can auto-advance further) and the page moves focus to the status
region, because the button that was used unmounts. The same applies to advice,
consent and test entries that auto-advance: their hooks announce the move
(`announceActOutcome`) and the tab reads `auto_transitions` from the resolved
result to move focus. Without an advance, focus still moves to a stable target
(`useFocusAfterRender`): the advice and test done-state headings and the
consent card's "Your position" heading (all `tabIndex=-1`), because the submit
button disables itself while pending and focus would otherwise fall to BODY.
`ConsentTab` is keyed on the version only for the same reason (a key on the
position remounted it after every press).

Dates: date-only values (`YYYY-MM-DD`: decision dates, review and
verification dates, last governance activity, onboarding consent and
cooling-off dates) go through `formatDate`, never `new Date(value)`, which
reads them as UTC midnight and shows the day before west of UTC. Decision
cards are links named by what was decided (`lib/decision-vocab.ts`
`decisionHeadline`: the holding's title, `aria-labelledby`), not by the opaque
record id.

The next-action box (`proposalPhaseAction` in `lib/proposal-vocab.ts`) asks
for the one step the phase needs and turns into a done state once the caller
took it (advised this round, a live position, a report on this version, or the
test gate already met), so a member who has advised is never shown "Your
input is needed" over an empty form again.

## Domain names

Render `display_name` through `lib/domain-label.ts` (`domainLabel`,
`domainCode`, `domainOptionLabel`). The generated `DOM-XXXXXXXX` code is
secondary text only, and never a heading, select label or aria-label on its own.
This covers every surface that lists domains, not only `governance/domains`:
Discover forms (shares/needs, collaborations), agreement prerequisite pickers,
ecosystem detail, and profile badges and quiz scopes (the profiles API sends
`display_name` too). `grep -rn "domain_id}" client/src` should only find keys,
values and secondary text.

## Form accessibility

Radix `SelectTrigger` is a `role=combobox` button and takes no accessible name
from its content. Give it the `id` its `<Label htmlFor>` points at, or an
`aria-label` (FilterBar uses "Label: current value"). Required fields show an
inline error with an `id`, set `aria-invalid` and `aria-describedby`, and move
focus to the field. They use `aria-required` with `noValidate` instead of native
`required`, so the inline message is the one users get.

## Data and feedback

Governance reads and writes go through `hooks/use-governance.ts` on the shared
key factory and `useApiMutation` (`client/src/AGENTS.md` "Shared data and
feedback contracts"). Which hook toasts what:

- **Silent where the page renders the failure inline**: every create/edit form,
  the advice, consent and test forms, withdrawing a consent position,
  registering a proposal as an agreement, role changes, agreement status,
  consent, withdrawal and evidence, the conflict, repair and emergency dialogs, exit export, audit
  requests, recording a personal decision, notification preferences. The page
  renders `apiErrorMessage(mutation.error)`.
- **Toasts its failure** where no page shows one: proposal status moves,
  agreement rollback, onboarding ceremony positions, ecosystem join, updating or
  deleting a personal decision, agent tokens, member status transitions.
- **Success copy in the hook** when every consumer is a governance page: ACT
  participation (`lib/act-participation.ts`: `announceActOutcome`, else a
  confirmation), proposal and agreement status, agreement consent, withdrawal,
  evidence and rollback, joining a domain, creating a repair agreement, joining
  an ecosystem (`lib/ecosystem-join.ts`). Forms keep their own "created/updated"
  toasts because they also navigate.
- **Session refresh**: agreement consent and withdrawal and ecosystem join change
  `/auth/me` (membership status, pending consents). That is AuthContext state,
  not a query, so those hooks await `refreshSession` in `onSuccess`. A join
  answered 409 means the session was stale; it resolves as "already a member"
  instead of toasting a failure.
- **Disabled lists**: `useAgreements`, `useProposals` and `useDomains` given
  `false` key on the bare root, which no request fills. `list({})` would hand
  them another page's cached unfiltered list (for example the Dashboard queue
  with no ecosystem selected).
- **DomainDetail shares and needs** read through `useDomainSharesNeeds`
  (`keys.sharesNeeds.forDomain`) and write with the `use-discover` hooks, whose
  `affects.sharesNeeds` reaches the domain key; status and delete failures toast
  from those hooks, create renders inline. Domain quizzes still load
  imperatively until `keys.quizzes.forDomain(id)` exists.

## Emergency and exit (G-Safety)

Reads and writes go through `hooks/use-emergency.ts` and `hooks/use-exit.ts`
(not `use-governance.ts`): failures render inline (`silent`), successes toast
from the hook. The server owns every rule and date (`api/AGENTS.md` "Emergency
and exit"); pages render its flags and words.

- Emergency payloads carry `phase` (pending, open, recovery, closed,
  withdrawn), `next_step`, the dates that matter (`cosign_deadline`,
  `authority_ends_at`, `review_schedule_by`, `review_due_at`) and caller flags
  (`caller_can_cosign`, `_withdraw`, `_end`, `_review`, `_complete_recovery`,
  `caller_is_steward`). A button renders only when its flag is true, and every
  move confirms. `auto_revert_at` is never shown during Recovery.
- The declare form reads its bounds from `GET /emergency` `limits` (the backend
  constants), so the UI never restates the ceiling. It renders for the selected
  ecosystem only when that id is in `caller_can_declare_in`.
- `EmergencyBanner` (mounted once under the header in `App.tsx` AppLayout)
  polls `GET /emergency/active`, which covers every ecosystem the member is
  active in, not just the selection. `lib/emergency-phase.ts` turns each live
  emergency into banner copy; pending is included so a co-signer can find it.
  "Review overdue" is a steward's alarm; members keep seeing "review due".
- Recovery: `RecordReviewDialog` (scheduled or complete, with a note) and
  `CompleteRecoveryDialog` (steward, after a complete review) live in the
  Recovery card of `EmergencyDetail`.
- Exit: `ExitForm` files the caller's own exit (no member picker). `ExitDetail`
  shows `next_step`, the handoff notice (`lib/exit-status.ts handoffNotice`)
  and one button per `allowed_next` status with `EXIT_MOVE_COPY`.
  `ExitDataExportCard` renders for the leaver only and downloads the portable
  record as JSON; it never touches the exit status.

## Next steps and the status banner (G-Next)

One server source (`neos_agent` `services/next_steps.py`; API shapes in
`api/AGENTS.md` "Next steps (G-Next)"), read through `hooks/use-next-steps.ts`:

- **The bell** (`components/NotificationCenter`) and **the dashboard decision
  queue** (`pages/Dashboard`) both read `GET /me/next-steps`
  (`keys.nextSteps.mine()`; only the bell polls, every 5 minutes, and `affects.*`
  invalidation refreshes both after actions): the same items, the same
  count. The list covers every ecosystem the member is active in, not the
  header selection, because it is the member's own to-do list; the queue names
  the ecosystem when items span more than one. There is no read/unread state:
  an item leaves when its act is done (advice given, position recorded,
  emergency co-signed, ...). The bell's accessible name says the full count
  (`bellLabel`); the badge caps at "9+" (`bellBadge`).
- **`StatusBanner`** (`components/governance/StatusBanner`) shows
  `GET /explain/<kind>/<id>`: state, next step, who decides, by when, and what
  is waiting for the caller here. It is mounted on proposal, agreement,
  conflict, emergency and exit detail pages; on emergency and exit pages it
  replaced the card's own `next_step` line (the same words), and the remaining
  card ("Timer and your options", "Handoff and your options") renders only
  when it has dates or buttons. The conflict page's "What happens next" card
  is the banner now.
- Due dates: the server decides overdue (a date-only due passes when its day has ended
  everywhere on Earth) and the client only words it. `lib/next-steps.ts
  dueStatus(due, overdue, now, format)` says "Overdue since <date>" only when the
  server's `overdue` is true; otherwise "Due today", "Due tomorrow" (local
  calendar) or "Due <date>". `YYYY-MM-DD` is read as that local calendar day
  (`parseDue`, never the UTC midnight before it). The bell, the dashboard queue
  and the banner therefore agree.
- Freshness: the banner key sits under the record's `detail` key and
  `affects.*` include `keys.nextSteps.all`, so every governance mutation
  refreshes both; the assistant drawer refreshes the queue after a successful
  tool.
