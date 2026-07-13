# NEOS Design System — Signal Paper / Black Index

## Direction

NEOS is a functional Swiss-brutalist information system: warm paper in light mode, a true-black index in dark mode, oversized sans-serif hierarchy, hard rules, and generous internal space. The interface should feel editorial and exact rather than decorative.

The system has five rules:

1. Information leads; decoration recedes.
2. Outer gutters stay economical while panels and sections have ample internal space.
3. Hierarchy comes from scale, weight, rules, and inversion—not shadows or gradients.
4. Every color is a semantic role with a tested foreground partner.
5. Discovery surfaces may be image-rich, but imagery must carry meaning and preserve readable controls.

## Color roles

Use tokens from `client/src/index.css`; never copy these values into components.

| Role | Light | Dark | Use |
|---|---:|---:|---|
| Page | `#F2EDE3` | `#000000` | Application canvas |
| Surface | `#FFFDF8` | `#0A0A0A` | Cards, menus, panels |
| Text | `#15130F` | `#F7F2E8` | Primary copy and strong rules |
| Muted text | `#5E584E` | `#AAA49A` | Metadata and supporting copy |
| Border | `#C8BEAF` | `#2D2D2D` | Structural rules |
| Control border | `#6C655A` | `#7A756D` | Inputs and inactive controls |
| Link / focus / info | `#1739D6` | `#82A7FF` | Links, keyboard focus, selected data |
| Success | `#146B43` | `#66D69A` | Confirmed and healthy states |
| Warning | `#855600` | `#F5BD57` | Pending or caution states |
| Destructive | `#A42B24` | `#FF8B7C` | Errors and destructive actions |

Default actions use foreground/background inversion. Blue is reserved for links, focus, and informational data—not generic decoration. Status meaning must include text or an icon; never rely on hue alone.

## Typography

- Primary: Inter, with Helvetica Neue and Arial fallbacks.
- Data and code: JetBrains Mono.
- Use weights 400–900. Page titles are 800+, compact, and tightly tracked.
- Display: `text-display`; page title: `text-page-title`; metrics: `text-metric`.
- Kicker/index labels: 10–11 px, 800 weight, uppercase, wide tracking.
- Body copy stays 14–16 px with relaxed leading and a maximum reading width of `68ch`.
- Avoid serif display copy, lightweight headings, and centered paragraphs longer than two lines.

## Layout and spacing

- The route canvas is full width. Do not add a page-level `max-w-*` wrapper.
- `--page-gutter` controls economical outer spacing: 16–32 px fluid.
- `--panel-padding` controls generous internal space: 20–36 px fluid.
- `--section-gap` separates major narratives: 40–72 px fluid.
- Restrict only prose, narrow forms, or intentional detail rails—not dashboards or discovery grids.
- Prefer ruled grids and asymmetric editorial compositions. Dense data may use responsive columns; preserve a clear reading order at narrow widths.
- On mobile, stack detail panels, keep the primary action reachable, and allow data tables to scroll horizontally.

## Geometry and depth

- Corners are square, with a maximum radius of 2 px.
- Reserve full circles for true avatars, radio indicators, and status dots; never use pill geometry for containers or ordinary actions.
- Use 1 px dividers and 2 px structural or interactive borders.
- Do not use gradients, glass blur, soft drop shadows, floating cards, or glow effects.
- Depth is expressed with containment, overlap, hard rules, inversion, and at most a deliberate hard-offset shadow.
- Controls have a minimum 44 px target. Compact checkboxes, radios, and switches use expanded invisible hit areas.

## Components

### Navigation

The sidebar is a typographic index. Group labels use numbered or categorical kickers; the active destination uses full inversion and a hard left rule. `Discover` is the visual collaboration hub. `Solutions` is the ethos/orientation catalogue.

### Buttons and inputs

Primary buttons invert foreground and background. Secondary and outline controls use a 2 px rule. Hover states change fill or border; active states may shift by 1 px. Inputs are at least 44 px high with a 2 px control border and explicit labels.

### Cards and panels

Cards are bordered surfaces, not floating tiles. Use generous padding and strong headings. A card may become fully clickable only when it has one destination; otherwise keep actions explicit.

### Tables and tabs

Tables have sticky micro-label headers, ruled rows, 52 px target rows, and tabular numbers. Tabs form a full-width rule; the active tab is indicated by text and a 2 px underline.

### Charts

Use semantic chart tokens and render axes, labels, legends, and tooltips with current theme roles. Provide direct values or a table alternative. Keep grid lines quiet, label important points directly, and do not communicate categories with color alone.

## Dashboard and discovery imagery

- Use rich images for people, places, ecosystems, projects, and editorial features—not as generic wallpaper.
- Store a stable `image_url`, descriptive alt text, source, and credit when content is seeded.
- Crop with a clear focal point. Prefer 4:3 or 3:2 editorial frames and square corners.
- Keep text off busy image regions. If an image must sit behind text, use a hard opaque caption panel rather than a gradient overlay.
- Use optimized responsive assets, lazy-load below the fold, and provide a deterministic fallback.

## Motion and accessibility

- Keyboard focus is always a 2 px blue outline with a 2 px offset.
- Main routes expose a skip link and a focusable `#main-content` target.
- Respect `prefers-reduced-motion`; no interaction depends on motion.
- Preserve native zoom and text resizing.
- Support `forced-colors` and visible selected, disabled, error, and loading states.
- Theme preference supports Light, Dark, and System. The prepaint script and runtime provider must resolve themes identically.
- Test representative states at 320 px, 768 px, 1280 px, and 200% zoom.

## Route language

- `/discover`: visual, explorative collaboration hub.
- `/solutions`: ethos catalogue and entry into orientation journeys.
- `/explore` and `/discover/hub`: legacy redirects to `/discover`.
- Navigation labels and active states must follow this ownership exactly.
