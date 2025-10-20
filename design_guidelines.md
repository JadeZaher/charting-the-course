# Design Guidelines: Course & Team Management Platform

## Design Approach

**System-Based with Educational Platform References**  
Using Material Design principles as the foundation, enhanced with patterns from modern learning platforms (Notion, Canvas, Linear). This approach prioritizes clarity, efficiency, and progressive disclosure of complex information while maintaining an inviting, approachable aesthetic suitable for educational contexts.

**Core Principles:**
- Information hierarchy through typography and spacing, not excessive color
- Progressive disclosure for complex admin features
- Consistent, predictable interaction patterns across roles
- Visual feedback that builds confidence in user actions

---

## Color Palette

### Light Mode
- **Primary**: 220 85% 55% (Calm, trustworthy blue - course actions, navigation)
- **Primary Hover**: 220 85% 48%
- **Secondary**: 265 70% 60% (Supporting purple - secondary actions, facilitator features)
- **Success**: 145 70% 45% (Quiz completion, progress indicators)
- **Warning**: 35 90% 55% (Pending items, draft status)
- **Error**: 0 75% 55% (Failed uploads, validation errors)
- **Background**: 210 15% 98%
- **Surface**: 0 0% 100% (Cards, panels)
- **Border**: 210 12% 88%
- **Text Primary**: 215 20% 20%
- **Text Secondary**: 215 15% 45%

### Dark Mode
- **Primary**: 220 75% 60%
- **Primary Hover**: 220 75% 68%
- **Secondary**: 265 60% 65%
- **Success**: 145 60% 50%
- **Warning**: 35 80% 60%
- **Error**: 0 70% 60%
- **Background**: 215 25% 12%
- **Surface**: 215 20% 16%
- **Border**: 215 15% 24%
- **Text Primary**: 210 15% 92%
- **Text Secondary**: 210 12% 70%

---

## Typography

**Font Families:**
- **Primary**: Inter (via Google Fonts CDN) - UI text, body content
- **Headings**: Inter (weight variation for hierarchy)
- **Code/Data**: JetBrains Mono - JSON displays, technical content

**Scale:**
- **Hero/Page Titles**: text-4xl font-bold (36px) - Dashboard welcome, page headers
- **Section Headers**: text-2xl font-semibold (24px) - Card titles, panel headers
- **Subsections**: text-lg font-medium (18px) - Quiz titles, module names
- **Body**: text-base (16px) - Primary reading content
- **Supporting**: text-sm (14px) - Metadata, timestamps, helper text
- **Micro**: text-xs (12px) - Labels, badges, status indicators

---

## Layout System

**Spacing Primitives**: 2, 4, 6, 8, 12, 16, 20 (Tailwind units)
- **Micro spacing**: 2, 4 (icon-text gaps, tight groupings)
- **Component spacing**: 6, 8 (card padding, form field gaps)
- **Section spacing**: 12, 16, 20 (between major content blocks)

**Grid Structure:**
- **Max Content Width**: max-w-7xl (1280px) for main content areas
- **Dashboard Cards**: Grid with gap-6, responsive (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- **Admin Control Panel**: Two-column layout (sidebar + main) with sidebar at w-64
- **Forms**: Single column, max-w-2xl for readability

---

## Component Library

### Navigation
**Top Navigation Bar:**
- Fixed header with backdrop-blur-md bg-surface/90
- Logo left, main navigation center, user profile right
- Height: h-16
- Shadow: shadow-sm in light mode, subtle border in dark mode
- Active state: border-b-2 border-primary with text-primary

**Role Indicator Badge:**
- Small pill badge next to username (text-xs px-2 py-1 rounded-full)
- Color-coded: Admin (primary), Facilitator (secondary), Contributor (success), Viewer (gray)

### Cards & Containers
**Standard Card:**
- rounded-xl border border-border bg-surface
- p-6 for content padding
- hover:shadow-lg transition-shadow duration-200
- Subtle elevation increase on hover

**Dashboard Stat Card:**
- Compact height with large number (text-3xl font-bold)
- Icon in top-right corner (h-8 w-8 opacity-60)
- Trend indicator (small arrow + percentage)

**Quiz Card:**
- Horizontal layout: icon/thumbnail left, content center, status/action right
- Status badges: rounded-lg px-3 py-1 text-sm font-medium
- Progress bar: h-2 rounded-full bg-border with colored fill

### Forms & Inputs
**Text Inputs:**
- rounded-lg border-2 border-border focus:border-primary
- px-4 py-3 text-base
- Transition: transition-colors duration-150
- Dark mode: bg-surface border-border text-text-primary

**File Upload Zone:**
- Dashed border (border-2 border-dashed border-border)
- Large drop zone: min-h-48 rounded-xl
- Center-aligned icon (upload cloud, h-12 w-12 text-text-secondary)
- Hover state: bg-primary/5 border-primary

**Buttons:**
- Primary: bg-primary text-white rounded-lg px-6 py-3 font-medium
- Secondary: bg-secondary text-white rounded-lg px-6 py-3 font-medium
- Outline: border-2 border-primary text-primary bg-transparent
- Sizes: Small (px-4 py-2 text-sm), Regular (px-6 py-3), Large (px-8 py-4 text-lg)

### Data Display
**Table (Quiz Results, User List):**
- Minimal borders: border-b border-border on rows only
- Hover: bg-surface-hover (slight tint)
- Headers: sticky top-0 bg-surface font-semibold text-sm uppercase tracking-wide
- Cell padding: px-6 py-4

**Progress Indicators:**
- Circular: Use percentage with subtle gradient fill
- Linear: h-2 rounded-full with animated gradient on completion
- Colors map to success (>80%), warning (50-80%), error (<50%)

**Map/Visual View:**
- Canvas-based or SVG interactive diagram
- Nodes: Circular for teams (w-20 h-20), rectangular for courses (w-32 h-24)
- Connections: Dashed lines (stroke-dasharray) for pending, solid for active
- Hover: Scale 1.05 with shadow-xl
- Click: Border highlight with info panel slide-in from right

### Admin Control Panel
**Sidebar Navigation:**
- w-64 fixed left sidebar
- bg-surface border-r border-border
- Menu items: rounded-lg px-4 py-3 hover:bg-primary/10
- Active: bg-primary text-white
- Icons from Heroicons (use CDN)

**Data Tables with Actions:**
- Row actions appear on hover (edit, delete icons)
- Bulk actions: Checkbox column + sticky action bar at top when selected
- Inline editing: Click to edit with save/cancel micro-actions

---

## Interactions & Animations

**Page Transitions:**
- Fade in content: opacity-0 to opacity-100 over 200ms
- Slide panels from right: translate-x-full to translate-x-0 over 300ms ease-out

**Micro-interactions:**
- Button press: Scale 0.98 on active
- Card hover: Lift with shadow (translateY(-2px))
- Checkbox/toggle: Smooth color transition over 150ms
- File upload success: Green checkmark with scale-in animation

**Loading States:**
- Skeleton screens for initial page loads (bg-border animate-pulse)
- Spinner for actions: Simple rotating ring (border-4 border-primary border-t-transparent)
- Progressive loading: Cards appear with stagger delay (50ms each)

---

## Page-Specific Layouts

### Login Page
- Centered card (max-w-md) on full-height viewport
- Logo/brand at top
- Form fields vertically stacked with gap-4
- File upload zone below sign-in option with clear separator
- Split layout option: Left (form), Right (hero image showing platform benefits)

### Dashboard
- Grid of 4 stat cards at top (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Recent activity feed: Timeline layout with left border accent
- Quick actions: Large button tiles (grid-cols-2 md:grid-cols-4)
- Charts: Use Chart.js or similar, with primary color scheme

### Quiz Pages
**Take Quiz:** Step-by-step with progress bar, one question per view, large touch targets for options
**Quiz Results:** Summary card with score visualization, detailed breakdown in accordion sections

### Map View
- Full-width canvas with zoom/pan controls in bottom-right corner
- Sidebar toggles for filters and legend
- Info panel slides in from right on node selection

---

## Accessibility

- Focus indicators: ring-2 ring-primary ring-offset-2
- Keyboard navigation: Visible focus states throughout
- Color contrast: All text meets WCAG AA standards (4.5:1 minimum)
- Dark mode: Consistent implementation across all inputs, forms, and interactive elements
- Screen reader labels on all interactive elements
- Error messages: Clear, actionable text below affected fields

---

## Images

**Login Page Hero:** Abstract educational illustration (books, people collaborating, digital learning) - right side of split layout, soft gradient overlay  
**Dashboard Welcome Section:** Optional small avatar/profile image, team photo thumbnail in recent activity  
**Empty States:** Friendly illustrations for "no quizzes yet," "no teams assigned" with call-to-action buttons  
**Map View Background:** Subtle grid pattern or abstract network visualization as canvas background  

No large hero images needed on internal pages - focus on efficient information display and task completion.