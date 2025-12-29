# Supabase Migration - Complete Implementation

This directory contains the complete Supabase migration implementation.

## 📁 Directory Structure

```
supabase/
├── migrations/                    # Database migration files
│   ├── 20240120000001_final_rls_complete.sql
├── functions/                     # Edge Functions (Deno)
│   ├── _shared/                  # Shared utilities
│   │   ├── auth.ts              # Authentication helpers
│   │   ├── response.ts          # Response utilities
│   │   ├── types.ts             # TypeScript types
│   │   └── tagExtraction.ts     # Tag & badge logic
│   ├── profiles/
│   │   ├── update-profile/
│   │   └── get-public-profile/
│   ├── profile/                  # enhanced profile functions
│   │   ├── get-public-profile/
│   │   ├── get-private-profile/
│   │   ├── update-enhanced-profile/
│   │   └── create-share-link/
│   ├── badges/                   # Badge management functions
│   │   ├── list-badges/
│   │   ├── create-badge/
│   │   ├── update-badge/
│   │   ├── delete-badge/
│   │   └── get-user-badges/
│   ├── achievements/             # Achievement functions
│   │   ├── calculate-achievements/
│   │   ├── get-user-achievements/
│   │   └── get-levels/
│   ├── admin/
│   │   └── manage-users/
│   └── quiz/                     # All quiz-related functions
│       ├── create-quiz/
│       ├── get-quiz/
│       ├── get-visible-quizzes/
│       ├── update-quiz/
│       ├── delete-quiz/
│       ├── duplicate-quiz/
│       ├── publish-quiz/
│       ├── import-surveyjs/
│       ├── update-visibility/
│       ├── assign-users/
│       ├── bulk-assign/
│       ├── get-assigned-quizzes/
│       ├── get-quiz-assignments/
│       ├── remove-assignment/
│       ├── submit-answers/
│       ├── submit-with-tags/
│       ├── get-user-results/
│       ├── get-quiz-result/
│       ├── get-progress/
│       ├── save-progress/
│       └── delete-progress/
```

## 🎯 Phase Overview

| Phase | Focus | Status |
|-------|-------|--------|
| Phase 1 | Auth, Roles & Profiles | ✅ Complete |
| Phase 2 | Quiz System & Visibility | ✅ Complete |

## 🚀 Quick Start

### 1. Set Up Supabase Project

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref
```

### 2. Run Migrations

```bash
# Push all migrations to Supabase
supabase db push
```

### 3. Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy
```

### 4. Set Environment Variables

Add to your `.env` file:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
URL=your-supabase-project-url
ANON_KEY=
SERVICE_ROLE_KEY=
DATABASE_URL=
```

## 🔧 Development

### Local Development

```bash
# Start local Supabase (requires Docker)
supabase start

# Run migrations locally
supabase db reset

# Test functions locally
supabase functions serve
```

### Testing Edge Functions

```bash
# Test a function
curl -X POST http://localhost:54321/functions/v1/profiles/update-profile \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"first_name": "John"}'
```

## 📋 Edge Functions Overview

### Profile Functions
- `profile/get-public-profile` - View public profile by username/slug/token
- `profile/get-private-profile` - Get authenticated user's full profile
- `profile/update-enhanced-profile` - Update profile with enhanced fields
- `profile/create-share-link` - Create shareable profile link

### Badge Functions
- `badges/list-badges` - List badge definitions
- `badges/create-badge` - Create badge (admin/facilitator)
- `badges/update-badge` - Update badge (admin/facilitator)
- `badges/delete-badge` - Delete badge (admin only)
- `badges/get-user-badges` - Get user's earned badges

### Achievement Functions
- `achievements/calculate-achievements` - Calculate after quiz submission
- `achievements/get-user-achievements` - Get user achievements
- `achievements/get-levels` - Get level definitions

### Admin Functions
- `admin/manage-users` - User management (CRUD, roles)

### Quiz Management Functions
- `quiz/create-quiz` - Create quiz (admin/facilitator)
- `quiz/get-quiz` - Get single quiz
- `quiz/get-visible-quizzes` - List visible quizzes
- `quiz/update-quiz` - Update quiz
- `quiz/delete-quiz` - Delete quiz (admin only)
- `quiz/duplicate-quiz` - Duplicate quiz
- `quiz/publish-quiz` - Publish/unpublish quiz
- `quiz/import-surveyjs` - Import SurveyJS JSON
- `quiz/update-visibility` - Change visibility

### Assignment Functions
- `quiz/assign-users` - Assign to user/team
- `quiz/bulk-assign` - Bulk assignment
- `quiz/get-assigned-quizzes` - User's assignments
- `quiz/get-quiz-assignments` - Quiz's assignments
- `quiz/remove-assignment` - Remove assignment

### Submission Functions
- `quiz/submit-answers` - Basic submission
- `quiz/submit-with-tags` - Submit with tag/badge generation

### Results & Progress Functions
- `quiz/get-user-results` - User's quiz results
- `quiz/get-quiz-result` - Single quiz result
- `quiz/get-progress` - Quiz progress
- `quiz/save-progress` - Save progress
- `quiz/delete-progress` - Delete progress

### Enhanced Profile System
- **Cover images & headlines** - Rich profile presentation
- **Social links** - Connect Twitter, LinkedIn, website, etc.
- **Share slugs** - Public URLs like `/u/johndoe`
- **Profile tags** - User-defined tags for discovery

### Achievement & XP System
- **10 Level progression** - From Newcomer to Visionary
- **XP rewards** - Earn XP for quizzes and badges
- **Achievement tracking** - Track milestones and accomplishments
- **Streak tracking** - Daily quiz completion streaks

### Badge Management
- **Admin-managed badges** - Create custom badge definitions
- **Automatic earning** - Badges awarded based on conditions
- **Categories** - Personality, Achievement, Streak, Special
- **XP rewards** - Configurable XP per badge

### Public Profile Sharing
- **Visibility controls** - Public, Private, Link-only
- **Share links** - Generate tokens with custom settings
- **View tracking** - Track profile visits

## 🔐 Security

- All tables have RLS (Row-Level Security) enabled
- Edge functions validate authentication and authorization
- Service role key only used for admin operations
- User data protected by RLS policies
- Profile visibility enforced at database level

## 🐛 Troubleshooting

### Function Not Found

```bash
# Check if function is deployed
supabase functions list

# Redeploy function
supabase functions deploy <function-name>
```

### RLS Policy Issues

```bash
# Check RLS policies
supabase db diff

# Verify policies are enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

### Authentication Errors

- Verify `Authorization` header includes valid JWT token
- Check token expiration
- Ensure user exists in `auth.users`

## 📝 Notes

- All migrations are idempotent (safe to run multiple times)
- Edge functions use Deno runtime
- Shared utilities in `_shared/` are imported by all functions
- Types align with existing `shared/schema.ts` structure
- Default badges and levels are created by Phase 4 migration
