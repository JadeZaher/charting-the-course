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
(`PROPOSAL_TRANSITION_LABELS`). Forward moves appear only when their ACT gate is
met, because the server would otherwise answer 409. Withdraw goes through the
confirmation dialog. After a change, `useUpdateProposalStatus` toasts the phase
the proposal actually landed in (`proposalPhaseAnnouncement(updated.status)`,
since gates can auto-advance further) and the page moves focus to the status
region, because the button that was used unmounts. The same applies to advice,
consent and test entries that auto-advance: their hooks announce the move
(`announceActOutcome`) and the tab reads `auto_transitions` from the resolved
result to move focus.

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
  the advice, consent and test forms, agreement status, consent, withdrawal and
  evidence, the conflict, repair and emergency dialogs, exit export, audit
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
