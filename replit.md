# CourseHub - Interactive Learning & Team Management Platform

## Overview

CourseHub has been transformed into a quiz hosting and analysis platform with profile-driven user discovery. Users create quizzes via the SurveyJS online demo, export JSON, then import to the platform. Quiz results generate tags from custom question properties, which populate user profiles with "deeply human aspects" (personality, strengths, values, interests, growth areas). The application supports role-based access control (Admin, Facilitator, Contributor, Viewer) where admins/facilitators can upload quizzes while all users can take quizzes and build their profiles. Built as a full-stack TypeScript application with React on the frontend and Express on the backend.

## Recent Changes (October 30, 2025)

**Production-Ready Profile Quizzes:**
- Created Locations Quiz (locations-quiz-v1) with comprehensive questions about:
  - World experience (continents visited, travel frequency, motivations)
  - Location privacy preferences (comfort levels, identity sensitivity)
  - Community connection interests (meetup preferences, activities)
  - Custom tags with version 1.0 metadata for behavior determination
- Created Contact Quiz (contact-quiz-v1) with questions about:
  - Preferred contact methods (email, phone, video, messaging, in-person)
  - Communication style and response time expectations
  - What energizes vs drains them in communication
  - Communication boundaries and privacy preferences
- Both quizzes include:
  - `version` metadata (1.0) for tracking tag behavior across quiz versions
  - `tagFormat` properties for special handling (privacy-level, sensitivity-level, ranked-list)
  - Profile dimension mapping to personality, strengths, values, interests, growth
  - Choice-specific customTag properties for granular profiling

**Enhanced Privacy Controls:**
- Updated Privacy Settings tab with granular dimension-specific checkboxes
- Users can now individually select which profile dimensions to share:
  - Personality (communication style, traits)
  - Strengths (what energizes them)
  - Values (core beliefs, privacy preferences)
  - Interests (travel, activities, hobbies)
  - Growth Areas (areas for improvement)
- Reorganized privacy settings into three cards:
  - Profile Visibility (public/badges/tags/quiz results)
  - Profile Dimensions (individual dimension checkboxes)
  - Discovery Settings (allow discovery toggle)
- Backend stores sharedDimensions as an array in userPrivacySettings table

**Tag-Based Profile System Implementation:**
- Implemented comprehensive tag extraction engine (`server/tagExtraction.ts`) that processes all SurveyJS question types including:
  - Checkbox/multi-select arrays
  - Matrix questions (matrixdropdown, matrixdynamic)  
  - Multipletext and nested objects
  - Choice-specific customTag properties
  - Profile dimension mapping (personality, strengths, values, interests, growth)
- Created badge consolidation system that groups related tags into displayable badges
- Built API endpoints for profile data retrieval and privacy management:
  - `GET /api/profile/:userId` - Public profile view with privacy filtering
  - `GET /api/profile/my/data` - Own profile data with full access
  - `PUT /api/profile/privacy` - Update privacy settings with dimension-specific controls
- Refactored Profile page with tab-based layout:
  - Overview: Stats and recent quiz results
  - Dimensions: Five profile dimension cards (Personality, Strengths, Values, Interests, Growth) with empty states
  - Badge Collection: Visual display of earned badges
  - Privacy Settings: Granular control over profile visibility with dimension checkboxes
- Tags extracted on quiz submission automatically populate user profiles
- Privacy-first design: Default minimal public sharing, users opt-in to expose dimensions

**How Custom Tags Work:**
Quiz creators add custom properties to SurveyJS questions:
- `tagKey`: The tag identifier (e.g., "leadership-style")
- `tagCategory`: Category for grouping (e.g., "personality", "skills")
- `profileDimension`: Which dimension to update (e.g., "personality")
- `tags`: Array of tag strings to apply
- `customTag` on choices: Tag specific to that choice selection

Example SurveyJS question with custom properties:
```json
{
  "type": "radiogroup",
  "name": "work_style",
  "title": "How do you prefer to work?",
  "tagKey": "work-preference",
  "tagCategory": "personality",
  "profileDimension": "personality",
  "tags": ["work-style", "collaboration"],
  "choices": [
    { "value": "alone", "text": "Independently", "customTag": "independent-worker" },
    { "value": "team", "text": "In a team", "customTag": "team-player" }
  ]
}
```

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

**Design System:**
- Based on Material Design principles enhanced with modern learning platform patterns (Notion, Canvas, Linear)
- Custom color palette with HSL-based theming for both light and dark modes
- Typography using Inter font family from Google Fonts
- Consistent spacing and border radius system (defined in tailwind.config.ts)
- Elevated interaction patterns using hover and active states

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
- **Profile:** Tab-based interface with Overview, Dimensions (personality/strengths/values/interests/growth), Badge Collection, and Privacy Settings
- **QuizManagement:** Admin/facilitator interface for uploading SurveyJS quiz JSON
- **AdminPanel:** Administrative interface for user management
- **Login:** Authentication page supporting both Replit OAuth and local credentials

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js for HTTP server
- **Database ORM:** Drizzle ORM with PostgreSQL dialect
- **Database Provider:** Neon serverless PostgreSQL with WebSocket support
- **Session Management:** express-session with connect-pg-simple (PostgreSQL session store)
- **Authentication:** Passport.js with OpenID Connect (Replit Auth) and local strategy fallback

**API Design:**
- RESTful API endpoints under `/api` prefix
- Authentication middleware (`isAuthenticated`, `isAdmin`, `isAdminOrFacilitator`)
- Role-based access control for protected routes
- JSON request/response format with error handling middleware
- Session-based authentication with secure cookie configuration

**Data Layer:**
- Storage abstraction layer (`server/storage.ts`) implementing IStorage interface
- CRUD operations for users, teams, courses, quizzes, and quiz results
- Relational data model with foreign key relationships
- Support for upsert operations for Replit Auth user synchronization

**Database Schema (shared/schema.ts):**
- **sessions:** Session storage for authentication (required for Replit Auth)
- **users:** User profiles with Replit Auth integration (id, email, firstName, lastName, profileImageUrl, role, etc.)
- **quizzes:** Quiz definitions with SurveyJS JSON content, upload permissions
- **quizResults:** Completed quiz submissions with scores and full answer data
- **quizProgress:** In-progress quiz state tracking
- **userTags:** Individual tags extracted from quiz answers (tagKey, tagValue, dataType, questionName)
- **userBadges:** Consolidated badges awarded based on tag patterns
- **userProfileData:** Aggregated profile dimensions (personality, strengths, values, interests, growth) with JSONB storage
- **userPrivacySettings:** User control over public profile visibility (showBadges, showTags, sharedDimensions, allowDiscovery)
- **quizzes:** Quiz content and metadata
- **quizResults:** Completed quiz submissions with scores
- **quizProgress:** In-progress quiz state tracking

**Role-Based Access:**
- Four user roles: admin, facilitator, contributor, viewer
- Default role is "viewer" for new users
- Hierarchical permissions enforced at API level
- Admin-only routes for user management and system configuration

### Authentication & Authorization

**Replit OAuth Integration:**
- OpenID Connect (OIDC) discovery with Replit identity provider
- Client credentials from environment variables (REPL_ID)
- Token refresh and session management
- Profile data synchronization (email, name, profile image)

**Local Authentication Fallback:**
- Username/password strategy for development/testing
- Session persistence in PostgreSQL
- Secure cookie configuration (httpOnly, sameSite: 'lax')
- 7-day session TTL with automatic cleanup

**User Session Flow:**
1. User authenticates via Replit OAuth or local credentials
2. Session created in PostgreSQL sessions table
3. User record upserted in users table with profile data
4. Subsequent requests authenticated via session cookie
5. User data fetched via `/api/auth/user` endpoint

### Development Workflow

**Build Process:**
- Development: `npm run dev` runs tsx server with hot reload
- Production build: Vite builds client, esbuild bundles server
- Type checking: `tsc` for TypeScript validation
- Database migrations: `npm run db:push` applies schema changes

**Environment Requirements:**
- DATABASE_URL: PostgreSQL connection string (Neon serverless)
- SESSION_SECRET: Secret for session encryption
- REPL_ID: Replit application identifier
- ISSUER_URL: OIDC provider URL (defaults to https://replit.com/oidc)
- NODE_ENV: development/production mode flag

**File Structure:**
- `/client`: Frontend React application
- `/server`: Backend Express application
- `/shared`: Shared types and schema definitions
- `/migrations`: Drizzle ORM migration files
- `/attached_assets`: Static assets (images, documents)

## External Dependencies

**Database:**
- **Neon Serverless PostgreSQL:** Primary data store with WebSocket support for serverless environments
- Connection pooling via @neondatabase/serverless
- Drizzle ORM for type-safe database queries

**Authentication Services:**
- **Replit Auth (OIDC):** Primary authentication provider using OpenID Connect
- Issuer URL: https://replit.com/oidc (configurable)
- Profile claims: sub (user ID), email, first name, last name, profile image

**UI Component Library:**
- **Radix UI:** Unstyled, accessible component primitives
- Components: Dialog, Dropdown, Select, Tabs, Toast, Tooltip, Accordion, etc.
- Full list in package.json dependencies (@radix-ui/react-*)

**Styling & Design:**
- **Tailwind CSS:** Utility-first CSS framework
- **shadcn/ui:** Pre-built component system using Radix UI + Tailwind
- Custom design tokens defined in index.css and tailwind.config.ts

**Third-Party Integrations:**
- **Miro (Planned):** Embedded collaborative mindmap visualization in MapView
- Security: URL validation to only allow HTTPS Miro board URLs
- Placeholder implementation ready for iframe embedding

**Development Tools:**
- **Vite:** Frontend build tool with HMR
- **esbuild:** Server bundling for production
- **tsx:** TypeScript execution for development server
- **Replit plugins:** Runtime error modal, cartographer, dev banner (development only)

**Font Resources:**
- **Google Fonts:** Inter font family for UI and body text
- Preconnect optimization for faster font loading

**Session Storage:**
- **connect-pg-simple:** PostgreSQL-backed session store for express-session
- Auto-creates sessions table if missing
- 7-day TTL with automatic expiration handling