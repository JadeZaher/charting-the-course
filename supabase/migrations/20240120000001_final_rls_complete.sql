-- ============================================================================
-- FINAL RLS MIGRATION - Complete Reset
-- This is the ONLY migration you need - it replaces all previous RLS migrations
-- Run this in Supabase SQL Editor to completely reset and fix all RLS policies
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop ALL Existing Policies Dynamically (MUST be first - before functions)
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Drop Old Functions (if they exist with different signatures)
-- ============================================================================

DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS is_facilitator(UUID);
DROP FUNCTION IF EXISTS is_admin_or_facilitator(UUID);
DROP FUNCTION IF EXISTS are_in_same_team(UUID, UUID);
DROP FUNCTION IF EXISTS is_assigned_to_quiz(UUID, UUID);
DROP FUNCTION IF EXISTS is_quiz_creator(UUID, UUID);
DROP FUNCTION IF EXISTS is_team_member(UUID, UUID);

-- ============================================================================
-- STEP 3: Create/Update Helper Functions (SECURITY DEFINER to avoid recursion)
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid AND r.key = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_facilitator(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid AND r.key IN ('facilitator', 'admin')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_or_facilitator(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid AND r.key IN ('admin', 'facilitator')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to check if two users are in same team (avoids recursion)
CREATE OR REPLACE FUNCTION are_in_same_team(p_user1_id UUID, p_user2_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members tm1
    JOIN team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = p_user1_id AND tm2.user_id = p_user2_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to check if user is assigned to quiz (avoids recursion)
CREATE OR REPLACE FUNCTION is_assigned_to_quiz(p_user_id UUID, p_quiz_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM quiz_assignments
    WHERE quiz_id = p_quiz_id AND user_id = p_user_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to check if user created quiz (avoids recursion)
CREATE OR REPLACE FUNCTION is_quiz_creator(p_user_id UUID, p_quiz_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM quizzes
    WHERE id = p_quiz_id AND created_by = p_user_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to check if user is team member (avoids recursion)
CREATE OR REPLACE FUNCTION is_team_member(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id AND user_id = p_user_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- STEP 4: Recreate All Policies with Correct Permissions
-- ============================================================================

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (profile_visibility = 'public');

CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "profiles_insert_admin"
  ON profiles FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- USER_ROLES TABLE
-- ============================================================================

CREATE POLICY "user_roles_select_own"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_roles_select_admin"
  ON user_roles FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "user_roles_insert_admin"
  ON user_roles FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "user_roles_update_admin"
  ON user_roles FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "user_roles_delete_admin"
  ON user_roles FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- ROLES TABLE
-- ============================================================================

CREATE POLICY "roles_select_all"
  ON roles FOR SELECT
  USING (true);

CREATE POLICY "roles_modify_admin"
  ON roles FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ============================================================================
-- TEAMS TABLE
-- ============================================================================

CREATE POLICY "teams_select_member"
  ON teams FOR SELECT
  USING (
    created_by = auth.uid()
    OR is_team_member(auth.uid(), teams.id)
  );

CREATE POLICY "teams_select_admin"
  ON teams FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "teams_insert_authenticated"
  ON teams FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "teams_update_creator"
  ON teams FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "teams_update_admin"
  ON teams FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "teams_delete_creator"
  ON teams FOR DELETE
  USING (created_by = auth.uid());

CREATE POLICY "teams_delete_admin"
  ON teams FOR DELETE
  USING (is_admin(auth.uid()));

CREATE POLICY "teams_insert_admin"
  ON teams FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- ============================================================================
-- TEAM_MEMBERS TABLE (No recursion - uses teams table, not team_members)
-- ============================================================================

CREATE POLICY "team_members_select_own"
  ON team_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "team_members_select_team_creator"
  ON team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE id = team_members.team_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "team_members_select_admin"
  ON team_members FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "team_members_insert_creator"
  ON team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE id = team_members.team_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "team_members_insert_admin"
  ON team_members FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "team_members_delete_creator"
  ON team_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE id = team_members.team_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "team_members_delete_admin"
  ON team_members FOR DELETE
  USING (is_admin(auth.uid()));

CREATE POLICY "team_members_update_admin"
  ON team_members FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ============================================================================
-- QUIZZES TABLE (Fixed INSERT policy and recursion)
-- ============================================================================

CREATE POLICY "quizzes_select_admin_facilitator"
  ON quizzes FOR SELECT
  USING (is_admin_or_facilitator(auth.uid()) OR is_admin(auth.uid()) OR is_facilitator(auth.uid()));

CREATE POLICY "quizzes_select_creator"
  ON quizzes FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "quizzes_select_public"
  ON quizzes FOR SELECT
  USING (visibility = 'public' AND is_published = true);

-- For assigned quizzes: Use SECURITY DEFINER function to bypass RLS
CREATE POLICY "quizzes_select_assigned"
  ON quizzes FOR SELECT
  USING (
    visibility = 'assigned' 
    AND is_published = true 
    AND is_assigned_to_quiz(auth.uid(), quizzes.id)
  );

-- For team quizzes: Use helper function
CREATE POLICY "quizzes_select_team"
  ON quizzes FOR SELECT
  USING (
    visibility = 'team' 
    AND is_published = true 
    AND are_in_same_team(auth.uid(), created_by)
  );

-- Fixed INSERT policy with multiple role checks
CREATE POLICY "quizzes_insert_admin_facilitator"
  ON quizzes FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      is_admin_or_facilitator(auth.uid())
      OR is_admin(auth.uid())
      OR is_facilitator(auth.uid())
    )
  );

CREATE POLICY "quizzes_update_creator"
  ON quizzes FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "quizzes_update_admin_facilitator"
  ON quizzes FOR UPDATE
  USING (is_admin_or_facilitator(auth.uid()))
  WITH CHECK (is_admin_or_facilitator(auth.uid()));

CREATE POLICY "quizzes_delete_admin"
  ON quizzes FOR DELETE
  USING (is_admin(auth.uid()));

CREATE POLICY "quizzes_insert_admin"
  ON quizzes FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- ============================================================================
-- QUIZ_ASSIGNMENTS TABLE
-- ============================================================================

CREATE POLICY "quiz_assignments_select_user"
  ON quiz_assignments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "quiz_assignments_select_admin"
  ON quiz_assignments FOR SELECT
  USING (is_admin_or_facilitator(auth.uid()));

CREATE POLICY "quiz_assignments_insert_admin"
  ON quiz_assignments FOR INSERT
  WITH CHECK (is_admin_or_facilitator(auth.uid()));

CREATE POLICY "quiz_assignments_update_admin"
  ON quiz_assignments FOR UPDATE
  USING (is_admin_or_facilitator(auth.uid()))
  WITH CHECK (is_admin_or_facilitator(auth.uid()));

CREATE POLICY "quiz_assignments_delete_admin"
  ON quiz_assignments FOR DELETE
  USING (is_admin_or_facilitator(auth.uid()));

-- ============================================================================
-- QUIZ_RESULTS TABLE
-- ============================================================================

CREATE POLICY "quiz_results_select_own"
  ON quiz_results FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "quiz_results_select_quiz_creator"
  ON quiz_results FOR SELECT
  USING (is_quiz_creator(auth.uid(), quiz_results.quiz_id));

CREATE POLICY "quiz_results_select_admin"
  ON quiz_results FOR SELECT
  USING (is_admin_or_facilitator(auth.uid()));

CREATE POLICY "quiz_results_insert_own"
  ON quiz_results FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "quiz_results_update_admin"
  ON quiz_results FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "quiz_results_delete_admin"
  ON quiz_results FOR DELETE
  USING (is_admin(auth.uid()));

CREATE POLICY "quiz_results_insert_admin"
  ON quiz_results FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- ============================================================================
-- QUIZ_PROGRESS TABLE
-- ============================================================================

CREATE POLICY "quiz_progress_select_own"
  ON quiz_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "quiz_progress_select_quiz_creator"
  ON quiz_progress FOR SELECT
  USING (is_quiz_creator(auth.uid(), quiz_progress.quiz_id));

CREATE POLICY "quiz_progress_select_admin"
  ON quiz_progress FOR SELECT
  USING (is_admin_or_facilitator(auth.uid()));

CREATE POLICY "quiz_progress_insert_own"
  ON quiz_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "quiz_progress_update_own"
  ON quiz_progress FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "quiz_progress_delete_own"
  ON quiz_progress FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "quiz_progress_insert_admin"
  ON quiz_progress FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "quiz_progress_update_admin"
  ON quiz_progress FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "quiz_progress_delete_admin"
  ON quiz_progress FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- USER_TAGS TABLE
-- ============================================================================

CREATE POLICY "user_tags_select_own"
  ON user_tags FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_tags_select_public"
  ON user_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = user_tags.user_id AND profile_visibility = 'public'
    )
    OR EXISTS (
      SELECT 1 FROM user_privacy_settings
      WHERE user_id = user_tags.user_id AND show_tags = true
    )
  );

CREATE POLICY "user_tags_select_admin"
  ON user_tags FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "user_tags_insert_own"
  ON user_tags FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_tags_delete_own"
  ON user_tags FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "user_tags_insert_admin"
  ON user_tags FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "user_tags_update_admin"
  ON user_tags FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "user_tags_delete_admin"
  ON user_tags FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- USER_BADGES TABLE
-- ============================================================================

CREATE POLICY "user_badges_select_own"
  ON user_badges FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_badges_select_public"
  ON user_badges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = user_badges.user_id AND profile_visibility = 'public'
    )
    OR EXISTS (
      SELECT 1 FROM user_privacy_settings
      WHERE user_id = user_badges.user_id AND show_badges = true
    )
  );

CREATE POLICY "user_badges_select_admin"
  ON user_badges FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "user_badges_insert_own"
  ON user_badges FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_badges_update_own"
  ON user_badges FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_badges_delete_own"
  ON user_badges FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "user_badges_insert_admin"
  ON user_badges FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "user_badges_update_admin"
  ON user_badges FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "user_badges_delete_admin"
  ON user_badges FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- USER_PRIVACY_SETTINGS TABLE
-- ============================================================================

CREATE POLICY "user_privacy_settings_select_own"
  ON user_privacy_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_privacy_settings_select_public"
  ON user_privacy_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = user_privacy_settings.user_id AND profile_visibility = 'public'
    )
  );

CREATE POLICY "user_privacy_settings_select_admin"
  ON user_privacy_settings FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "user_privacy_settings_insert_own"
  ON user_privacy_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_privacy_settings_update_own"
  ON user_privacy_settings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_privacy_settings_insert_admin"
  ON user_privacy_settings FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "user_privacy_settings_update_admin"
  ON user_privacy_settings FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "user_privacy_settings_delete_admin"
  ON user_privacy_settings FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- USER_PROFILE_DATA TABLE
-- ============================================================================

CREATE POLICY "user_profile_data_select_own"
  ON user_profile_data FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_profile_data_select_public"
  ON user_profile_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = user_profile_data.user_id AND profile_visibility = 'public'
    )
  );

CREATE POLICY "user_profile_data_select_admin"
  ON user_profile_data FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "user_profile_data_insert_own"
  ON user_profile_data FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_profile_data_update_own"
  ON user_profile_data FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_profile_data_insert_admin"
  ON user_profile_data FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "user_profile_data_update_admin"
  ON user_profile_data FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "user_profile_data_delete_admin"
  ON user_profile_data FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- BADGE_DEFINITIONS TABLE
-- ============================================================================

CREATE POLICY "badge_definitions_select_active"
  ON badge_definitions FOR SELECT
  USING (is_active = true);

CREATE POLICY "badge_definitions_select_admin"
  ON badge_definitions FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "badge_definitions_insert_admin_facilitator"
  ON badge_definitions FOR INSERT
  WITH CHECK (is_admin_or_facilitator(auth.uid()));

CREATE POLICY "badge_definitions_update_admin_facilitator"
  ON badge_definitions FOR UPDATE
  USING (is_admin_or_facilitator(auth.uid()))
  WITH CHECK (is_admin_or_facilitator(auth.uid()));

CREATE POLICY "badge_definitions_delete_admin"
  ON badge_definitions FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- USER_ACHIEVEMENTS TABLE
-- ============================================================================

CREATE POLICY "user_achievements_select_own"
  ON user_achievements FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_achievements_select_public"
  ON user_achievements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = user_achievements.user_id AND profile_visibility = 'public'
    )
  );

CREATE POLICY "user_achievements_select_admin"
  ON user_achievements FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "user_achievements_insert_own"
  ON user_achievements FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_achievements_insert_admin"
  ON user_achievements FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "user_achievements_update_admin"
  ON user_achievements FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "user_achievements_delete_admin"
  ON user_achievements FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- USER_XP_LEVELS TABLE
-- ============================================================================

CREATE POLICY "user_xp_levels_select_own"
  ON user_xp_levels FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_xp_levels_select_public"
  ON user_xp_levels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = user_xp_levels.user_id AND profile_visibility = 'public'
    )
  );

CREATE POLICY "user_xp_levels_select_admin"
  ON user_xp_levels FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "user_xp_levels_insert_own"
  ON user_xp_levels FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_xp_levels_update_own"
  ON user_xp_levels FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_xp_levels_insert_admin"
  ON user_xp_levels FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "user_xp_levels_update_admin"
  ON user_xp_levels FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "user_xp_levels_delete_admin"
  ON user_xp_levels FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- LEVEL_DEFINITIONS TABLE
-- ============================================================================

CREATE POLICY "level_definitions_select_all"
  ON level_definitions FOR SELECT
  USING (true);

CREATE POLICY "level_definitions_modify_admin"
  ON level_definitions FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ============================================================================
-- PROFILE_SHARE_LINKS TABLE
-- ============================================================================

CREATE POLICY "profile_share_links_select_own"
  ON profile_share_links FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "profile_share_links_select_admin"
  ON profile_share_links FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "profile_share_links_insert_own"
  ON profile_share_links FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "profile_share_links_update_own"
  ON profile_share_links FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "profile_share_links_delete_own"
  ON profile_share_links FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "profile_share_links_insert_admin"
  ON profile_share_links FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "profile_share_links_update_admin"
  ON profile_share_links FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "profile_share_links_delete_admin"
  ON profile_share_links FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- TAG_DEFINITIONS TABLE
-- ============================================================================

CREATE POLICY "tag_definitions_select_active"
  ON tag_definitions FOR SELECT
  USING (is_active = true);

CREATE POLICY "tag_definitions_modify_admin_facilitator"
  ON tag_definitions FOR ALL
  USING (is_admin_or_facilitator(auth.uid()))
  WITH CHECK (is_admin_or_facilitator(auth.uid()));

CREATE POLICY "tag_definitions_select_admin"
  ON tag_definitions FOR SELECT
  USING (is_admin(auth.uid()));

-- ============================================================================
-- DIMENSION_DEFINITIONS TABLE
-- ============================================================================

CREATE POLICY "dimension_definitions_select_active"
  ON dimension_definitions FOR SELECT
  USING (is_active = true);

CREATE POLICY "dimension_definitions_modify_admin_facilitator"
  ON dimension_definitions FOR ALL
  USING (is_admin_or_facilitator(auth.uid()))
  WITH CHECK (is_admin_or_facilitator(auth.uid()));

CREATE POLICY "dimension_definitions_select_admin"
  ON dimension_definitions FOR SELECT
  USING (is_admin(auth.uid()));

-- ============================================================================
-- AGREEMENT_DEFINITIONS TABLE
-- ============================================================================

CREATE POLICY "agreement_definitions_select_active"
  ON agreement_definitions FOR SELECT
  USING (is_active = true);

CREATE POLICY "agreement_definitions_modify_admin_facilitator"
  ON agreement_definitions FOR ALL
  USING (is_admin_or_facilitator(auth.uid()))
  WITH CHECK (is_admin_or_facilitator(auth.uid()));

CREATE POLICY "agreement_definitions_select_admin"
  ON agreement_definitions FOR SELECT
  USING (is_admin(auth.uid()));

-- ============================================================================
-- USER_DIMENSIONS TABLE
-- ============================================================================

CREATE POLICY "user_dimensions_select_own"
  ON user_dimensions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_dimensions_select_public"
  ON user_dimensions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = user_dimensions.user_id AND profile_visibility = 'public'
    )
  );

CREATE POLICY "user_dimensions_select_admin"
  ON user_dimensions FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "user_dimensions_insert_admin"
  ON user_dimensions FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "user_dimensions_update_admin"
  ON user_dimensions FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "user_dimensions_delete_admin"
  ON user_dimensions FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- USER_AGREEMENTS TABLE
-- ============================================================================

CREATE POLICY "user_agreements_select_own"
  ON user_agreements FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_agreements_select_public"
  ON user_agreements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = user_agreements.user_id AND profile_visibility = 'public'
    )
  );

CREATE POLICY "user_agreements_select_admin"
  ON user_agreements FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "user_agreements_insert_admin"
  ON user_agreements FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "user_agreements_update_admin"
  ON user_agreements FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "user_agreements_delete_admin"
  ON user_agreements FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
  'Final RLS migration complete! All policies recreated with fixes.' as status,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public';
