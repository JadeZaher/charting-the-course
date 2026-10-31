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
confirmation dialog. After a change, show a toast naming the phase the proposal
actually landed in (`proposalPhaseAnnouncement(updated.status)`, since gates
can auto-advance further) and move focus to the status region, because the
button that was used unmounts. The same applies to an advice entry that
auto-advances to Consent: read `auto_transitions` from the submit response.

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
