# CourseHub - Interactive Learning & Team Management Platform

## Overview

CourseHub is a quiz hosting and analysis platform with profile-driven user discovery. Users create quizzes via the SurveyJS online demo, export JSON, then import to the platform. Quiz results generate tags from custom question properties, which populate user profiles with "deeply human aspects" (personality, strengths, values, interests, growth areas). The application supports role-based access control (Admin, Facilitator, Contributor, Viewer) where admins/facilitators can upload quizzes while all users can take quizzes and build their profiles. Built with React/TypeScript frontend and Supabase Edge Functions backend.

## Recent Changes (January 2026)

**Tile Architecture Migration (Phase 1 - Jan 29):**
- Added `permissions` (jsonb) and `is_archived` (boolean) columns to `profiles` table
- Added `hiddenFromUser` (boolean) to quizzes table for admin proxy feature
- Added `submittedBy` (varchar) to quiz_results for proxy submissions
- Created new `profile_tiles` table for generic tile architecture (migration: `20260129_create_profile_tiles.sql`)
- Backfilled existing admin users with full permissions array
- Old badge/tag system preserved for backward compatibility

**Phase 2 Cleanup (Jan 29):**
- Disabled gamification backend (calculate-achievements returns graceful no-op)
- Removed Teams and Map View from sidebar navigation
- Removed MapView.tsx file and route from App.tsx
- Removed Map View from Dashboard navigation cards
- Simplified Profile.tsx: removed tabs, StatCards, XP/level progress, XPLevel interface
- Simplified PublicProfile.tsx: removed Journey Progress XP section, removed Journey and Connections tabs
- Both profiles now use single-page scrolling layout
- Created SQL migration for proxy feature columns (`supabase/migrations/20260129_add_proxy_columns.sql`)
- Improved QuizResults.tsx: now shows all responses for assessment quizzes (not just gradable questions)
- Added MyQuizHistory.tsx page for viewing all quiz history (not just recent 5)
- Profile page now has "View All History" link to access complete quiz history

**Phase 6: Frontend Tile Display System (Jan 29):**
- Created tile component library: `client/src/components/profile/tiles/`
  - TileRenderer.tsx - Main component that renders tiles by type
  - BadgeTile.tsx - Displays achievement badges with icons
  - TextTile.tsx - Shows text-based insights
  - ChartTile.tsx - Renders horizontal bar charts for scores
  - ListTile.tsx - Displays lists of items with values
  - ScoreTile.tsx - Shows score metrics with progress rings
  - TileGrid.tsx - Grid layout with visibility toggle for profile owners
- Updated Profile.tsx to fetch and display profile tiles with visibility controls
- Updated PublicProfile.tsx to display visible tiles with alignment scoring
- Created alignment function (`client/src/lib/alignment.ts`) for user similarity
- Alignment shown to logged-in users viewing other profiles (Jaccard similarity + dimension bonus)
- Created `profile_layouts` and `tile_layout_settings` tables for future multi-layout support

**Phase 4: Strategy Engine - Survey to Tile (Jan 29):**
- Created `supabase/functions/_shared/tileGeneration.ts` - Strategy engine for tile generation
- Tile types: badge, text, chart, list, score, custom
- Profile dimensions: personality, strengths, values, interests, growth
- **NEW: Created `submit-with-tiles` edge function** for tile generation (backward-compatible deployment)
- **Restored `submit-with-tags` to original version** - uses old tags/badges system for existing published site
- Assessment quizzes (no correct answers) now skip Pass/Fail scoring (score=0, is_passed=null)
- Tiles stored in `profile_tiles` table with submission_id linking to quiz_results
- Strategy can be embedded in quiz metadata or registered per quiz ID
- **Frontend Integration Complete**: TakeQuiz.tsx refactored to call `submit-with-tiles` edge function
- Removed all local tag/badge/XP processing from frontend (300+ lines of deprecated code removed)
- Deployment note: Deploy both `submit-with-tags` (legacy) and `submit-with-tiles` (new) functions

**Phase 3 Security & Permissions (Jan 29):**
- Created `usePermissions` hook for granular permission checks from JSONB column
- Updated UserManagement.tsx with permissions checkboxes (replaces role dropdown)
- Added archive/restore functionality for users with filter toggle
- Permissions: manage_users, manage_content, proxy_quiz, view_analytics
- Backward-compatible: OR logic checks both old roles AND new permissions
- Created RLS migration SQL in `supabase/migrations/20260129_permissions_rls.sql`

**Permissions Migration Complete (Jan 29):**
- Migrated all components from `useRoleAccess` to `usePermissions` hook
- Updated filter dropdown in UserManagement from roles to permissions
- Updated AppSidebar, QuizList, Dashboard, AdminPanel, UserQuizHistory, Profile, App.tsx
- `useRoleAccess` hook preserved for backward compatibility but no longer imported
- All permission checks now use new system: canManageUsers, canManageContent, etc.

**Supabase Schema Alignment (Jan 29):**
- Updated `usePermissions` hook to query from `profiles` table (not `users`)
- Supabase uses `profiles` table for user data, `user_roles`/`roles` for role assignments
- Permissions stored as JSONB array on `profiles.permissions` column
- `is_archived` boolean on `profiles` table for soft-delete functionality
- Existing RLS helper functions (`is_admin()`, `is_admin_or_facilitator()`) remain unchanged
- Backward compatibility: role-based access works via `user_roles` → `roles` lookup
- AdminPanel uses single Dialog pattern outside user list for reliable state management
- UserManagement and AdminPanel mutations now target `profiles` table directly

**Architecture Migration to Supabase:**
- Migrated from Node.js/Express backend to Supabase Edge Functions
- Replaced Replit Auth with Supabase Auth
- Database now uses Supabase PostgreSQL with Row Level Security (RLS)
- Tag extraction logic moved to `supabase/functions/_shared/tagExtraction.ts`
- Drizzle ORM retained for frontend type safety

**Cleanup Completed:**
- Removed obsolete `server/` directory (Express routes, storage layer, Replit Auth)
- Removed unused `useAuth.ts` hook (replaced by `useSupabaseAuth.ts`)
- Removed completed migration scripts

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite for fast development and optimized production builds
- **Routing:** Wouter (lightweight client-side routing)
- **State Management:** TanStack Query (React Query) for server state
- **UI Framework:** shadcn/ui components built on Radix UI primitives
- **Styling:** Tailwind CSS with custom design system variables
- **Theme Support:** Light/dark mode via context provider with localStorage persistence
- **Authentication:** Supabase Auth via `useSupabaseAuth` hook

**Component Architecture:**
- Reusable component library in `client/src/components/ui/`
- Custom business components (QuizCard, StatCard, RoleBadge, EmptyState, FileUploadZone)
- Sidebar navigation pattern with collapsible functionality
- Theme toggle component for mode switching

**Page Structure:**
- **Dashboard:** Welcome/landing page with navigation cards to main features
- **QuizList:** Browse and filter available quizzes with status tracking
- **TakeQuiz:** Interactive quiz-taking interface with progress tracking
- **QuizResults:** Detailed results display with export functionality
- **Profile:** Tab-based interface with Overview, Dimensions, Badge Collection, Location, Contact, and Privacy Settings
- **QuizManagement:** Admin/facilitator interface for uploading SurveyJS quiz JSON
- **AdminPanel:** Administrative interface for user management
- **Login:** Authentication page using Supabase Auth

### Backend Architecture

**Technology Stack:**
- **Runtime:** Supabase Edge Functions (Deno)
- **Database:** Supabase PostgreSQL with Row Level Security (RLS)
- **Type Safety:** Drizzle ORM for schema definitions and frontend types
- **Authentication:** Supabase Auth (JWT-based)

**Edge Functions Structure (`supabase/functions/`):**
- `_shared/` - Shared utilities including `tagExtraction.ts`
- `quiz/` - Quiz operations (create, submit, get results, etc.)
- `profile/` - Profile management
- `profiles/` - User discovery
- `badges/` - Badge operations
- `achievements/` - Achievement calculations
- `admin/` - Admin operations

**Key Edge Functions:**
- `quiz/submit-with-tags` - Submits quiz answers, extracts tags, recalculates badges
- `quiz/get-visible-quizzes` - Returns quizzes user can access
- `profile/get-profile` - Retrieves user profile with privacy filtering
- `achievements/calculate-achievements` - Determines badges from tags

**Database Schema (shared/schema.ts):**
- **users:** User profiles with Supabase Auth integration
- **quizzes:** Quiz definitions with SurveyJS JSON content
- **quizResults:** Completed quiz submissions with scores
- **quizProgress:** In-progress quiz state tracking
- **userTags:** Individual tags extracted from quiz answers
- **userBadges:** Consolidated badges awarded based on tag patterns
- **userProfileData:** Aggregated profile dimensions (personality, strengths, values, interests, growth)
- **userPrivacySettings:** User control over public profile visibility

**Role-Based Access:**
- Four user roles: admin, facilitator, contributor, viewer
- Default role is "viewer" for new users
- Permissions enforced via RLS policies and Edge Function logic

### Authentication & Authorization

**Supabase Auth:**
- JWT-based authentication
- Email/password and social login support
- Session management handled by Supabase client
- User data synchronized to users table

**Auth Flow:**
1. User authenticates via Supabase Auth
2. JWT token issued and stored client-side
3. Edge Functions validate JWT on each request
4. RLS policies enforce data access based on user ID and role

### Tag Extraction System

**How Custom Tags Work:**
Quiz creators add custom properties to SurveyJS questions:
- `tagKey`: The tag identifier (e.g., "leadership-style")
- `tagCategory`: Category for grouping (e.g., "personality", "skills")
- `profileDimension`: Which dimension to update (personality, strengths, values, interests, growth)
- `tags`: Array of tag strings to apply
- `customTag` on choices: Tag specific to that choice selection

**Tag Cleanup on Retakes:**
- When users retake a quiz, old tags from previous attempts are deleted
- Quiz result history is preserved for audit
- Badges are recalculated from current tags after cleanup
- All operations are atomic (transactional)

### Development Workflow

**Local Development:**
- Frontend: `npm run dev` starts Vite dev server
- Edge Functions: Deploy to Supabase project for testing
- Type generation: Drizzle schema in `shared/schema.ts`

**Environment Requirements:**
- VITE_SUPABASE_URL: Supabase project URL
- VITE_SUPABASE_ANON_KEY: Supabase anonymous key
- Database connection managed by Supabase

**File Structure:**
- `/client`: Frontend React application
- `/shared`: Shared types and Drizzle schema definitions
- `/supabase/functions`: Supabase Edge Functions
- `/supabase/migrations`: Database migrations
- `/attached_assets`: Static assets (images, documents)

## External Dependencies

**Database & Backend:**
- **Supabase:** PostgreSQL database, Edge Functions, Auth, Storage
- **Drizzle ORM:** Type-safe schema definitions for frontend

**UI Component Library:**
- **Radix UI:** Unstyled, accessible component primitives
- **shadcn/ui:** Pre-built component system using Radix UI + Tailwind

**Styling & Design:**
- **Tailwind CSS:** Utility-first CSS framework
- Custom design tokens defined in index.css and tailwind.config.ts

**Development Tools:**
- **Vite:** Frontend build tool with HMR
- **TypeScript:** Type safety across frontend
