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

### Route guide rail

`RouteGuidePanel` keeps one persisted preference (`localStorage["neos:route-guide-open"]`). At `lg+` (1024 px) the panel is docked: while open it sets `--route-guide-width: 380px` on `<html>` (`0px` when closed, hidden, or unmounted) and the shell's `main` adds that width to its right padding (`lg:pr-[calc(var(--page-gutter)_+_var(--route-guide-width,0px))]`), so the rail never covers page controls. Below `lg` the panel overlays content, so it opens only on demand and collapses on the next navigation without overwriting the stored preference. Keep `PANEL_WIDTH` and the panel's `w-[380px]` in step.

## Sign-in redirect contract

`pages/Login.tsx` reads `?redirect=` from the raw `window.location.search` (wouter's `useSearch()` unescapes it, which would split a nested `&`) and passes it through `safeRedirect` (`lib/post-login-redirect.ts`): only same-origin in-app paths that are not `/login…` are honoured; anything else becomes `/dashboard`. `resolveInternalPath` (`lib/internal-path.ts`, re-exported by `lib/media.ts`) requires a leading `/`, no `//`, no backslash, and also rejects a path that only becomes `//host` after URL normalisation (`/.//evil.example`, `/%2e//evil.example`); `LinkifiedText` likewise treats a same-origin URL whose path starts with `//` as external. Every sign-in path (password, register, DID, already-authenticated visit) lands on that target with `replace`, unless the member is behind the consent gate (below).

OAuth cannot carry the parameter: the backend callback always returns to `/dashboard`. Before leaving, `handleOAuth` stashes the target in `sessionStorage["neos:post-login-redirect"]`; `AppLayout` consumes it once (`takeStashedRedirect`) when the session becomes authenticated. Non-OAuth submits clear the stash first so a stale OAuth attempt cannot redirect a later password sign-in.

## Sign-up consent gate

A self sign-up joins the server's default ecosystem behind its agreement-consent gate (`pending_consent` until each membership agreement is attested; see the API's `api/AGENTS.md` "Sign-up placement and the consent gate"). `AuthContext` exposes `pendingConsents` from `/auth/me` and every sign-in method returns `{ consentRequired }`; `Login` then lands on `CONSENT_GATE_PATH` (`/welcome/consent`, `lib/member-status.ts`) instead of the redirect target. The OAuth callback redirects a gated newcomer there itself, and `AppLayout` drops the stashed OAuth destination while a gate is pending. `pages/ConsentGatePage` lists each pending ecosystem's agreements with links to `/agreements/:id` (where consent is recorded) and re-reads `/auth/me` on mount and on "check again". Statuses are shown through `memberStatusLabel` (never raw `pending_consent`); the sidebar's pending label links to the gate.

## Orientation journeys

Journey maps are served by the orientation blueprint: `GET /api/v1/orientation/journey-maps/:id` (there is no `/api/v1/journey-maps`). Unknown `/api/*` paths now return JSON 404s instead of redirecting to `/dashboard`, so a wrong path surfaces as a query error rather than SPA HTML.

`OrientationJourney` renders four distinct states: loading; load failure ("We couldn't load this journey" + Retry); a map with an empty `content_sequence` ("This journey has no steps yet"); and completion, shown only when `progress.status === 'complete'`. `OrientationComplete` shows the celebration only for a completed journey and otherwise links back to continue or choose a journey. The ethos page's per-journey "Begin <title>" links pass `?journey=<id>`, which `OrientationGate` preselects; `JourneyMapCard` exposes its selection with `aria-pressed`.

## Messaging

`components/messaging/NewConversationDialog` is the single new-conversation flow, rendered by both `/messaging` and the `FloatingComms` drawer; it owns its form state and reports the created conversation through `onCreated`. Message bodies render through `components/messaging/LinkifiedText`: only `http(s)` URLs become links, same-origin URLs become in-app wouter `Link`s, external ones open in a new tab with `rel="noopener noreferrer"`, trailing sentence punctuation is left outside the link, and all text stays React-escaped (no HTML injection path).

The floating drawer is a non-modal `role="dialog"` named "Communications": opening it moves focus into the panel, closing it (button, launcher, or Escape) returns focus to the launcher. Icon-only controls carry `aria-label`s ("New conversation", "Send message", "Stop response").

## Public member profiles

`/users/:identifier` is an always-public, whitelisted member record. It consumes the purpose-built profiles API rather than member-detail endpoints so authentication data, contact details, private notes, and raw quiz answers cannot leak into the public surface.

Platform-wide biography, links, skills, interests, and projects belong to the user profile. Ecosystem roles and domain participation remain membership records and are aggregated for display. Completed quizzes are grouped by their effective ecosystem and domain; ecosystem-wide quizzes use an explicit general bucket. Shares, needs, and solutions appear only when they are active, public, and authored by that user.

`/profile` is the owner editor for the same contract. Do not reintroduce page-level profile visibility controls: individual operational records may retain their own visibility, but the member profile itself is public.

## Component boundaries

Shared interaction and geometry belong in `components/ui`; page files should compose primitives instead of restyling their internals. Preserve Radix semantics, keyboard behavior, and accessible names when changing presentation.

Cards are ruled containers. Tabs are ruled navigation. Tables keep headers visible and values legible. Hover treatment uses fill, border, or a 1 px press shift—not elevation.

## Visual content

Dashboard and discovery media must be content-driven. Persist the image URL plus alt text, source, and credit when possible. Provide a deterministic fallback, reserve the image aspect ratio, lazy-load below-fold media, and never place critical copy directly on a busy image.

URL handling is context-specific: use `lib/media.resolveMediaUrl` for raster images, `resolveExternalUrl` for outbound links, and the host-allowlisted `resolveMiroEmbedUrl` for Miro iframes. Never pass a generic stored URL directly between image, link, and embed contexts.

## OmniBot (lib/omnibot.ts)

`sendOmniBotMessage` is an intentional stub, not a bug. The real chat backend (`POST /api/v1/chat/send`) is a 29-tool governance agent — it has no persona/system-prompt override, unconditionally attaches governance tools (create_proposal, check_authority, etc.), and every reply persists to `AgentSession` with no session-type field, so orientation Q&A would both risk invoking governance tools mid-onboarding and pollute the member's real governance chat history. Until the backend grows a tool-free, session-segregated mode, `omnibot.ts` stays a stub and callers (`OmniBotPanel`, `AIConversationStep`) must branch on the `is_stub` flag and degrade honestly rather than fake a working exchange.

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

## Client tests

`npm test` runs `node --import tsx --test "client/src/**/*.test.ts"` (Node's built-in runner; `tsx` is already a dev dependency, no browser or DOM). Test only pure modules that do not touch `import.meta.env` or React: keep logic worth testing in such a module (`lib/internal-path.ts`, `lib/post-login-redirect.ts`, `lib/domain-label.ts`, `lib/member-status.ts`, `pages/discover/discover-tabs.ts`) and import it from the component. `tsconfig.json` excludes `*.test.ts`, so `npm run check` does not type-check tests.

## Pass 01 (first week) history note

The UX-QA pass-01 client fixes span two commits. `7841c55` (`fix(uxqa-01-first-week): …`) carries the domain-name, advice/status a11y, route-guide rail and Discover-tab code plus this file's text, but the code for p1-arrival-and-welcome-1/7/8 (Login `safeRedirect` and OAuth stash, orientation states) and p1-keyboard-and-screen-reader-week-4/5/10/11/12/15 (shell focus on navigation, route-guide padding in `App.tsx`, `NewConversationDialog`, `LinkifiedText`, `ProposalDetail` `caller_can_manage` UI, `types/api.ts` domain fields) landed earlier in `2cb3f26` ("feat: add member decision recording…"). Revert or cherry-pick both together. The review follow-up (`fix(uxqa-01-first-week): review findings`) hardened the `2cb3f26` redirect and link code above.

