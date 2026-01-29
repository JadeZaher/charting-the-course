-- Phase 3: Permissions-based RLS Policies
-- These policies use OR logic for backward compatibility:
-- - Old role-based access continues to work (via user_roles/roles tables)
-- - New permissions-based access also works (via profiles.permissions JSONB)
-- Both systems can coexist until full migration

-- ==================================================
-- PROFILES TABLE POLICIES
-- ==================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_update_all" ON profiles;

-- Users can read their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  USING (auth.uid()::text = id);

-- Users can update their own profile (except permissions and is_archived)
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- Admins/managers can view all profiles (backward compatible with roles)
CREATE POLICY "profiles_admin_select_all" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid()::text 
      AND (
        -- New permissions check
        p.permissions ? 'manage_users'
        -- Backward compatible: check role via user_roles
        OR EXISTS (
          SELECT 1 FROM user_roles ur 
          JOIN roles r ON ur.role_id = r.id 
          WHERE ur.user_id = auth.uid()::text 
          AND r.key = 'admin'
        )
      )
    )
  );

-- Admins/managers can update all profiles (backward compatible)
CREATE POLICY "profiles_admin_update_all" ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid()::text 
      AND (
        p.permissions ? 'manage_users'
        OR EXISTS (
          SELECT 1 FROM user_roles ur 
          JOIN roles r ON ur.role_id = r.id 
          WHERE ur.user_id = auth.uid()::text 
          AND r.key = 'admin'
        )
      )
    )
  );

-- ==================================================
-- QUIZZES TABLE POLICIES
-- ==================================================

DROP POLICY IF EXISTS "quizzes_public_read" ON quizzes;
DROP POLICY IF EXISTS "quizzes_content_manager_insert" ON quizzes;
DROP POLICY IF EXISTS "quizzes_content_manager_update" ON quizzes;
DROP POLICY IF EXISTS "quizzes_admin_delete" ON quizzes;

-- Anyone can read published quizzes
CREATE POLICY "quizzes_public_read" ON quizzes
  FOR SELECT
  USING (status = 'published' OR created_by = auth.uid()::text);

-- Content managers can create quizzes (backward compatible)
CREATE POLICY "quizzes_content_manager_insert" ON quizzes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid()::text 
      AND (
        p.permissions ? 'manage_content'
        OR EXISTS (
          SELECT 1 FROM user_roles ur 
          JOIN roles r ON ur.role_id = r.id 
          WHERE ur.user_id = auth.uid()::text 
          AND r.key IN ('admin', 'facilitator', 'contributor')
        )
      )
    )
  );

-- Content managers can update their own quizzes, admins can update all
CREATE POLICY "quizzes_content_manager_update" ON quizzes
  FOR UPDATE
  USING (
    created_by = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid()::text 
      AND (
        p.permissions ? 'manage_content'
        OR EXISTS (
          SELECT 1 FROM user_roles ur 
          JOIN roles r ON ur.role_id = r.id 
          WHERE ur.user_id = auth.uid()::text 
          AND r.key = 'admin'
        )
      )
    )
  );

-- Only admins can delete quizzes
CREATE POLICY "quizzes_admin_delete" ON quizzes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid()::text 
      AND r.key = 'admin'
    )
  );

-- ==================================================
-- QUIZ_RESULTS TABLE POLICIES
-- ==================================================

DROP POLICY IF EXISTS "quiz_results_select_own" ON quiz_results;
DROP POLICY IF EXISTS "quiz_results_insert_own" ON quiz_results;
DROP POLICY IF EXISTS "quiz_results_admin_select_all" ON quiz_results;
DROP POLICY IF EXISTS "quiz_results_proxy_insert" ON quiz_results;

-- Users can read their own quiz results
CREATE POLICY "quiz_results_select_own" ON quiz_results
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Users can submit their own quiz results
CREATE POLICY "quiz_results_insert_own" ON quiz_results
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- Admins/analytics viewers can see all results (backward compatible)
CREATE POLICY "quiz_results_admin_select_all" ON quiz_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid()::text 
      AND (
        p.permissions ? 'view_analytics'
        OR EXISTS (
          SELECT 1 FROM user_roles ur 
          JOIN roles r ON ur.role_id = r.id 
          WHERE ur.user_id = auth.uid()::text 
          AND r.key IN ('admin', 'facilitator')
        )
      )
    )
  );

-- Proxy quiz submission: users with proxy_quiz permission can submit for others
CREATE POLICY "quiz_results_proxy_insert" ON quiz_results
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid()::text 
      AND (
        p.permissions ? 'proxy_quiz'
        OR EXISTS (
          SELECT 1 FROM user_roles ur 
          JOIN roles r ON ur.role_id = r.id 
          WHERE ur.user_id = auth.uid()::text 
          AND r.key = 'admin'
        )
      )
    )
  );

-- ==================================================
-- PROFILE_TILES TABLE POLICIES (New table from Phase 1)
-- ==================================================

DROP POLICY IF EXISTS "profile_tiles_select_own" ON profile_tiles;
DROP POLICY IF EXISTS "profile_tiles_insert_own" ON profile_tiles;
DROP POLICY IF EXISTS "profile_tiles_update_own" ON profile_tiles;
DROP POLICY IF EXISTS "profile_tiles_delete_own" ON profile_tiles;

-- Users can read their own tiles
CREATE POLICY "profile_tiles_select_own" ON profile_tiles
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Users can insert their own tiles
CREATE POLICY "profile_tiles_insert_own" ON profile_tiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- Users can update their own tiles
CREATE POLICY "profile_tiles_update_own" ON profile_tiles
  FOR UPDATE
  USING (user_id = auth.uid()::text);

-- Users can delete their own tiles
CREATE POLICY "profile_tiles_delete_own" ON profile_tiles
  FOR DELETE
  USING (user_id = auth.uid()::text);

-- ==================================================
-- NOTES
-- ==================================================
-- 
-- The `?` operator checks if a JSONB array contains a string value.
-- Example: permissions ? 'manage_users' returns true if 'manage_users' is in the array.
--
-- These policies maintain backward compatibility by checking:
-- 1. New permissions-based access (profiles.permissions ? 'permission_name')
-- 2. Old role-based access (via user_roles/roles join lookup)
--
-- The RLS now correctly uses the `profiles` table instead of `users` table,
-- matching the actual Supabase schema.
--
-- Once migration is complete and all users have permissions set,
-- the role-based checks can be removed.
