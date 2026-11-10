# Client UI architecture

## Design contract

This directory implements the **Signal Paper / Black Index** system documented in the repository `design_guidelines.md`.

- `index.css` is the source of truth for semantic color, type, spacing, radius, and contrast roles.
- `tailwind.config.ts` exposes those roles. Components consume token classes; do not hardcode hex, RGB, or theme-specific colors in TSX.
- New surfaces use square geometry (0–2 px), hard rules, and no gradients, blur, glow, or soft shadow. Full circles are reserved for avatars, radio indicators, and status dots.
- Interactive targets are at least 44 px, or use a visible 20 px control with an expanded 44 px hit target.
- Focus remains visible with a 2 px outline. Do not remove it unless the component supplies an equally strong replacement.

## Theme contract

`ThemeProvider` owns the `light | dark | system` preference and exposes the resolved theme. The prepaint script in `client/index.html` must use the same storage key and resolution rules so first paint does not flash.

Use semantic foreground/background pairs. Do not infer contrast from a palette name or apply opacity to critical text. Charts and canvas renderers must resolve CSS tokens at runtime instead of maintaining a second palette.

## Page shell

The authenticated shell owns the global header, sidebar, skip link, and `.route-shell` gutter. Route pages should not add a full-page maximum width. Constrain only prose, narrow forms, or intentional detail columns.

The route contract is:

- Navigation is two-mode: Explore (/discover, /ethos, /orientation) vs Ecosystem (scoped to the current ecosystem).
- `/discover` renders `pages/discover/DiscoverHub`.
- `/solutions` redirects to `/discover` (the former `pages/Discover` catalogue is removed from the nav).
- `/map` redirects to `/discover`.
- `/quizzes` redirects to `/onboarding`; `/quiz/take/:id`, `/quiz/results/:id`, and `/quiz/manage` remain.
- `/comms` and `/chat` redirect to `/messaging`.
- `/governance` redirects to `/ecosystems`.
- `/explore` and `/discover/hub` redirect to `/discover`.
- Journey-map admin routes (`/admin/journey-maps*`) redirect to `/onboarding` — journey maps are being folded into onboarding flows.
- Ethos and orientation routes belong to the Explore navigation state.
- `/`, `/communities`, `/about`, `/governance-model`, `/terms`, `/privacy`, and `/writing` (plus the two notes under it) are public. The production build prerenders their text into the first HTML response (`scripts/prerender-public.ts`), with `sitemap.xml` and `robots.txt`. The footer on every page includes the "An Escherbridge project" sister-site list.
- Signed-out visits to any non-public path redirect to `/login?redirect=<path+query>` (see §Sign-in redirect contract), never to `/`.

`App.tsx` moves focus to `#main-content` (`preventScroll`) after every client-side navigation except the first render, unless the new page already put focus inside `main` (an `autoFocus` field, a link that stayed mounted). Pages should not focus `main` themselves.

On mobile the sidebar is a sheet; `AppSidebar` closes it whenever the location changes so it never covers the page it just navigated to.

A sidebar item is shown only to members its destination admits (`lib/nav-access.ts` `visibleNavItems`, `canOpenAdminPanel`; a route gated with `access` asks the same `admits`): each `facilitatorItems` entry names the gate of the page it opens (`quiz-steward` = who the server lets write quizzes, see "Pass 03 fixes" below; `admin-panel` = `AdminPanel`'s platform-admin gate, which also gates the Administration group; see "Platform admin (G-Authority)"), and the Content Management group renders only when one of its items survives. Gating a group on a broader permission than its pages sent townhall/collaborator members to "Manage Shares & Needs" and a redirect. Icon-only controls in the collapsed rail carry their own `aria-label` (the collapsed Logout button): a tooltip is not an accessible name.

`client/index.html` declares `<link rel="icon" href="/favicon.svg">` (asset in `client/public/`); without a declared icon the browser requests `/favicon.ico` and logs a 404 on every load.

### Route guide rail

`RouteGuidePanel` keeps one persisted preference (`localStorage["neos:route-guide-open"]`). At `lg+` (1024 px) the panel is docked: while open it sets `--route-guide-width: 380px` on `<html>` (`0px` when closed, hidden, or unmounted) and the shell's `main` adds that width to its right padding (`lg:pr-[calc(var(--page-gutter)_+_var(--route-guide-width,0px))]`), so the rail never covers page controls. Below `lg` the panel overlays content, so it opens only on demand and collapses on the next navigation without overwriting the stored preference. Keep `PANEL_WIDTH` and the panel's `w-[380px]` in step.

## Sign-in redirect contract

`pages/Login.tsx` reads `?redirect=` from the raw `window.location.search` (wouter's `useSearch()` unescapes it, which would split a nested `&`) and passes it through `safeRedirect` (`lib/post-login-redirect.ts`): only same-origin in-app paths that are not `/login…` are honoured; anything else becomes `/dashboard`. `resolveInternalPath` (`lib/internal-path.ts`, re-exported by `lib/media.ts`) requires a leading `/`, no `//`, no backslash, and also rejects a path that only becomes `//host` after URL normalisation (`/.//evil.example`, `/%2e//evil.example`); `LinkifiedText` likewise treats a same-origin URL whose path starts with `//` as external. Every sign-in path (password, register, DID, already-authenticated visit) lands on that target with `replace`, unless the member is behind the consent gate (below).

OAuth cannot carry the parameter: the backend callback always returns to `/dashboard`. Before leaving, `handleOAuth` stashes the target in `sessionStorage["neos:post-login-redirect"]`; `AppLayout` consumes it once (`takeStashedRedirect`) when the session becomes authenticated and the consent gate is not holding the member (below). Non-OAuth submits clear the stash first so a stale OAuth attempt cannot redirect a later password sign-in.

## Sign-up consent gate

A self sign-up joins the server's default ecosystem behind its agreement-consent gate (`pending_consent` until each membership agreement is attested; see the API's `api/AGENTS.md` "Sign-up placement and the consent gate"). `AuthContext` exposes `pendingConsents` from `/auth/me` and every sign-in method returns `{ consentRequired }`; `Login` then lands on `CONSENT_GATE_PATH` (`/welcome/consent`, `lib/member-status.ts`) instead of the redirect target. The OAuth callback redirects a gated newcomer there itself, and `AppLayout` leaves the stashed OAuth destination in place while the gate holds them. `pages/ConsentGatePage` lists each pending ecosystem's agreements with links to `/agreements/:id` (where consent is recorded) and re-reads `/auth/me` on mount and on "check again". Statuses are shown through `memberStatusLabel` (never raw `pending_consent`); the sidebar's pending label links to the gate.

The gate is also a route guard, not only a sign-in redirect: `AppLayout` asks `consentGateRedirect` (`lib/consent-gate.ts`) on every render after auth has loaded. A member the gate holds (`isHeldAtConsentGate`: a pending consent and no ACTIVE membership) is sent to the gate from any path except the gate itself, `/agreements/:id` and `/agreements/:id/history` (they must read what they consent to; `new` and `edit` stay closed), `/ethos` and below, and the public pages (`/about`, `/governance-model`, `/terms`, `/privacy`, `/users/:username`). The API serves those agreement routes to pending members on purpose (`api/AGENTS.md` "Handler contracts" rule 5). A member who is active in at least one ecosystem is never trapped: their pending gate is reached through the sidebar label. "Active" is `activeEcosystemIds`: not in `pendingConsents`, and not the `/auth/me` member row when that row's `current_status` is anything but `active` (exited, suspended, prospective). That row, the oldest membership, is the only one whose status `/auth/me` reports; an exited membership elsewhere still counts as active until the API reports a status per ecosystem (wave 2). While the gate holds the member, the stashed OAuth destination is not consumed; when consent lifts the gate, `AppLayout` takes it and lands them there, an agreement link included. AuthContext state is not a query, so consent recorded on an agreement page lifts the gate only after `refreshSession` (the gate page calls it on mount and on "check again").

`EcosystemContext` applies the server's scope rule (`main._load_ecosystems`): it restores only the cookie ids in `activeEcosystemIds`, and otherwise selects `defaultEcosystemId`, which is the `/auth/me` member row's ecosystem when that row is active (the oldest membership being active makes it the server's oldest-active default), else the first active one. A member active nowhere gets no selection and the cookie is left alone, rather than a pending ecosystem the server refuses.

## Orientation journeys

Journey maps are served by the orientation blueprint: `GET /api/v1/orientation/journey-maps/:id` (there is no `/api/v1/journey-maps`). Unknown `/api/*` paths now return JSON 404s instead of redirecting to `/dashboard`, so a wrong path surfaces as a query error rather than SPA HTML.

`OrientationJourney` renders four distinct states: loading; load failure ("We couldn't load this journey" + Retry); a map with an empty `content_sequence` ("This journey has no steps yet"); and completion, shown only when `progress.status === 'complete'`.

`VideoStep` (its states and saved payload are `lib/orientation-video.ts` `videoStepView` / `videoStepResponse`): a required video gates Continue on an acknowledgement checkbox for every source (YouTube and self-hosted; a self-hosted video that plays to the end also ticks it). A video that cannot play (no `video_url`, or the `<video>` fires `error`, e.g. the seeded `/assets/orientation/*.mp4` that the SPA answers with HTML) shows "This video could not be loaded" and the acknowledgement reads "I'll continue without the video", so a missing asset never strands a newcomer on step 1. That step saves `{ watched: false, acknowledged: true, video_unavailable: true }` so content owners can find it; supplying the real welcome videos is an owner content task. `OrientationComplete` shows the celebration only for a completed journey and otherwise links back to continue or choose a journey. The ethos page's per-journey "Begin <title>" links pass `?journey=<id>`, which `OrientationGate` preselects; `JourneyMapCard` exposes its selection with `aria-pressed`.

Join first. The API stores orientation progress and ethos participation consent on the user's member row in that ecosystem and answers a non-member's write with 409 `JOIN_REQUIRED` (API `api/AGENTS.md` "Join-first self-service writes"). Starting a journey or consenting is an intent to join, so for a user with no membership there (`holdsMembershipIn`: `/auth/me` `ecosystems` lists every row, pending included) `OrientationGate`'s start and `ConsentGate`'s consent run `joinThen` (`lib/ecosystem-join.ts`): the existing join mutation first (`useRequestJoinEcosystem`, which toasts joined versus consent-required and refreshes the session; its 409 "already a member" counts as joined), then the write, in one click. A failed join never writes. Members see no change. Non-members see the button as "Join and start journey" / "Join and consent to participate" with a line saying the click asks to join and that an ecosystem with membership agreements keeps them pending until they consent; the ethos dossier shows the same line beside "Open orientation". Each step keeps its own failure feedback: the join toasts, `useSaveProgress` toasts, and the consent gate renders `apiErrorMessage` inline (so a failed join there shows both its toast and the inline line).

## Messaging

`components/messaging/NewConversationDialog` is the single new-conversation flow, rendered by both `/messaging` and the `FloatingComms` drawer; it owns its form state and reports the created conversation through `onCreated`. Message bodies render through `components/messaging/LinkifiedText`: only `http(s)` URLs become links, same-origin URLs become in-app wouter `Link`s, external ones open in a new tab with `rel="noopener noreferrer"`, trailing sentence punctuation is left outside the link, and all text stays React-escaped (no HTML injection path).

The floating drawer is a non-modal `role="dialog"` named "Communications": opening it moves focus into the panel, closing it (button, launcher, or Escape) returns focus to the launcher. Any navigation (a link followed from a message or the assistant, the sidebar, history) closes it without returning focus to the launcher, so the shell's post-navigation focus on `main` stands. It reads the route through wouter's `useLocation`, so it also hides itself reactively on `/messaging`. Icon-only controls carry `aria-label`s ("New conversation", "Send message", "Stop response").

Read state: the API marks a conversation read when the caller loads it (`GET /messaging/conversations/:id` or `/:id/messages`); the read watermark is the newest message's own `created_at`, so the unread count never compares two clocks (API `api/messaging.py` `_mark_read`). `useConversation` therefore invalidates the conversation *list* keys after every load of a detail, which is what clears the badges in `/messaging`, the drawer tab and the launcher. It must not invalidate `keys.conversations.all`: that prefix includes the detail itself and would loop.

Conversation names come from `useConversationTitle` (`hooks/use-messaging.ts`, over the pure `lib/conversation-title.ts`): the title, else the other participants. The caller is dropped by member id, falling back to their display name because they can sit in a conversation through another ecosystem's member row (`/auth/me` reports only one). A list button's accessible name is the title plus "N unread" (`aria-labelledby`); the last-message preview is its description, not part of the name. On `/messaging`, opening a conversation moves focus to the thread heading (`h3`, `tabIndex={-1}`) once it has loaded.

## Public member profiles

`/users/:identifier` is an always-public, whitelisted member record. It consumes the purpose-built profiles API rather than member-detail endpoints so authentication data, contact details, private notes, and raw quiz answers cannot leak into the public surface.

Platform-wide biography, links, skills, interests, and projects belong to the user profile. Ecosystem roles and domain participation remain membership records and are aggregated for display. Completed quizzes are grouped by their effective ecosystem and domain; ecosystem-wide quizzes use an explicit general bucket. Shares, needs, and solutions appear only when they are active, public, and authored by that user.

`/profile` is the owner editor for the same contract. Do not reintroduce page-level profile visibility controls: individual operational records may retain their own visibility, but the member profile itself is public.

The profile name is the member name everywhere (owner decision 2026-11-01): saving it renames every membership row on the server (`api/AGENTS.md` "Profile name is the member name"), so the save calls `refreshSession` (the sidebar reads the `/auth/me` member row, which is AuthContext state, not a query) and invalidates `affects.profileName` (profiles, members, the queue and the governance records that name people). Names are display only; never key UI permissions on them.

In Me's "Your shares, needs & solutions" each item carries the author's Edit (title, description, capacity via `useUpdateSharesNeeds`) and Withdraw (confirm dialog, then `useUpdateSharesNeedsStatus` with `withdrawn`; the item leaves the list because `/profiles/me` lists only active public items). Both dialogs portal out of the profile `<form>`, but React events still bubble through portals, so the edit form's submit calls `stopPropagation`. The profile form re-seeds from `data.profile` only (structural sharing keeps it stable), so a publication change refetching the page does not discard unsaved profile edits.

## Component boundaries

Shared interaction and geometry belong in `components/ui`; page files should compose primitives instead of restyling their internals. Preserve Radix semantics, keyboard behavior, and accessible names when changing presentation.

Cards are ruled containers. Tabs are ruled navigation. Tables keep headers visible and values legible. Hover treatment uses fill, border, or a 1 px press shift—not elevation.

## Visual content

Dashboard and discovery media must be content-driven. Persist the image URL plus alt text, source, and credit when possible. Provide a deterministic fallback, reserve the image aspect ratio, lazy-load below-fold media, and never place critical copy directly on a busy image.

URL handling is context-specific: use `lib/media.resolveMediaUrl` for raster images, `resolveExternalUrl` for outbound links, and the host-allowlisted `resolveMiroEmbedUrl` for Miro iframes. Never pass a generic stored URL directly between image, link, and embed contexts.

## Private orientation guide

`useOrientationChat` uses the real `/api/v1/orientation/chat` API. Availability is checked before typing; histories are owner-private and separate from governance chats. The orientation guide has no tools. Required AI steps submit a server-bound session and step proof; canned replies, errors, old journey versions and generic panel conversations do not complete them.

The guide resumes only the API's latest current session for the signed-in owner, journey and exact AI step. History restores genuine assistant-reply counts alongside the transcript; local counts are capped by the actual saved replies and the server still validates the proof on Continue. Explicitly choosing New suppresses automatic resumption until the user chooses saved history or the component remounts. Stale history is readable but never satisfies completion. General-panel conversations and step conversations have separate selectors and clear scope labels; only AI steps expose the bound-step panel option. Saved history remains readable when sending is unavailable.

Both bounded guide transcripts are named focusable logs, so keyboard users can enter the scroll area and use native scrolling keys to read saved replies. The explicit tab stop does not depend on a browser automatically focusing overflow containers. New replies retain polite live announcements without moving focus or scrolling the reader away from older content.

Prejoin agreement reading uses an explicit pending-enrollment action. A nonmember first chooses Start joining to read agreements; only the successful join request enables private agreement links. This preserves the API's membership boundary while allowing agreement-first completion. It never activates participation or records consent by itself.

## Runtime accessibility triage

`Progress` forwards its value to the Radix root as well as the visual indicator. Results and journey progress name the measured quantity. Result/history icon buttons and domain-result links carry meaningful names. Questionnaire summaries distinguish completion from grading and format boolean responses as Yes/No without changing their stored JSON types.

The 195 CSS-pixel emulation exposed the global 20rem HTML minimum and fixed 18rem mobile sidebar. The root now permits reflow and mobile sheets/dialogs clamp to their viewport; desktop widths retain their existing maxima. Sidebar link activation closes the mobile sheet even when the selected pathname is already current. Proposal pagination uses native disabled buttons with opaque muted text instead of opacity-only anchors, preserving keyboard and disabled semantics with readable text.

Pass-06 `aria-hidden-focus` nodes match Radix ToastFocusProxy, not the dialog's data-radix-focus-guard nodes: `@radix-ui/react-toast` creates two visually hidden tabindex=0 spans while notifications exist, and their onFocus handlers move into actual toast candidates. Keep those upstream focus-routing sentinels intact. This source finding explains the node shape, but does not establish keyboard usability or justify suppressing axe; the coordinator's targeted Tab/Shift+Tab and F8 check must retain the original violation evidence and verify focus does not remain on a hidden proxy.

## Assistant drawer

`FloatingComms`' chat tab streams `POST /api/v1/chat/send` through `hooks/use-chat.ts`; the decisions live in
`lib/chat-tools.ts` (node:test). Tool chips show the server's plain `label` (sent on `tool_start` and
`tool_result`) and a plain status (`TOOL_STATUS_TEXT`), never the tool's code name or token counts. An
irreversible act (withdraw or ratify a proposal, put an agreement in force or end it, declare an emergency,
file an exit) comes back as `needs_confirmation` instead of success or failure; `pendingConfirmation` shows
it under the latest finished reply, with "Yes, go ahead" / "No, cancel" sending an ordinary message
(`CONFIRM_REPLY` / `DECLINE_REPLY`). The server accepts a yes only in a later turn of the same session, so
the buttons are a shortcut for typing, not a bypass; see the API's `agent/AGENTS.md` "Confirmation of
irreversible acts". Successful assistant writes use the same `affects` dependencies as page mutations:
record details, filtered lists, derived decisions and profiles follow the act, together with the queue,
dashboard and computed health. `refreshAfterTool` combines the tool's write family with a safe internal
result link; exchange responses must refresh posts even when they link only to a conversation. The
canonical collaboration route is `/discover/collaborations/:id`; Discover post and messaging
conversation query links count as record links. Failed, read-only (including
`find_shares_needs`) and confirmation-waiting calls refresh nothing. Joining an ecosystem or attesting
agreement consent also refreshes `AuthContext`, so membership, navigation and the consent gate update
without reloading. Tests exercise invalidation through a real `QueryClient` and reject external links.

The stable `FloatingComms` owner holds the assistant transcript, session, routing state, draft and
conversation visibility; closing the drawer, switching its tabs and following an internal link do not
create a new conversation or discard an unsent draft. The Messaging page retains the agent launcher
and shows only its agent tab, since the page already supplies human conversations. No transcript is
copied into browser storage. Loading a saved session also restores its server-reported visibility.
The stable owner tracks conversation generation, privacy requests and history selections separately.
Clear/New or a committed history switch invalidates older session callbacks; a newer selection, Back,
or continuing the current chat invalidates pending history only. Closing or switching tabs preserves
legitimate requests. Privacy/share metadata commits with its session, and stale copy completion cannot
announce success for a different conversation. The deterministic regression releases delayed privacy
and history responses after each kind of switch, including close/reopen followed by continuing chat.

`skill_route` is the canonical per-turn routing event: a guided skill, platform help, governance guide
or general help. A null skill clears the old hint. The client sends `active_skill` only as prior context;
`requested_skill` is reserved for an explicit manual choice and defaults to null. Friendly labels belong
to the reply, and a terminal transition reads "Process complete." `lib/chat-routing.ts` validates this
contract. Raw routing metadata and unknown event payloads never become assistant prose.

`lib/chat-stream.ts` frames SSE across arbitrary chunks, CRLF/LF, empty data and the final unclosed
frame; the decoder flush preserves split UTF-8 characters. Each request owns its stream, so an aborted
or replaced response cannot append to the next conversation. A dropped result keeps known successes
and marks unfinished tools "check the record" rather than claiming they failed or succeeded. An empty
reply offers a readable retry action. Refusal
details and the server's exact confirmation consequence stay visible. Confirmations use a neutral
heading because some confirmed actions are reversible. Errors are announced; completed replies are
announced politely without announcing every streamed token.

At the 20-user-message cap, Send and confirmation shortcuts stop and "Start a new conversation"
preserves the unsent next question. Expanded mobile width accounts for its viewport inset. Parser,
routing and action-result helpers have pure tests; `uxqa/regression/p4-agent-routing-continuity.mjs`
uses mocked SSE to check actual drawer state, navigation, routing labels, cap recovery and 390px
geometry. That deterministic UI probe makes no model calls or governance writes and is separate from
live persona journeys and the operator evaluation.

## Documentation and verification

Keep source comments terse and local. Put design rationale and cross-component decisions in this file or `design_guidelines.md`.

Before handing off UI changes, verify keyboard navigation, focus, both resolved themes, reduced motion, narrow layouts, and representative empty/loading/error/data states. Run the repository's integrated lint/type/test sweep once after all related edits are complete.

## Agreement participation ceremonies

The agreement form declares whether individual consent is required, the
participation scopes it gates, and the alignment credit. The detail view is the
member-facing ceremony surface: it records personal attestation, shows consent
progress, collects test evidence before activation, and permits a reasoned
withdrawal. An agreement's ceremonies are its recorded stage moves (an admin or
owner changes the stage with written evidence) plus the advice rounds and test
evidence recorded on the way; there is no separate "record a ceremony" action
(owner decision 2026-11-01), so copy (role card, ceremonies box, gates panel)
never implies one. Keep its labels and select values aligned with the backend
agreement vocabulary; presentation cannot bypass the API lifecycle.

## Shared data and feedback contracts

Pass-01 defects F01, F02, F05, F07, F10 and F17 came from three copies drifting apart: hand-typed query keys and invalidation lists, mutations with no shared feedback path, and per-page loading/error/empty chains. Each contract below owns one of those decisions once. The decision lives in a pure `lib/*.ts` module with a node:test; the hook or component around it stays thin.

### Query keys: `lib/query-keys.ts`

```ts
keys.<entity>.all                  // ['proposals']                    every entity
keys.<entity>.list(params = {})    // ['proposals', 'list', params]    collections
keys.<entity>.detail(id)           // ['proposals', 'detail', id]      collections
keys.<entity>.<subKey>(…)          // keys.agreements.history(id) = [...detail(id), 'history']
affects.<domain>                   // key prefixes a successful mutation of that domain invalidates
ecosystemScoped                    // roots refetched when the ecosystem selection changes
```

Every key an entity produces starts with its `all`, and a record's sub-resources extend its `detail`, so invalidating a prefix reaches everything beneath it. Each entity owns a distinct root string; the test fails if two entities share one (two response shapes in one cache entry) or if an `affects`/`ecosystemScoped` entry names a root the factory does not own (the phantom keys `TakeQuiz` invalidated). `affects` is the dependency map: a proposal move also refreshes decisions (ratification mints one), the dashboard queue and my decisions; every governance domain (proposals, agreements, conflicts, emergency, exits, audits) also refreshes `keys.nextSteps` (the bell and the queue), and each record's status banner key (`keys.<entity>.explain(id)`) extends its `detail`, so the page's own invalidation reaches it; a share or need change also refreshes public profiles and my decisions; agreement consent also refreshes members (it activates a pending membership). `ecosystemScoped` lists exactly the roots whose GET handlers filter by the selected-ecosystem cookie (`api/helpers.py get_ecosystem_ids`); the test's endpoint table is that backend survey. When a handler starts or stops reading `get_ecosystem_ids`, update both. The discover feed and the ecosystem catalogue are not selection-scoped.

```ts
// before
useQuery({ queryKey: ['proposals', id], queryFn: () => api.fetchProposal(id), enabled: !!id });
onSuccess: () => qc.invalidateQueries({ queryKey: ['proposals', proposalId] }),
// after
useQuery({ queryKey: keys.proposals.detail(id), queryFn: () => api.fetchProposal(id), enabled: !!id });
invalidates: affects.proposals,
```

Rules: a key names one request and one response shape. `list(params)` carries the parameters sent to the server; client-side filtering, slicing and mapping go in `select`. Call sites that share a key share one `queryFn` that returns the API response untouched (put it in the hook) and shape their view with `select`. Migrate a root's reads and its exact writes (`setQueryData`, `getQueryData`, `cancelQueries`) in the same change: prefix invalidation reaches old and new shapes during a migration, exact writes do not. A `detail(undefined)` key is only for a disabled query. Never derive a key from a URL; `lib/queryClient.ts` has no default `queryFn`, so every query names its fetcher.

### Mutations: `hooks/use-api-mutation.ts`, `lib/api-mutation-options.ts`, `lib/api-error-message.ts`, `announceActOutcome`

```ts
useApiMutation<TData, TVariables, TContext>({
  mutationFn,                       // (variables) => Promise<TData>
  invalidates?,                     // readonly QueryKey[] | (data, variables) => readonly QueryKey[]
  success?,                         // ToastCopy | (data, variables) => ToastCopy | null; ToastCopy = string | { title, description? }
  error?,                           // error toast title; default "That didn't go through"
  silent?,                          // true only when the error renders inline
  ...useMutationOptions             // onMutate/onSuccess/onError/onSettled still compose
}): UseMutationResult<TData, Error, TVariables, TContext>
apiErrorMessage(error: unknown): string
announceActOutcome({ auto_transitions, decision_record_id }): { title, description } | null
```

The hook is a thin wrapper: `apiMutationOptions(options, { queryClient, toast })` in `lib/api-mutation-options.ts` builds the TanStack options, so `lib/api-mutation-options.test.ts` drives them through a real `MutationObserver` and `QueryClient` without React. On success the caller's `onSuccess` runs first (so an optimistic `setQueryData` lands before the refetch), then the success toast, then every invalidation, awaited: `mutateAsync` resolves and `isPending` clears only once fresh data is in. If the caller's `onSuccess` throws, the error goes to `console.error` and the write still counts as a success: the success toast and invalidations run, the caller's `onError` (its rollback) does not, and `mutateAsync` resolves. TanStack would otherwise send a thrown `onSuccess` down the error path, toasting failure and rolling back a write the server kept. On error the toast fires unless `silent`, then the caller's `onError` (rollback). `apiErrorMessage` replaces `(err as Error).message`: the server's own sentence when it sent one, plain words for a bare status line (`Unauthorized`, `Not found`, `Internal Server Error`), a connection message for a failed `fetch`, and never engine text (`Cannot read properties of undefined`, a JSON parse error). It matches `ApiFetchError` by shape (`status: number`) because importing `lib/api-client.ts` would pull `import.meta.env` into node tests. `announceActOutcome` turns the ACT engine's `auto_transitions` (`advice->consent`, `consent->test`, `test->ratified`) into "Proposal moved to Consent / The advice round is complete. Members can now record…"; it returns null when nothing moved, so the caller's own confirmation shows instead.

```ts
// before: no onError, outcome ignored (F01, F07)
const submitConsent = useMutation({ mutationFn: (d) => api.submitConsent(id, d), onSuccess: () => qc.invalidateQueries({ queryKey: ['proposals', id] }) });
// after
const submitConsent = useApiMutation({
  mutationFn: (data: Record<string, any>) => api.submitConsent(id, data),
  invalidates: affects.proposals,
  success: (result) => announceActOutcome(result) ?? { title: 'Consent recorded', description: 'Your position has been recorded.' },
  error: 'Consent not recorded',
});
```

### Async states: `components/QueryState.tsx`, `lib/query-state.ts`

```tsx
<QueryState query={proposalsQuery} isEmpty={(page) => page.items.length === 0} empty={<EmptyState … />}
            loading={<Skeleton … />} errorTitle="We couldn't load proposals">
  {(page) => <ProposalTable items={page.items} />}
</QueryState>
```

`queryStatePhase(query, isEmpty?)` decides: no data and an error is `error`; no data and no error is `idle` when `fetchStatus` is `'idle'` (a disabled query such as `enabled: ecosystemIds.length > 0` or a search under three letters) and `loading` otherwise; data that `isEmpty` calls empty is `empty`, unless the latest fetch failed, which is `error` (never claim absence after a failure: the F02 "no steps" bug); otherwise `ready`, including when a background refresh failed over real data, so content and half-filled forms stay mounted. A query that resolved to `null` has loaded. `isEmpty` and `empty` are typed as a pair, so an empty result cannot render as nothing. The error panel puts `role="alert"` on its text, shows `apiErrorMessage(error)`, and offers Retry (`refetch`, disabled while fetching). Loading is a `role="status"` region around `LoadingState` or the given skeleton. `idle` renders the optional `idle` node (a prompt such as "Type three letters to search"), else nothing, so a disabled query never spins forever. Pass the whole query result: `fetchStatus` is part of the snapshot.

```tsx
// before: error tested after emptiness, raw message
if (isLoading) return <Spinner />;
if (!data?.items.length) return <p>No proposals</p>;
if (error) return <p>{(error as Error).message}</p>;
// after: the QueryState above
```

### Required fields: `hooks/use-required-fields.ts`, `components/FieldError.tsx`, `lib/required-fields.ts`

```ts
const fields = useRequiredFields({ content: 'Write your advice before submitting.' }); // key order = focus order
fields.validate(values): boolean        // sets every blank field's error, focuses the first, true when valid
fields.settle(name, value)              // onChange: clears that field's error once it holds text; never adds one
fields.field(name)                      // { ref, aria-required, aria-invalid, aria-describedby }; spread on the input
fields.error(name)                      // { id, message }; spread on <FieldError>
```

Modelled on the advice form in `ProposalDetail.tsx`: errors appear on submit and leave while typing ("reward early, punish late"), whitespace counts as blank, and the error text is `role="alert"` and linked by `aria-describedby`. The caller keeps owning each value. Put `noValidate` on the form and do not add native `required` (the browser bubble would pre-empt the message). If the input already has a hint, join its id with `field(name)['aria-describedby']`.

```tsx
// before (silent guard, F10)
if (!observations.trim() || !outcome) return;
// after
if (!fields.validate({ observations, outcome })) return;
<Textarea {...fields.field('observations')} value={observations}
          onChange={(e) => { setObservations(e.target.value); fields.settle('observations', e.target.value); }} />
<FieldError {...fields.error('observations')} />
```

### Rules for migrating lanes (wave 1)

- Replace every `useMutation` with `useApiMutation`; delete hand-written error toasts. Use `silent: true` only where the error renders inline, and render it with `apiErrorMessage(mutation.error)`.
- Replace every `(err as Error).message` with `apiErrorMessage(err)`.
- Replace loading/error/empty chains with `QueryState`; where a page needs a custom layout, branch on `queryStatePhase` instead of re-deriving the order.
- Replace silent `if (!x.trim()) return;` guards with `useRequiredFields`.
- `EcosystemContext` invalidates `ecosystemScoped` instead of its hand list.
- One lane owns `lib/query-keys.ts` at a time; others ask for new keys rather than writing literals. A new key goes through `collection`/`resource` and keeps `npm test` green.
- Do not wrap `useQuery`, adopt react-hook-form, or derive keys from URLs.
- Every legacy key is migrated (wave 1): `grep -rn "queryKey: \[" client/src` finds nothing, and should stay that way.

## Client tests

`npm test` runs `node --import tsx --test "client/src/**/*.test.ts"` (Node's built-in runner; `tsx` is already a dev dependency, no browser or DOM). Test only pure modules that do not touch `import.meta.env` or React: keep logic worth testing in such a module (`lib/internal-path.ts`, `lib/post-login-redirect.ts`, `lib/domain-label.ts`, `lib/member-status.ts`, `lib/query-keys.ts`, `lib/api-error-message.ts`, `lib/api-mutation-options.ts`, `lib/query-state.ts`, `lib/required-fields.ts`, `lib/consent-gate.ts`, `lib/proposal-vocab.ts`, `lib/act-participation.ts`, `lib/ecosystem-join.ts`, `lib/chat-tools.ts`, `lib/emergency-phase.ts`, `lib/exit-status.ts`, `lib/next-steps.ts`, `lib/health.ts`, `lib/orientation-video.ts`, `lib/nav-access.ts`, `lib/agreement-list.ts`, `lib/conversation-title.ts`, `lib/decision-vocab.ts`, `pages/discover/discover-tabs.ts`) and import it from the component. `lib/query-keys.test.ts` drives a real `QueryClient` so invalidation is checked with TanStack's own prefix matching; `lib/api-mutation-options.test.ts` runs mutations through a real `MutationObserver` with an injected toast. `tsconfig.json` excludes `*.test.ts`, so `npm run check` does not type-check tests.

Behaviour that only shows in a browser (focus after a submit, a list refetch clearing a badge, a dialog before an irreversible act, which links a member is shown) is guarded by a Playwright flow in the superproject, `uxqa/regression/<defect-id>.mjs`, run on the local study stack (`uxqa/regression/AGENTS.md`). Each one fails when its fix is reverted.

## Pass 01 (first week) history note

The UX-QA pass-01 client fixes span two commits. `7841c55` (`fix(uxqa-01-first-week): …`) carries the domain-name, advice/status a11y, route-guide rail and Discover-tab code plus this file's text, but the code for p1-arrival-and-welcome-1/7/8 (Login `safeRedirect` and OAuth stash, orientation states) and p1-keyboard-and-screen-reader-week-4/5/10/11/12/15 (shell focus on navigation, route-guide padding in `App.tsx`, `NewConversationDialog`, `LinkifiedText`, `ProposalDetail` `caller_can_manage` UI, `types/api.ts` domain fields) landed earlier in `2cb3f26` ("feat: add member decision recording…"). Revert or cherry-pick both together. The review follow-up (`fix(uxqa-01-first-week): review findings`) hardened the `2cb3f26` redirect and link code above.

## Maintenance and health (G-Maint)

Wave C, `uxqa/governance/review-maintenance.md`. Rationale for what the client does and does not decide.

- **The server decides overdue.** `lib/next-steps.ts dueStatus(due, overdue, now, format)` never computes it: `overdue === true` reads "Overdue since <date>"; otherwise a date-only value is "Due today" / "Due tomorrow" (local calendar) or "Due <date>", and a day already past locally while the server says not overdue still reads "Due <date>" (a member east of the date line, because a date lasts until it has ended everywhere on Earth). The bell, the dashboard queue and the banner now agree because they all render the one server flag. Date-only values go through `parseDue` / `formatDate`, never `new Date('YYYY-MM-DD')`.
- **Agreement review is a set of buttons, not a status Select.** In-force statuses (active, under_review, sunset) draw their moves from the banner's `your_moves` (`useStatusExplanation('agreement', id)`; only admins/owners get moves). Each opens `components/governance/agreements/AgreementReviewDialog`: start a review and archive are confirms; keep in force needs findings (>= 8 characters, `useRequiredFields`) and a next review date prefilled with `default_next_review_date`; sunset needs findings and an explicit tick for "Sunset is final". The server re-checks all of it (`FINDINGS_REQUIRED`, `REVIEW_DATE_INVALID`) and its sentence shows inline once (`silent: true`, no toast). The draft/advice/consent/test ceremony Select is unchanged. Mutations live in `hooks/use-health.ts` and invalidate `affects.agreements`, which reaches the banner and the queue.
- **Rollback and reviews.** History offers Rollback only when `caller_can_rollback` (draft or advice agreements); reviews show findings, who conducted them, the version and whether they were on time. The registry badge "Review overdue" never says more than that.
- **Health: values computed, statuses human.** `GET /safeguards` returns one entry per selected ecosystem (`ecosystems[]`); the old single score fields are only filled for exactly one ecosystem, so the pages read `ecosystems[]`. Each card shows the score "as of <published_on>", the next audit due or overdue (from `audit_overdue`) and the critical count; "Record an audit" only when `caller_can_record_audit`, with the self-assessment notice when `caller_records_self_assessment`. `useHealthSnapshot` (`GET /safeguards/snapshot`) feeds the "Current values" section and the audit form, which shows each indicator's live value and framework band beside the rating and marks which ratings publishing requires (`lib/health.ts ratingsNeeded`: computable and measured). The band is a reference; the auditor still rates by hand. The published audit shows the frozen value, unit, band, prior, trend and basis, with a "Self-assessment" label.
- **Keys.** `healthKeys` (end of `lib/query-keys.ts`) sits under the `safeguards` and `audits` roots, so `affects.audits` refreshes the snapshot and the audit banner. `use-next-steps.ts` maps `ExplainKind` `audit` to `healthKeys.auditExplain`.
- **Compliance.** A `null` score is "Not measured" (`lib/health.ts scoreText`), never 0 or 100; generate sends the selected `ecosystem_id`.
- **Nav.** Safeguards is a member-tier link (every member may read the published result); Compliance stays steward.

### FX-Maint (wave-c fix wave)

`uxqa/governance/wave-c-review-flows.md` F2, F5-F7, F11, F13, F14, F17, F18 and the domain-form hand-off.

- **Every server move renders as its own control or not at all** (F2). `lib/agreement-moves.ts agreementMoveControl` (node:test) maps a `your_moves` entry: `under_review` / `active` / `sunset` / `archived` open `AgreementReviewDialog`; `attest` (the server marks it `kind: "consent"`) is a "Record your consent to this version" button that brings the existing consent form into view and focuses it, because consent is `POST /agreements/:id/consent`, never a status move; anything else renders nothing. Before, the attest move fell into the dialog's default copy ("Archive this agreement?") and posted `{status: "attest"}` (400).
- **Archiving waits for the sunset's end** (F5). The server returns the archive move with `ready: false` and a `blocked` sentence ("Archiving opens once its sunset ends on <date>."); AgreementDetail shows each blocked sentence under the header, and the button stays disabled. A 409 `SUNSET_NOT_ENDED` is the server's backstop.
- **Withdrawing consent to a membership agreement confirms first** (owner default). `isMembershipAgreement` (scope `ecosystem`) opens an AlertDialog with `membershipWithdrawalWarning(<ecosystem>)` from `lib/consent-gate.ts`; other agreements withdraw at once, as before.
- **Audits close their loop** (F6, F7). `components/governance/safeguards/AuditStewardActions.tsx`: "Abandon this draft" (when `caller_can_abandon`: its auditor or a steward; a required reason) and "Record the stewards' response" (when `caller_can_respond`: a steward, on a published audit with no response yet; a required note and an optional proposal of that ecosystem). Both are `silent` hooks in `hooks/use-health.ts` that set the audit detail and invalidate `affects.audits` (the bell's `respond_to_audit` and `audit_due` clear), and render one inline error. AuditDetail shows what was recorded (`response`, `abandonment`).
- **Domain steward and status** (hand-off). DomainForm picks the steward from the ecosystem's active members (`steward_id`); it never sends the free-text `current_steward`, which the server now derives and refuses to rename (400 `STEWARD_NAME_FOLLOWS`). On edit, steward and status are enabled only when `caller_can_change_authority`, and changing either asks for the reason the server records. Status is not offered on create (the server always starts a domain active).
- **Dates the server owns.** The bell prints no date for `archive_agreement` (the server sends `due: null`: nothing is late, F13). `auditDueText(null, ...)` reads "No audit date yet" (F17; `EcosystemHealth.audit_due` is `string | null`). RepairCheckinModal marks a check-in overdue only from the server's `next_checkin_overdue` and formats date-only values with `formatDate` (F18: `new Date('YYYY-MM-DD')` is the UTC midnight before).
- **Kind names.** `lib/next-steps.ts KIND_LABELS` and `NextStepKind` cover every kind a queue source emits, including `newcomer`, `share_need` and `collaboration`.

## Platform admin (G-Authority)

AdminPanel and the sidebar's Administration group (and the "Manage Shares & Needs" link, which opens AdminPanel) follow the server's platform-admin flag, never a member profile: `lib/nav-access.ts` `readPlatformAdmin(useAuth())` reads `user.is_platform_admin` from `/auth/me` (G-Onboard adds it to the auth context); anything other than `true`, including the field being absent, reads as not an admin. The rule is the server's (`agent/src/neos_agent/api/AGENTS.md` "Platform admin (G-Authority)"): co_creator/builder counts only on an active home-ecosystem (OmniOne) row, so a member who founded their own ecosystem is not a platform admin. Their ecosystem's own administration (teams, badges) belongs on that ecosystem's pages, under per-ecosystem roles. `hooks/usePermissions` still derives `isAdmin`/`canManageUsers` from the `/auth/me` member profile; they no longer open AdminPanel, and the server refuses whatever they would show.

## Onboarding (G-Onboard)

Owner decisions 2026-11-01 (`uxqa/governance/wave-c.md`): consenting to an ecosystem's membership agreement(s) is what makes a member active; no steward approves newcomers; the six-section UAF ceremony is read-only history; private ecosystems are not self-service (join and sign-up answer 404); a member who left may join again when eligible; there is no "declined" state. This section supersedes the older lines it contradicts: the route contract's "`/quizzes` redirects to `/onboarding`" (it now goes to `/my-quiz-history`), and in "Orientation journeys" the 409-counts-as-joined rule and "a failed join there shows both its toast and the inline line".

**Per-ecosystem membership status.** `/auth/me` `ecosystems[]` carries the caller's own row `membership_status` and `role` there, and `member` is the server's default row (oldest active, else oldest). `lib/consent-gate.ts` `activeEcosystemIds` trusts `membership_status === 'active'` per ecosystem and falls back to the old rule (not pending, not a non-active default row) only for an entry without the field. `lib/ecosystem-join.ts` turns one row into a standing (`membershipStanding`: none, active, pending, left, paused) and answers `holdsMembershipIn` (any row except one the caller left, so a leaver joins again before orienting or consenting) and `isStewardIn` (active and mod+ there). EcosystemDetail shows "Member" only for an active row, Edit and journey-map/quiz management only for a steward there (the server's rule since change 1), "Waiting on your consent" (to `/welcome/consent`) for pending, and "Join <name>" for no row or a leaver; EcosystemList's Discover cards do the same. `AuthContext` exposes one platform-admin source, `isPlatformAdmin`, from `/auth/me` `is_platform_admin` (FX-Onboard removed the duplicate `user.is_platform_admin`; `lib/nav-access.ts` `readPlatformAdmin` reads `isPlatformAdmin`); it is never derived from a profile.

**Gate.** `READABLE_WHILE_GATED` admits `/orientation/<slug>`, `/journey` and `/complete`: the framework's order is walkthrough, then consent. `ConsentGatePage` says "You're an active member" only when some row is active; a pending gate with an empty agreement list offers "Check my membership", which calls join for that ecosystem (the server heals the row: outcome `gate_cleared`) and refreshes the session; each gate links "Learn about <name> first" to `/ethos/<id>`. `membershipWithdrawalWarning(name)` is the confirm copy for withdrawing consent to a membership agreement (withdrawal returns the member to pending); the agreement page wires it (G-Maint).

**Join.** `POST /ecosystems/:id/join` goes through `joinEcosystem` (api-client G-Onboard section), whose `OnboardingApiError` keeps the server's `code` and body, because plain `apiFetch` drops them. `joinEcosystemMutation` reads 409 `ALREADY_MEMBER` and 409 `CONSENT_REQUIRED` as "already in": the result resolves, the session refreshes, the follow-up write (orientation start, ethos consent) proceeds, and no toast claims a join. Every other refusal (404 private or unknown, 409 `MEMBERSHIP_PAUSED`, 403 `RE_ENTRY_CLOSED`, a 409 without a known code) is a failure titled "Could not join <name>". Toasts name what happened: "Joined <name>", "Welcome back to <name>" (outcome `re_entry`), "One step left: consent to <name>'s agreements" (listing them). Buttons read "Join <name>", never "request". One error per failure: inside `joinThen` (OrientationGate, the ethos ConsentGate) and on the gate page the join is `silent` and the page renders the error inline; on EcosystemDetail/List it toasts. `onboardingAffects.joinEcosystem` refreshes the catalogue, discover, the queue and the member/newcomer lists.

**Sign-up into an ecosystem.** `Login` reads `?ecosystem=<uuid>`, else the id in `?redirect=/ethos/<uuid>` or `/orientation/<uuid>…` (`lib/signup-ecosystem.ts`, node:test), and `register` sends it as `ecosystem_id`; an explicit `?ecosystem=` opens the sign-up tab. A private or unknown id is the server's 404 "Ecosystem not found", shown inline. OAuth is unchanged: the provider round-trip carries no ecosystem, so an OAuth newcomer lands in the default ecosystem and joins the invited one from its page. Login shows each failure once, inline (`authError`, now in `apiErrorMessage` words, or the form's own check); it no longer toasts failures.

**Steward moves.** `GET /members/:id/profile` returns `caller_member_moves` (`{status, label, confirm}`, server-made; empty when the caller may make none). MemberDetail's Membership card renders one button per move; each opens a confirm dialog with the server's sentence and an optional note, then `useMoveMember` (`POST /members/:id/status`, silent) renders a refusal inline once, naming the agreements still waiting on a 409 `CONSENT_REQUIRED`. The client never builds a move list of its own. MemberList filters "Waiting on consent" (`status=pending_consent`) and shows every status through `memberStatusLabel`. The fake re-send invite button is gone from UserManagement (its users already have accounts, so a sign-up link would not fit).

**Newcomers.** `/onboarding` is the stewards' Newcomers list (`GET /onboarding/newcomers`, `onboardingKeys.newcomers()` under the `onboarding` root): pending members and members who joined in the last 30 days, with ecosystem, status, agreements left, orientation status, and a "Stuck: nothing left to consent to" badge linking to the member page where the confirm move lives. A 403 reads "Only stewards see newcomers." The ceremony page is a read-only record: no record buttons, no cooling-off promise, the member's name in the header, and only an explicit consent (no position, or `consent`) counts; one count drives the bar and the sentence. The Dashboard queue lists `kind: 'newcomer'` items first (stable sort).

### FX-Onboard (wave-c fix wave, 2026-11-01)

- **Platform admin has one source.** `AuthContext.isPlatformAdmin` (`/auth/me` `is_platform_admin`). `hooks/usePermissions` (`isAdmin`, `canManageUsers`, the `admin` legacy role) and `hooks/useRoleAccess` (role `admin`) derive "admin" from it, never from a profile; a co_creator/builder profile now reads like a collaborator's there (content, not users), because it administers only its own ecosystem and the server checks that per resource. This supersedes the last sentence of "Platform admin (G-Authority)" above (`usePermissions` used to derive `isAdmin`/`canManageUsers` from the profile).
- **Steward of an ecosystem is the server's word.** `/auth/me` `ecosystems[]` carries `is_steward` (the server's `can_administer_ecosystem`: mod+ or a founder's co_creator/builder row there). `lib/ecosystem-join.ts` `isStewardIn` reads it (an older server without it: active mod/admin/owner), so a founder sees their ecosystem's journey-map and quiz management.
- **Newcomers in the sidebar.** The Community group's `/onboarding` link reads "Newcomers" and shows only to a steward of a selected ecosystem (`lib/nav-access.ts` `showsNewcomers`, node:test). The page itself lists every ecosystem the caller stewards (server, review F12), so a steward who selects another ecosystem and opens it by URL still sees their newcomers.
- **Copy.** Route guides no longer say joining is a "request" or promise a 48-hour reflection and 7-day window: joining is self-service for public ecosystems, consent activates, and a returning member starts as a member and consents again (server: a confirmed exit clears role, admin profile and consents).
- **Removed dead code** (nothing imported it): `useOnboardings`, `useSubmitCeremonyConsent`, `useRequestJoinEcosystem`, `useTransitionMemberStatus` (`hooks/use-governance.ts`) and `fetchOnboardings`, `submitCeremonyConsent`, `requestJoinEcosystem`, `transitionMemberStatus`, `registerWithPassword`, `resendMemberInvite` (`lib/api-client.ts`). "Orientation journeys" above still names `useRequestJoinEcosystem`; the join it describes is `hooks/use-onboarding.ts` `useJoinEcosystem`.

## Exchange (G-Exchange)

Shares, needs and solutions ("posts") and the collaborations they lead to (`uxqa/governance/review-exchange.md` C1-C10). Every button comes from a server flag on the post payload (`SharesNeedsPost` in `types/api.ts`): the author's moves from `allowed_next`, Edit from `caller_can_edit`, Delete from `caller_can_delete` (the author, while nobody has answered), Hide/Restore from `caller_can_moderate` (a steward of the post's ecosystem), answering from `caller_can_respond` / `respond_blocked`. The client keeps no role table for posts; `useRoleAccess().canEditSharesNeeds` and friends are no longer read by any exchange screen.

**Where things live.** Pure wording and decisions in `lib/exchange.ts` (node:test `lib/exchange.test.ts`): status and move labels, the answer button per type, `respond_blocked` sentences, visibility labels and help lines, the publish toast and landing page, age text, "Waiting on A and B", `?post=` / `?from=` parsing, server-error placement, and the Me fallback. Category values stay in `lib/sharesneeds-vocab.ts` (one list; older rows outside it show as stored). Components in `pages/discover/`: `PostForm` (publish and edit, used by `SharesNeedsForm`, `DomainPostsSection` and the edit dialog), `PostParts` (badges, byline, closed/hidden notes), `RespondDialog` (`RespondAction`), `PostManageActions` (author and moderator controls), `PostDetailDialog`, `DomainPostsSection` (the shares card of `DomainDetail`), `OwnPublications` (Me) and `ModerationPanel` (the AdminPanel tab). DomainDetail, Profile and AdminPanel only mount these.

**One error per failure.** Every exchange write hook is `silent: true`; each dialog renders its own failure with `apiErrorMessage`, and success toasts come from the hooks (`postMoveToast` reads the status the server returned). Exchange writes go through `exchangeFetch` (api-client G-Exchange section), whose `ExchangeApiError` keeps the server's `code`, `field` and extra keys; `formErrorView` puts the sentence under the field the server named when the form shows it, else once at the top, and a `DUPLICATE_POST` adds "Open your existing post". A server field message stays until the member edits that field. Destructive or irreversible acts confirm in an AlertDialog or a dialog with a required reason: Withdraw, Reopen, Delete, Hide (reason required), collaboration End (outcome + reason required). "Keep it open" is reversible and acts at once. Moves whose button disappears afterwards (Withdraw turns into Reopen, Hide into Restore) return focus to the post's control group. That is an effect on the post's status/hidden/`allowed_next`, armed when the caller starts the act, not a per-call `onSuccess`: the write puts the new post in the cache before the refetch, so the button and its dialog unmount first and TanStack skips callbacks of an unmounted observer. "Keep it open" uses `aria-disabled` while pending, because a focused button that becomes `disabled` drops focus to the page.

**Answering.** `RespondDialog` sends a required message (`useRequiredFields`) to `POST /discover/shares-needs/:id/respond`; on success it shows "Open the conversation" (`/messaging?conversation=<id>`, which `MessagingLayout` opens, then drops from the URL). The refetch after sending flips the post to "You answered this" under the open dialog, so `RespondAction` keeps the dialog mounted while it is open and, on close, moves focus to the new "Open the conversation" link. Private tracking (the old "Use"/"Serve" note) is "Track privately" inside the post detail, offered only on open posts in an ecosystem the caller belongs to, because the note is recorded on that membership.

**Detail and deep links.** `DiscoverHub` opens `PostDetailDialog` when the URL has `?post=<id>` (cards' "Details", the bell's "Still open?" item); closing removes only `post`. `postIdFromQuery` accepts a plain id (letters, digits, `-`, `_`) and nothing else, so a crafted link never reaches a request path. A post the caller may not see is the server's 404 (or 403), shown as "This post is no longer available to you" with no Retry (pass 03); any other failure keeps "We couldn't open this post" with Retry.

**Caches.** `affects.exchangePosts` (posts, my decisions, profiles, the queue, conversations) and `affects.exchangeCollaborations` (collaborations, the queue). Post writes return the full payload and set `keys.sharesNeeds.detail(id)` before the prefix refetch; delete removes that detail first so the refetch never asks for a post that is gone; collaboration writes merge into the detail (D17), never replace it. `keys.sharesNeeds.forDomain` is now read by `useDomainPosts` (use-discover); `keys.sharesNeeds.forEcosystem` by `useEcosystemPosts` (the old `useDomainSharesNeeds` was removed).

**Me.** `OwnPublications` reads `own_publications` (every status, visibility and hidden state, with reasons) and falls back to the public `publications` list read as the author's own (`ownPublicationsOf`: edit and withdraw, no delete until the server says nobody answered). This replaces the earlier rule in "Public member profiles" that a withdrawn item leaves Me's list: it now stays, marked Withdrawn, with Reopen. The list renders inside the profile `<form>`: every control is `type="button"` and every dialog form stops its submit from bubbling through the portal.

**Moderation.** AdminPanel's "shares-needs" tab is "Moderation": the steward-scoped list (`moderated_ecosystems` named at the top, stats including hidden, a hidden filter), Details and Hide/Restore only; no edit, status, delete or ecosystem/domain controls. A caller who stewards nothing reads "You are not a steward of any ecosystem, so there is nothing for you to moderate." AdminPanel itself is platform-admin only (G-Authority), so the same panel is also the page `/discover/moderation` (default export `ModerationPage`), linked from the sidebar's "Stewarding · Moderation" item when the caller moderates an ecosystem in the header selection (`useModeratedEcosystems` reads the server's `moderated_ecosystems`; `moderatedInSelection` in `lib/exchange.ts`). Restore asks for a yes only: the server records no note (wave-c F10).

**Visibility.** Three values, each with one help line: public (anyone signed in), ecosystem (its active members), domain (the domain's participants and the ecosystem's stewards). `private` is retired; an old value is shown as stored. The publish toast says where the post is listed and lands on a page that shows it (`publishedNotice`: the post's detail in Discover, the ecosystem page, or the domain page). The Dashboard's share/need/solution counts are open, visible posts only.

**Collaborations.** The detail shows who proposed it, approvals (who, when, for which ecosystem), "Waiting on …" from `awaiting`, "Record a review" (FX-Exchange F3: a required note and an optional next review date, default a year out; shown when `caller_can_review`, primary once `review_due`) and the last review (who, when, what it found), one "Approve for <ecosystem>" per `caller_can_approve_for` entry (sending `ecosystem_id`), an End dialog limited to `end_outcomes` with a required reason when `caller_can_end` ("Withdraw or decline" while proposed), the review date with a "Review due" badge, ended-by and reason, and the posts it started from. The list's "All statuses" sends `status=all`. `CollaborationForm?from=<postId>` loads the post, fixes its domain on the side it belongs to (read-only, naming its ecosystem) and sends `linked_share_need_id`: the partner ("With") for someone else's post, "Your domain" for the caller's own (`caller_is_author`), with the partner picker and its hint (the server accepts the linked post on either side). Without it the source is one of the caller's own domains. Both domain pickers ask for `status=active` domains only.

Client tests: `lib/exchange.ts` joins the pure modules listed under "Client tests".

## Exchange fix wave (FX-Exchange)

- **Messaging deep link.** `MessagingLayout` reads `?conversation=<id>` (`conversationIdFromQuery`, plain ids only), opens that thread, focuses its heading and replaces the URL with `/messaging`. A conversation the server will not open shows "We couldn't open this conversation" instead of the empty placeholder. The server lists answers to posts whatever the header selection (api/AGENTS.md "Messaging scope (FX-Exchange)"), so the bell's link, the badge and the list agree.
- **Ecosystem page.** EcosystemDetail's shares card is `pages/discover/EcosystemPostsSection` (the same `SectionPost` items as `DomainPostsSection`, the server's flags for every control, `PostForm` with the ecosystem's domains); the old local form, `confirm()` deletes and the `canEditSharesNeeds` role table are gone, as are the unused legacy client functions (`fetchSharesNeeds*`, `create/update/deleteSharesNeeds`, `fetchCollaboration`, `createCollaboration`, `activateCollaboration`, `fetchDomainSharesNeeds`) and `useDomainSharesNeeds`.
- **Dates.** CollaborationDetail reads date-only values at local noon, so a review date never shows as the day before west of UTC.

## Pass 03 fixes (03-cross-ecosystem-exchange, lane B)

Rationale for the pass-03 client fixes; defect ids are `uxqa/passes/03-cross-ecosystem-exchange/ledger.json`.

- **A dialog with no `DialogTrigger` returns focus nowhere.** Radix's modal `DialogContent` prevents the default close focus and focuses its `triggerRef`; opened from state or a URL, that ref is null and focus drops to the page body. Every such dialog passes `onCloseAutoFocus` and picks a target that still exists: `PostDetailDialog` goes back to the post's "Details" link (`data-post-details`), or after a delete (or when opened from the bell) to the Shares + needs heading (`focusSharesNeedsHeading`, `#shares-needs-heading`); the Safeguards audit dialog goes to the ecosystem card's heading after publishing, else to its "Record an audit" button; AuditDetail's goes to the page heading after publishing, else to "Continue this audit". `AuditStewardActions` now uses real triggers, and on success focuses the recorded note (`audit-<id>-response` / `-abandonment`). Its done flag is armed *before* the write, because the write's cache update unmounts the button and its dialog before `mutateAsync` resolves (needs-4, needs-8, health-12). `DeletePostDialog` uses `mutateAsync`, not `mutate` callbacks: dropping the deleted post's detail can unmount it first, and TanStack skips an unmounted observer's callbacks.
- **Post detail** opens on its title once the post loads (`useEffect` on `post.id`; Radix had focused Close, the only tabbable control while loading). "Who can see it" and every card's audience badge read `postAudienceLabel` (`PostParts`): the form's visibility words, or "Only its author and the stewards" for a hidden post. "Keep it open" carries an `aria-describedby` hint naming the 90-day check (needs-5, collab-6, plain-words-4).
- **Collaborations.** The overview `dl` holds one `div` per `dt`/`dd` pair with the icon inside the `dt` (axe definition-list, dlitem); the review date and "Review due" show only while proposed or active (collab-5, collab-8).
- **Sidebar.** Messaging shows the unread total from `useConversations` (the drawer's own list and poll), visible count plus an sr-only "N unread". Manage Quizzes follows the server's quiz rule (`api/quizzes.py quiz_steward_or_error`: a steward of the quiz's ecosystem, or a platform admin): `navPermissionsFor` reads the `/auth/me` rows like Newcomers does (`isStewardIn` over the selection), never the profile, so a townhall member or a pending newcomer no longer sees it. Every entry point asks one rule: the sidebar link, the Dashboard's "Manage learning" and the `/quiz/manage` route (`ProtectedRoute access="quiz-steward"`, `routeAccess`) all read `hooks/use-nav-permissions.ts`. The route used `canManageContent`, the profile of the /auth/me `member` row, which is the oldest active row: a founder who signed up first (that row has no profile; their co_creator row is newer) or a steward by rank with no profile saw the link and landed on Access Denied, while a townhall member was admitted to a page whose writes the server refuses. The header selection starts empty and is restored in an effect, so the route shows the loading screen until `EcosystemContext.selectionRestored`; refusing before then would flash Access Denied at a steward on a hard load. A denial names the rule (a steward of the selected ecosystem or a platform admin). The header picker's label is `ecosystemPickerLabel`: a pending newcomer reads "<name> (awaiting your consent)", never "0 ecosystems" (needs-1, collab-10).
- **Sign-in and sign-up keep Login mounted.** `AuthContext.login/loginWithCredentials/register` no longer set the global `isLoading`, which made `AppLayout` swap every route for `LoadingScreen` and remount Login empty on a failure; Login's own `isSubmitting` covers the wait. A 409 on sign-up ("Username already taken") is shown under the username field (`aria-invalid`, focused), not as the form line (plain-words-1).
- **Conversation names.** A titled two-person conversation also names the other person (`lib/conversation-title.ts`: "Ana · Re: Spare drill"), so answers to one post are told apart; a group, a title that already names them, or an unknown caller keep the bare title (plain-words-3).
- **Leaving.** `ExitForm` and its confirm dialog tell one story: nobody can refuse an exit; membership ends when a steward confirms at the end of the handoff (30 days, 7 urgent); on confirmation open posts in that ecosystem are withdrawn ("author left", `services/exchange.withdraw_on_exit`), and conversations are not deleted but leave Messages, because messaging opens a conversation only through an active member row (`api/messaging.py _active_member_ids`) (needs-2).
- **Health and audits** (`lib/health.ts`, node:test): the audit form blocks Publish until every indicator with data is rated (`auditPublishBlocker`, naming them by the form's names; the server's `RATINGS_MISSING`) and while the period is reversed (`auditPeriodError`, a field error on "Period to"); a reversed period is never sent to the snapshot, and the last values and required markers stay up. The dialog title and the audit page H1 name the ecosystem (`ecosystem_name`, optional, else the caller's membership list). The overall label is a band (`overallBandName`: `degrading` reads "Weak (score 25-49)"), never a trend word; tiles say "Framework band", the published audit "Auditor's rating"; scope and status use the form's words (`auditScopeLabel`, `auditStatusLabel`). Safeguards cards show `caller_record_audit_refusal` (optional) when there is no button, and Audit History offers "Record an audit" only when some ecosystem allows it (health-1, 3, 4, 5, 6, 7, 14).
- **Agreements.** Edit renders only for a draft or advice agreement and `caller_can_rollback` (the server's PUT rule: editable status, active member); in force, "Propose a change" is the way. `AgreementList` reads `?review=overdue&ecosystem_id=<id>` (the health page's link, `lib/agreement-list.ts`), sends both and keeps only matching items (`review_overdue`, that ecosystem's own), so an older server that ignores them still shows the right page; the banner names the ecosystem. The health count is one ecosystem's own agreements: without the id, two selected ecosystems opened both ecosystems' overdue reviews. Active and under-review cards show the next review date (health-9, health-10).
- **Tables.** `ui/table.tsx` measures its wrapper (`ResizeObserver`); while the table overflows, the wrapper is a focusable region named "<aria-label> (scrollable)", so a keyboard user can scroll it (axe scrollable-region-focusable). Give each `<Table>` an `aria-label` (health-13).
- **Dashboard** breakdown keys read through `agreementStatusLabel` / `proposalPhaseLabel`, never CSS-capitalised raw values ("Under_review") (health-14). The Shares + needs header is a wrapping flex row and "Post a share or need" takes the width its label needs (gold-propose-share-1).

### Toasts and axe (gold-signup-orient-3, collab-5)

Axe with node targets (1366 and 390 px; `/dashboard`, `/discover`, `/discover?tab=shares-needs`, a collaboration page; each with and without a toast) found the shell's recurring violations only while a toast is up:

- `button-name`: `ToastClose` (`button.right-2`, icon only). Now `aria-label="Dismiss notification"`, icon `aria-hidden`.
- `list`: the viewport `<ol>` held Radix's `<li role="status">`, which is not a list item. `Toast` passes `role="listitem"`; the announcement comes from Radix's separate live region, so nothing is lost.
- `aria-hidden-focus` (2 nodes): Radix Toast 1.2.7's `ToastFocusProxy` spans (`aria-hidden`, `tabindex="0"`) before and after the viewport, rendered only while a toast is up. A library limitation: the proxies hand focus into the viewport on arrival (`onFocusFromOutsideViewport`), so a keyboard user is not stranded, and the props cannot be overridden from outside. Recorded, not fixed.
- The collaboration page's `definition-list` / `dlitem` (6 nodes) are fixed above. No other node was found on those pages.


## Node administration and public support history

`/admin` is the catalog-driven node support surface (`pages/node-admin/AGENTS.md`).
`AuthContext.isNodeAdmin` reads only `/auth/me` `is_node_admin`; navigation and routes
use that flag independently of ecosystem profiles and the legacy platform alias.
Global user identity also authenticates a node admin with no memberships. Legacy
`/admin/users` routes redirect to the audited surface. Public `/node/audit` and its
receipt paths are available anonymously and while membership consent is pending.
The public profile badge comes from the current server assignment, separate from
achievement badges; proposal support provenance retains the real actor.

`SupportChatContext` holds explicit, owner-scoped agent support mode. Starting,
leaving or changing mode clears the transcript/session, draft and pending operation
ownership before sending another message. Each support request includes the bound
organization and public reason; the backend rechecks the assignment. Loading an
owner history restores its validated context only for a current node admin.
Support conversations do not offer public/ecosystem sharing controls.


## Platform completion: entry, matching, authoring and node support

Node Administration is an explicit global assignment from `/auth/me`, with a persistent sidebar entry and task routes under `/admin/`: Users, Ecosystems, Domains, Circles, Teams, and Onboarding & quizzes. These routes use the same audited support catalog, inspection, review and receipt services. They remain available without an ecosystem Member row and while personal entry requirements are pending. The full resource catalog is an advanced browser. Related records are searched by names and selected explicitly; exact IDs remain an advanced escape hatch. Configured membership role options are server-supplied and use human labels.

`JoinRequirements` displays the server's `join_gates` for ecosystems, domain ancestry and teams. No configured quiz means no quiz prerequisite; configured but unpublished requirements cannot be skipped. The server records actual graded attempts and activation. NodeAdmin entry exemptions are displayed explicitly and do not manufacture a pass. Agreement consent remains separate. Quiz return links are safe internal targets; results return to the original requirements, and subgroup membership requires an explicit Join after its requirements clear. Candidate question adapters never copy answer keys. Orientation surveys use this same candidate renderer and server grading.

Matching uses separate directory, contact-discovery and private-answer permissions. Public dossiers do not require private answers. The participant directory is an opt-in same-ecosystem directory, ordered alphabetically with declared-overlap context, never a reputation score. Private fit checks display governed source versions, coverage, reasons, tensions and unknowns; unavailable, low-coverage or stale results do not show numerical estimates. Owners can pause, resume, export, delete and privately annotate immutable assessment snapshots. A structured agreement editor proposes all four dimension weights and versioned source questions; ACT approval comes before publication. Ecosystem editing selects the active UAF. Node support can publish an already ratified policy for its selected ecosystem only through a reasoned reviewed action.

Journey authoring uses a step editor, ordered preview and a structured take-away resource editor, with inline validation. Advanced JSON remains available for existing complex content. The audited support form reuses these editors and the friendly quiz question editor. No editor performs model calls or quiz submissions during preview.

Unused canned OmniBot, achievement/XP no-ops, throwing share-link and badge-management mutations, and unreachable legacy UserManagement/UserQuizHistory pages were removed after confirming no active callers. Working badge/profile query hooks and actual API features remain.

Pure contracts are in `lib/frontend-hardening.test.ts`; browser completion checks are authored under `uxqa/regression/p6-admin-authoring-and-entry-quiz.mjs`. The coordinator runs the integrated checks only after the full batch and independent review are complete.


## Dev-drive cycle 1: exact attempts and authored paths

Quiz controls use stable option indices as HTML values and map them back to the original JSON choice values before submission. Numeric/string and case-distinct choices remain separate; checkbox grading is unordered. Colliding visible labels show their value kind. The correct-answer editor uses the same adapter.

QuizResults fetches the exact owner-authorized server result ID, with the actual User in its cache key. It does not search the default membership history or substitute a newer attempt. Candidate-safe quiz content travels with that result, and the validated return path remains available after an error or reload.

`journey-routing` resolves the selected destination for saved progress, completion status and local navigation, including terminal choices. Previous walks the saved selected path. Reordering retains target identities; deleting a target leaves an invalid destination that authoring validation requires the steward to repair. Server validation independently enforces the same forward-path rules and required evidence.

JourneyStepsEditor uses ordinary member quiz lookup by default. Only its explicit `supportOwner` mode calls the audited support catalog, with owner/organization/search cache isolation. SupportFieldEditor supplies that mode for NodeAdmin authoring; an ordinary steward receives no support authority from the reusable editor.

## Dev-drive cycle 2: atomic choices and current attempts

Matching belongs in `ecosystemScoped`: its steward policy and governed-source selectors call ordinary agreements/domains lists, whose server authorization also uses the current ecosystem-selection cookie. Changing selection invalidates that root so an earlier empty scoped result cannot remain cached until reload. Matching cache keys retain the actual owner and target ecosystem, and refetches retain existing REST authorization; invalidation neither combines private answers nor grants access to another selection or owner.

OrientationJourney sends one progress mutation per completed step. The server derives canonical genplan output in that transaction; the UI must not rely on a second acknowledgement request before navigation. QuizResults uses the exact owner response's current-version attempt policy: older versions can offer a first current attempt, while a consumed no-retakes version explains the steward-help path.

## Community engagement and return journeys

### Platform tour

`components/PlatformTour.tsx` offers an eight-step modal introduction on `/` or `/dashboard` after the actual signed-in owner has an active ecosystem membership, using `activeEcosystemIds`. It does not change membership, quiz, consent, or task state. Existing active members also receive the introduction once in each browser. A deep link or form never triggers the automatic modal. The top-bar question-mark help icon, named "Platform tour", resumes a paused tour or replays a completed one; opening a destination deliberately pauses it.

`lib/platform-tour.ts` stores versioned progress per actual User.id in browser local storage, with a session-memory fallback when storage is unavailable. Progress is not synchronized across devices. Starting, skipping, or completing prevents another automatic popup. Account-keyed mounting and eligibility unmounting prevent progress or modal state crossing owners or remaining open after membership access is lost. The modal traps focus, focuses each step heading, and returns focus to its launch control unless navigation owns the next focus. On small screens the header wraps into a community-selector row and an actions row. The current ecosystem name stays visible with truncation and a full accessible name. The tour remains available through a compact 44px help icon with an accessible name and explanatory title.

Anonymous `/` and `/communities` use explicit public community DTOs. Detail previews preserve the exact ecosystem through login/signup into the existing ethos and configured joining flow. Authenticated opportunity previews retain their own authorization and owner-keyed cache; an anonymous preview explains when sign-in is required.

Home retains the existing next-step queue and puts current communities and chronological activity ahead of operational metrics. `/updates` is a separate durable inbox: reading does not complete governance tasks. Source URLs pass the internal-path validator, and unread lower-bound counts display `+`. No content is invented for empty feeds.

`/settings/notifications` owns channel capability, verified contacts, scope follows/mutes, cadence and pacing. `/me` links to that canonical page. Preferences persist without a push device. Missing providers stay visibly disabled; legacy push booleans never become email/SMS consent. Scope selection uses the server's authorized named options, including exact ID lookup for source links. Explicit mute and removing a follow have different copy and effects.

All private engagement queries include actual User.id. Account transitions remove old query entries and invalidate stale browser push ownership. Push registers `/sw.js` only after an explicit enable action; registration activation has a bounded wait. Logout attempts server device removal before clearing auth and always unsubscribes the local browser; the backend independently revokes this auth session's devices. Service worker previews are generic, allow only same-origin click paths, and never cache app/API responses.

Daily digests are scheduled for09:00 and weekly forMonday09:00 in the chosen IANA zone. Quiet hours use that zone; the pause date input explicitly uses the device's local time and submits UTC. Client validators reject malformed zones and incomplete/equal quiet boundaries; server validation remains authoritative.

Pure contract and worker privacy tests: `lib/engagement.test.ts` and `lib/engagement-worker.test.ts`. Actual guarded browser regression: `uxqa/regression/p8-community-engagement.mjs`; execution is reserved for the coordinator's integrated sweep. Full design/contracts and provider gate are in `conductor/tracks/community_engagement_20261102/` at the workspace root.
