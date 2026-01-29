-- Phase 3: Permissions-based RLS Policies
-- These policies use OR logic for backward compatibility:
-- - Old role-based access continues to work
-- - New permissions-based access also works
-- Both systems can coexist until full migration

-- ==================================================
-- USERS TABLE POLICIES
-- ==================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_admin_select_all" ON users;
DROP POLICY IF EXISTS "users_admin_update_all" ON users;

-- Users can read their own data
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (auth.uid()::text = id);

-- Users can update their own basic info
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- Admins/managers can view all users (backward compatible)
CREATE POLICY "users_admin_select_all" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()::text 
      AND (
        u.role = 'admin' 
        OR u.permissions ? 'manage_users'
      )
    )
  );

-- Admins/managers can update all users (backward compatible)
CREATE POLICY "users_admin_update_all" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()::text 
      AND (
        u.role = 'admin' 
        OR u.permissions ? 'manage_users'
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
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()::text 
      AND (
        u.role IN ('admin', 'facilitator', 'contributor')
        OR u.permissions ? 'manage_content'
      )
    )
  );

-- Content managers can update their own quizzes, admins can update all
CREATE POLICY "quizzes_content_manager_update" ON quizzes
  FOR UPDATE
  USING (
    created_by = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()::text 
      AND (u.role = 'admin' OR u.permissions ? 'manage_content')
    )
  );

-- Only admins can delete quizzes (strict - admin role only)
CREATE POLICY "quizzes_admin_delete" ON quizzes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()::text 
      AND u.role = 'admin'
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
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()::text 
      AND (
        u.role IN ('admin', 'facilitator')
        OR u.permissions ? 'view_analytics'
      )
    )
  );

-- Proxy quiz submission: users with proxy_quiz permission can submit for others
CREATE POLICY "quiz_results_proxy_insert" ON quiz_results
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()::text 
      AND (
        u.role = 'admin'
        OR u.permissions ? 'proxy_quiz'
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
-- 1. Old role-based access (role = 'admin', role IN ('admin', 'facilitator'), etc.)
-- 2. New permissions-based access (permissions ? 'permission_name')
--
-- Once migration is complete and all users have permissions set,
-- the role-based checks can be removed.
