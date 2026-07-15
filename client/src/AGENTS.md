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

- `/discover` renders `pages/discover/DiscoverHub`.
- `/solutions` renders the former `pages/Discover` catalogue.
- `/explore` and `/discover/hub` redirect to `/discover`.
- Ethos and orientation routes belong to the Solutions navigation state.

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
