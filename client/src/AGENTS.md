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
- Signed-out visits to any non-public path redirect to `/login?redirect=<path+query>` (see §Sign-in redirect contract), never to `/`.

`App.tsx` moves focus to `#main-content` (`preventScroll`) after every client-side navigation except the first render, unless the new page already put focus inside `main` (an `autoFocus` field, a link that stayed mounted). Pages should not focus `main` themselves.

On mobile the sidebar is a sheet; `AppSidebar` closes it whenever the location changes so it never covers the page it just navigated to.

A sidebar item is shown only to members its destination admits (`lib/nav-access.ts` `visibleNavItems`, `canOpenAdminPanel`): each `facilitatorItems` entry names the gate of the page it opens (`content` = the `/quiz/manage` route's `canManageContent`; `admin-panel` = `AdminPanel`'s `isAdmin || canManageUsers`, which also gates the Administration group), and the Content Management group renders only when one of its items survives. Gating a group on a broader permission than its pages sent townhall/collaborator members to "Manage Shares & Needs" and a redirect. Icon-only controls in the collapsed rail carry their own `aria-label` (the collapsed Logout button): a tooltip is not an accessible name.

`client/index.html` declares `<link rel="icon" href="/favicon.svg">` (asset in `client/public/`); without a declared icon the browser requests `/favicon.ico` and logs a 404 on every load.

### Route guide rail

`RouteGuidePanel` keeps one persisted preference (`localStorage["neos:route-guide-open"]`). At `lg+` (1024 px) the panel is docked: while open it sets `--route-guide-width: 380px` on `<html>` (`0px` when closed, hidden, or unmounted) and the shell's `main` adds that width to its right padding (`lg:pr-[calc(var(--page-gutter)_+_var(--route-guide-width,0px))]`), so the rail never covers page controls. Below `lg` the panel overlays content, so it opens only on demand and collapses on the next navigation without overwriting the stored preference. Keep `PANEL_WIDTH` and the panel's `w-[380px]` in step.

## Sign-in redirect contract

`pages/Login.tsx` reads `?redirect=` from the raw `window.location.search` (wouter's `useSearch()` unescapes it, which would split a nested `&`) and passes it through `safeRedirect` (`lib/post-login-redirect.ts`): only same-origin in-app paths that are not `/login…` are honoured; anything else becomes `/dashboard`. `resolveInternalPath` (`lib/internal-path.ts`, re-exported by `lib/media.ts`) requires a leading `/`, no `//`, no backslash, and also rejects a path that only becomes `//host` after URL normalisation (`/.//evil.example`, `/%2e//evil.example`); `LinkifiedText` likewise treats a same-origin URL whose path starts with `//` as external. Every sign-in path (password, register, DID, already-authenticated visit) lands on that target with `replace`, unless the member is behind the consent gate (below).

OAuth cannot carry the parameter: the backend callback always returns to `/dashboard`. Before leaving, `handleOAuth` stashes the target in `sessionStorage["neos:post-login-redirect"]`; `AppLayout` consumes it once (`takeStashedRedirect`) when the session becomes authenticated and the consent gate is not holding the member (below). Non-OAuth submits clear the stash first so a stale OAuth attempt cannot redirect a later password sign-in.

## Sign-up consent gate

A self sign-up joins the server's default ecosystem behind its agreement-consent gate (`pending_consent` until each membership agreement is attested; see the API's `api/AGENTS.md` "Sign-up placement and the consent gate"). `AuthContext` exposes `pendingConsents` from `/auth/me` and every sign-in method returns `{ consentRequired }`; `Login` then lands on `CONSENT_GATE_PATH` (`/welcome/consent`, `lib/member-status.ts`) instead of the redirect target. The OAuth callback redirects a gated newcomer there itself, and `AppLayout` leaves the stashed OAuth destination in place while the gate holds them. `pages/ConsentGatePage` lists each pending ecosystem's agreements with links to `/agreements/:id` (where consent is recorded) and re-reads `/auth/me` on mount and on "check again". Statuses are shown through `memberStatusLabel` (never raw `pending_consent`); the sidebar's pending label links to the gate.

The gate is also a route guard, not only a sign-in redirect: `AppLayout` asks `consentGateRedirect` (`lib/consent-gate.ts`) on every render after auth has loaded. A member the gate holds (`isHeldAtConsentGate`: a pending consent and no ACTIVE membership) is sent to the gate from any path except the gate itself, `/agreements/:id` and `/agreements/:id/history` (they must read what they consent to; `new` and `edit` stay closed), `/ethos` and below, and the public pages (`/about`, `/governance-model`, `/users/:username`). The API serves those agreement routes to pending members on purpose (`api/AGENTS.md` "Handler contracts" rule 5). A member who is active in at least one ecosystem is never trapped: their pending gate is reached through the sidebar label. "Active" is `activeEcosystemIds`: not in `pendingConsents`, and not the `/auth/me` member row when that row's `current_status` is anything but `active` (exited, suspended, prospective). That row, the oldest membership, is the only one whose status `/auth/me` reports; an exited membership elsewhere still counts as active until the API reports a status per ecosystem (wave 2). While the gate holds the member, the stashed OAuth destination is not consumed; when consent lifts the gate, `AppLayout` takes it and lands them there, an agreement link included. AuthContext state is not a query, so consent recorded on an agreement page lifts the gate only after `refreshSession` (the gate page calls it on mount and on "check again").

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

In Me's "Your shares, needs & solutions" each item carries the author's Edit (title, description, capacity via `useUpdateSharesNeeds`) and Withdraw (confirm dialog, then `useUpdateSharesNeedsStatus` with `withdrawn`; the item leaves the list because `/profiles/me` lists only active public items). Both dialogs portal out of the profile `<form>`, but React events still bubble through portals, so the edit form's submit calls `stopPropagation`. The profile form re-seeds from `data.profile` only (structural sharing keeps it stable), so a publication change refetching the page does not discard unsaved profile edits.

## Component boundaries

Shared interaction and geometry belong in `components/ui`; page files should compose primitives instead of restyling their internals. Preserve Radix semantics, keyboard behavior, and accessible names when changing presentation.

Cards are ruled containers. Tabs are ruled navigation. Tables keep headers visible and values legible. Hover treatment uses fill, border, or a 1 px press shift—not elevation.

## Visual content

Dashboard and discovery media must be content-driven. Persist the image URL plus alt text, source, and credit when possible. Provide a deterministic fallback, reserve the image aspect ratio, lazy-load below-fold media, and never place critical copy directly on a busy image.

URL handling is context-specific: use `lib/media.resolveMediaUrl` for raster images, `resolveExternalUrl` for outbound links, and the host-allowlisted `resolveMiroEmbedUrl` for Miro iframes. Never pass a generic stored URL directly between image, link, and embed contexts.

## OmniBot (lib/omnibot.ts)

`sendOmniBotMessage` is an intentional stub, not a bug. The real chat backend (`POST /api/v1/chat/send`) is a tool-using governance agent — it has no persona/system-prompt override, unconditionally attaches governance tools (create_proposal, check_authority, etc.), and every reply persists to `AgentSession` with no session-type field, so orientation Q&A would both risk invoking governance tools mid-onboarding and pollute the member's real governance chat history. Until the backend grows a tool-free, session-segregated mode, `omnibot.ts` stays a stub and callers (`OmniBotPanel`, `AIConversationStep`) must branch on the `is_stub` flag and degrade honestly rather than fake a working exchange.

## Assistant drawer

`FloatingComms`' chat tab streams `POST /api/v1/chat/send` through `hooks/use-chat.ts`; the decisions live in
`lib/chat-tools.ts` (node:test). Tool chips show the server's plain `label` (sent on `tool_start` and
`tool_result`) and a plain status (`TOOL_STATUS_TEXT`), never the tool's code name or token counts. An
irreversible act (withdraw or ratify a proposal, put an agreement in force or end it, declare an emergency,
file an exit) comes back as `needs_confirmation` instead of success or failure; `pendingConfirmation` shows
it under the latest finished reply, with "Yes, go ahead" / "No, cancel" sending an ordinary message
(`CONFIRM_REPLY` / `DECLINE_REPLY`). The server accepts a yes only in a later turn of the same session, so
the buttons are a shortcut for typing, not a bypass; see the API's `agent/AGENTS.md` "Confirmation of
irreversible acts". A successful tool result invalidates `keys.nextSteps.all`, so the bell and the dashboard
queue follow acts taken through the assistant (G-Next).

## Documentation and verification

Keep source comments terse and local. Put design rationale and cross-component decisions in this file or `design_guidelines.md`.

Before handing off UI changes, verify keyboard navigation, focus, both resolved themes, reduced motion, narrow layouts, and representative empty/loading/error/data states. Run the repository's integrated lint/type/test sweep once after all related edits are complete.

## Agreement participation ceremonies

The agreement form declares whether individual consent is required, the
participation scopes it gates, and the alignment credit. The detail view is the
member-facing ceremony surface: it records personal attestation, shows consent
progress, collects test evidence before activation, and permits a reasoned
withdrawal. Keep its labels and select values aligned with the backend
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

`npm test` runs `node --import tsx --test "client/src/**/*.test.ts"` (Node's built-in runner; `tsx` is already a dev dependency, no browser or DOM). Test only pure modules that do not touch `import.meta.env` or React: keep logic worth testing in such a module (`lib/internal-path.ts`, `lib/post-login-redirect.ts`, `lib/domain-label.ts`, `lib/member-status.ts`, `lib/query-keys.ts`, `lib/api-error-message.ts`, `lib/api-mutation-options.ts`, `lib/query-state.ts`, `lib/required-fields.ts`, `lib/consent-gate.ts`, `lib/proposal-vocab.ts`, `lib/act-participation.ts`, `lib/ecosystem-join.ts`, `lib/chat-tools.ts`, `lib/emergency-phase.ts`, `lib/exit-status.ts`, `lib/next-steps.ts`, `lib/orientation-video.ts`, `lib/nav-access.ts`, `lib/conversation-title.ts`, `lib/decision-vocab.ts`, `pages/discover/discover-tabs.ts`) and import it from the component. `lib/query-keys.test.ts` drives a real `QueryClient` so invalidation is checked with TanStack's own prefix matching; `lib/api-mutation-options.test.ts` runs mutations through a real `MutationObserver` with an injected toast. `tsconfig.json` excludes `*.test.ts`, so `npm run check` does not type-check tests.

Behaviour that only shows in a browser (focus after a submit, a list refetch clearing a badge, a dialog before an irreversible act, which links a member is shown) is guarded by a Playwright flow in the superproject, `uxqa/regression/<defect-id>.mjs`, run on the local study stack (`uxqa/regression/AGENTS.md`). Each one fails when its fix is reverted.

## Pass 01 (first week) history note

The UX-QA pass-01 client fixes span two commits. `7841c55` (`fix(uxqa-01-first-week): …`) carries the domain-name, advice/status a11y, route-guide rail and Discover-tab code plus this file's text, but the code for p1-arrival-and-welcome-1/7/8 (Login `safeRedirect` and OAuth stash, orientation states) and p1-keyboard-and-screen-reader-week-4/5/10/11/12/15 (shell focus on navigation, route-guide padding in `App.tsx`, `NewConversationDialog`, `LinkifiedText`, `ProposalDetail` `caller_can_manage` UI, `types/api.ts` domain fields) landed earlier in `2cb3f26` ("feat: add member decision recording…"). Revert or cherry-pick both together. The review follow-up (`fix(uxqa-01-first-week): review findings`) hardened the `2cb3f26` redirect and link code above.

