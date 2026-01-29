-- ============================================================
-- Migration: Add permissions and is_archived columns to profiles
-- Date: January 29, 2026
-- Purpose: Enable granular permissions alongside existing role system
-- ============================================================

-- Step 1: Add new columns to profiles table
-- ---------------------------------------------------------
-- permissions: JSONB array of permission strings
-- is_archived: Boolean for soft-delete functionality

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN profiles.permissions IS 'JSONB array of permission strings: manage_users, manage_content, proxy_quiz, view_analytics';
COMMENT ON COLUMN profiles.is_archived IS 'Soft-delete flag for archiving users without removing data';

-- Step 2: Backfill admin users with all permissions
-- ---------------------------------------------------------
-- Find users with admin role and give them full permissions

UPDATE profiles p
SET permissions = '["manage_users", "manage_content", "proxy_quiz", "view_analytics"]'::jsonb
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE p.id = ur.user_id 
AND r.key = 'admin'
AND (p.permissions IS NULL OR p.permissions = '[]'::jsonb);

-- Step 3: Create index for permissions queries (optional but recommended)
-- ---------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_permissions ON profiles USING gin(permissions);
CREATE INDEX IF NOT EXISTS idx_profiles_is_archived ON profiles(is_archived) WHERE is_archived = true;

-- ============================================================
-- NOTES:
-- ============================================================
-- 
-- Available permissions:
--   - manage_users: Can view, edit, and archive user accounts
--   - manage_content: Can create, edit, and publish quizzes
--   - proxy_quiz: Can submit quiz results on behalf of other users
--   - view_analytics: Can view quiz analytics and reports
--
-- Backward compatibility:
--   - Existing RLS policies using is_admin(), is_admin_or_facilitator() still work
--   - Role-based access via user_roles/roles tables unchanged
--   - Code checks both permissions array AND legacy role for access decisions
--
-- Future migration path:
--   - Gradually add RLS policies that check permissions directly
--   - Example: profiles.permissions ? 'manage_content'
--   - Eventually deprecate role-based helper functions
