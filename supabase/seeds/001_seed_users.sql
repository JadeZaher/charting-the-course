-- ============================================================================
-- SEED FILE: Create Test Users (Admin, Facilitator, Viewer)
-- ============================================================================
-- 
-- NOTE: This seed creates test users for development/testing purposes.
-- Run with: npm run db:seed (or supabase db seed)
--
-- Default password for all test users: TestPassword123!
-- 
-- ============================================================================

-- ============================================================================
-- 1. CREATE TEST USERS IN AUTH.USERS (with auto-generated IDs)
-- ============================================================================

DO $$
DECLARE
  admin_id UUID;
  facilitator_id UUID;
  viewer_id UUID;
  admin_role_id INTEGER;
  facilitator_role_id INTEGER;
  viewer_role_id INTEGER;
BEGIN
  -- Generate UUIDs
  admin_id := gen_random_uuid();
  facilitator_id := gen_random_uuid();
  viewer_id := gen_random_uuid();

  -- Get role IDs
  SELECT id INTO admin_role_id FROM roles WHERE key = 'admin';
  SELECT id INTO facilitator_role_id FROM roles WHERE key = 'facilitator';
  SELECT id INTO viewer_role_id FROM roles WHERE key = 'viewer';

  -- ========================================================================
  -- CREATE ADMIN USER
  -- ========================================================================
  
  -- Check if admin user already exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@chartingthecourse.test') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@chartingthecourse.test',
      crypt('TestPassword123!', gen_salt('bf')),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"first_name": "Admin", "last_name": "User"}',
      'authenticated',
      'authenticated',
      NOW(),
      NOW(),
      '',
      ''
    );

    -- Create identity
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      admin_id,
      admin_id,
      'admin@chartingthecourse.test',
      jsonb_build_object('sub', admin_id::text, 'email', 'admin@chartingthecourse.test'),
      'email',
      NOW(),
      NOW(),
      NOW()
    );

    -- Create/Update profile (may already exist from trigger)
    INSERT INTO profiles (id, first_name, last_name, username, bio, headline, profile_visibility, share_slug, profile_tags, social_links)
    VALUES (
      admin_id,
      'Admin',
      'User',
      'admin',
      'Platform administrator with full system access.',
      'Platform Administrator • System Manager',
      'public',
      'admin',
      ARRAY['admin', 'management', 'leadership'],
      '{"website": "https://chartingthecourse.com"}'
    )
    ON CONFLICT (id) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      username = EXCLUDED.username,
      bio = EXCLUDED.bio,
      headline = EXCLUDED.headline,
      profile_visibility = EXCLUDED.profile_visibility,
      share_slug = EXCLUDED.share_slug,
      profile_tags = EXCLUDED.profile_tags,
      social_links = EXCLUDED.social_links,
      updated_at = NOW();

    -- Assign admin role (may already exist from trigger with viewer role)
    INSERT INTO user_roles (user_id, role_id, assigned_at)
    VALUES (admin_id, admin_role_id, NOW())
    ON CONFLICT (user_id) DO UPDATE SET role_id = EXCLUDED.role_id;

    -- Create privacy settings
    INSERT INTO user_privacy_settings (user_id, is_profile_public, show_badges, show_quiz_results, show_tags, allow_discovery)
    VALUES (admin_id, true, true, true, true, true)
    ON CONFLICT (user_id) DO UPDATE SET
      is_profile_public = EXCLUDED.is_profile_public,
      show_badges = EXCLUDED.show_badges,
      show_quiz_results = EXCLUDED.show_quiz_results,
      show_tags = EXCLUDED.show_tags,
      allow_discovery = EXCLUDED.allow_discovery;

    -- Initialize XP
    INSERT INTO user_xp_levels (user_id, total_xp, current_level, xp_to_next_level, quiz_streak, longest_streak)
    VALUES (admin_id, 500, 3, 100, 5, 10)
    ON CONFLICT (user_id) DO UPDATE SET
      total_xp = EXCLUDED.total_xp,
      current_level = EXCLUDED.current_level,
      xp_to_next_level = EXCLUDED.xp_to_next_level,
      quiz_streak = EXCLUDED.quiz_streak,
      longest_streak = EXCLUDED.longest_streak;

    -- Add badges
    INSERT INTO user_badges (user_id, badge_key, badge_name, badge_description, badge_category, badge_icon, strength) VALUES 
      (admin_id, 'early-adopter', 'Early Adopter', 'Joined the platform early', 'special', '🌟', 1),
      (admin_id, 'quiz-master-10', 'Quiz Master', 'Completed 10 quizzes', 'achievement', '🏆', 1),
      (admin_id, 'collaborative-leader', 'Collaborative Leader', 'Demonstrates collaborative leadership', 'personality', '🤝', 2)
    ON CONFLICT (user_id, badge_key) DO NOTHING;

    -- Add achievements
    INSERT INTO user_achievements (user_id, achievement_type, achievement_key, achievement_name, achievement_description, achievement_icon, xp_awarded) VALUES 
      (admin_id, 'first_quiz', 'first-quiz-completed', 'First Steps', 'Completed your first quiz', '🎯', 50),
      (admin_id, 'level_up', 'level-up-2', 'Level 2!', 'Reached level 2', '⬆️', 0),
      (admin_id, 'level_up', 'level-up-3', 'Level 3!', 'Reached level 3', '⬆️', 0),
      (admin_id, 'badge_earned', 'badge-early-adopter', 'Earned: Early Adopter', 'Joined the platform early', '🌟', 100)
    ON CONFLICT (user_id, achievement_key) DO NOTHING;

    RAISE NOTICE 'Created admin user: admin@chartingthecourse.test (ID: %)', admin_id;
  ELSE
    RAISE NOTICE 'Admin user already exists, skipping...';
  END IF;

  -- ========================================================================
  -- CREATE FACILITATOR USER
  -- ========================================================================
  
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'facilitator@chartingthecourse.test') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      facilitator_id,
      '00000000-0000-0000-0000-000000000000',
      'facilitator@chartingthecourse.test',
      crypt('TestPassword123!', gen_salt('bf')),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"first_name": "Facilitator", "last_name": "User"}',
      'authenticated',
      'authenticated',
      NOW(),
      NOW(),
      '',
      ''
    );

    -- Create identity
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      facilitator_id,
      facilitator_id,
      'facilitator@chartingthecourse.test',
      jsonb_build_object('sub', facilitator_id::text, 'email', 'facilitator@chartingthecourse.test'),
      'email',
      NOW(),
      NOW(),
      NOW()
    );

    -- Create/Update profile (may already exist from trigger)
    INSERT INTO profiles (id, first_name, last_name, username, bio, headline, profile_visibility, share_slug, profile_tags, social_links)
    VALUES (
      facilitator_id,
      'Facilitator',
      'User',
      'facilitator',
      'Quiz facilitator creating engaging learning experiences.',
      'Learning Facilitator • Quiz Designer',
      'public',
      'facilitator',
      ARRAY['education', 'facilitation', 'design'],
      '{"linkedin": "https://linkedin.com/in/facilitator"}'
    )
    ON CONFLICT (id) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      username = EXCLUDED.username,
      bio = EXCLUDED.bio,
      headline = EXCLUDED.headline,
      profile_visibility = EXCLUDED.profile_visibility,
      share_slug = EXCLUDED.share_slug,
      profile_tags = EXCLUDED.profile_tags,
      social_links = EXCLUDED.social_links,
      updated_at = NOW();

    -- Assign facilitator role (may already exist from trigger with viewer role)
    INSERT INTO user_roles (user_id, role_id, assigned_at)
    VALUES (facilitator_id, facilitator_role_id, NOW())
    ON CONFLICT (user_id) DO UPDATE SET role_id = EXCLUDED.role_id;

    -- Create privacy settings
    INSERT INTO user_privacy_settings (user_id, is_profile_public, show_badges, show_quiz_results, show_tags, allow_discovery)
    VALUES (facilitator_id, true, true, false, true, true)
    ON CONFLICT (user_id) DO UPDATE SET
      is_profile_public = EXCLUDED.is_profile_public,
      show_badges = EXCLUDED.show_badges,
      show_quiz_results = EXCLUDED.show_quiz_results,
      show_tags = EXCLUDED.show_tags,
      allow_discovery = EXCLUDED.allow_discovery;

    -- Initialize XP
    INSERT INTO user_xp_levels (user_id, total_xp, current_level, xp_to_next_level, quiz_streak, longest_streak)
    VALUES (facilitator_id, 250, 2, 50, 3, 5)
    ON CONFLICT (user_id) DO UPDATE SET
      total_xp = EXCLUDED.total_xp,
      current_level = EXCLUDED.current_level,
      xp_to_next_level = EXCLUDED.xp_to_next_level,
      quiz_streak = EXCLUDED.quiz_streak,
      longest_streak = EXCLUDED.longest_streak;

    -- Add badges
    INSERT INTO user_badges (user_id, badge_key, badge_name, badge_description, badge_category, badge_icon, strength) VALUES 
      (facilitator_id, 'early-adopter', 'Early Adopter', 'Joined the platform early', 'special', '🌟', 1),
      (facilitator_id, 'quiz-master-5', 'Quiz Enthusiast', 'Completed 5 quizzes', 'achievement', '📚', 1)
    ON CONFLICT (user_id, badge_key) DO NOTHING;

    -- Add achievements
    INSERT INTO user_achievements (user_id, achievement_type, achievement_key, achievement_name, achievement_description, achievement_icon, xp_awarded) VALUES 
      (facilitator_id, 'first_quiz', 'first-quiz-completed', 'First Steps', 'Completed your first quiz', '🎯', 50),
      (facilitator_id, 'level_up', 'level-up-2', 'Level 2!', 'Reached level 2', '⬆️', 0)
    ON CONFLICT (user_id, achievement_key) DO NOTHING;

    RAISE NOTICE 'Created facilitator user: facilitator@chartingthecourse.test (ID: %)', facilitator_id;
  ELSE
    RAISE NOTICE 'Facilitator user already exists, skipping...';
  END IF;

  -- ========================================================================
  -- CREATE VIEWER USER
  -- ========================================================================
  
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'viewer@chartingthecourse.test') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      viewer_id,
      '00000000-0000-0000-0000-000000000000',
      'viewer@chartingthecourse.test',
      crypt('TestPassword123!', gen_salt('bf')),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"first_name": "Viewer", "last_name": "User"}',
      'authenticated',
      'authenticated',
      NOW(),
      NOW(),
      '',
      ''
    );

    -- Create identity
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      viewer_id,
      viewer_id,
      'viewer@chartingthecourse.test',
      jsonb_build_object('sub', viewer_id::text, 'email', 'viewer@chartingthecourse.test'),
      'email',
      NOW(),
      NOW(),
      NOW()
    );

    -- Create/Update profile (may already exist from trigger)
    INSERT INTO profiles (id, first_name, last_name, username, bio, headline, profile_visibility, share_slug, profile_tags, social_links)
    VALUES (
      viewer_id,
      'Viewer',
      'User',
      'viewer',
      'Exploring quizzes and building my profile.',
      'Learner • Explorer',
      'private',
      'viewer',
      ARRAY['learning', 'growth'],
      '{}'
    )
    ON CONFLICT (id) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      username = EXCLUDED.username,
      bio = EXCLUDED.bio,
      headline = EXCLUDED.headline,
      profile_visibility = EXCLUDED.profile_visibility,
      share_slug = EXCLUDED.share_slug,
      profile_tags = EXCLUDED.profile_tags,
      social_links = EXCLUDED.social_links,
      updated_at = NOW();

    -- Assign viewer role (may already exist from trigger)
    INSERT INTO user_roles (user_id, role_id, assigned_at)
    VALUES (viewer_id, viewer_role_id, NOW())
    ON CONFLICT (user_id) DO UPDATE SET role_id = EXCLUDED.role_id;

    -- Create privacy settings
    INSERT INTO user_privacy_settings (user_id, is_profile_public, show_badges, show_quiz_results, show_tags, allow_discovery)
    VALUES (viewer_id, false, false, false, false, false)
    ON CONFLICT (user_id) DO UPDATE SET
      is_profile_public = EXCLUDED.is_profile_public,
      show_badges = EXCLUDED.show_badges,
      show_quiz_results = EXCLUDED.show_quiz_results,
      show_tags = EXCLUDED.show_tags,
      allow_discovery = EXCLUDED.allow_discovery;

    -- Initialize XP
    INSERT INTO user_xp_levels (user_id, total_xp, current_level, xp_to_next_level, quiz_streak, longest_streak)
    VALUES (viewer_id, 50, 1, 50, 1, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      total_xp = EXCLUDED.total_xp,
      current_level = EXCLUDED.current_level,
      xp_to_next_level = EXCLUDED.xp_to_next_level,
      quiz_streak = EXCLUDED.quiz_streak,
      longest_streak = EXCLUDED.longest_streak;

    -- Add badges
    INSERT INTO user_badges (user_id, badge_key, badge_name, badge_description, badge_category, badge_icon, strength) VALUES 
      (viewer_id, 'first-quiz', 'Quiz Pioneer', 'Completed your first quiz', 'achievement', '🎯', 1)
    ON CONFLICT (user_id, badge_key) DO NOTHING;

    -- Add achievements
    INSERT INTO user_achievements (user_id, achievement_type, achievement_key, achievement_name, achievement_description, achievement_icon, xp_awarded) VALUES 
      (viewer_id, 'first_quiz', 'first-quiz-completed', 'First Steps', 'Completed your first quiz', '🎯', 50)
    ON CONFLICT (user_id, achievement_key) DO NOTHING;

    RAISE NOTICE 'Created viewer user: viewer@chartingthecourse.test (ID: %)', viewer_id;
  ELSE
    RAISE NOTICE 'Viewer user already exists, skipping...';
  END IF;

  -- ========================================================================
  -- RECALCULATE PROFILE STATS
  -- ========================================================================
  
  -- Get the actual IDs for users that exist
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@chartingthecourse.test';
  SELECT id INTO facilitator_id FROM auth.users WHERE email = 'facilitator@chartingthecourse.test';
  SELECT id INTO viewer_id FROM auth.users WHERE email = 'viewer@chartingthecourse.test';

  IF admin_id IS NOT NULL THEN
    PERFORM recalculate_user_profile_stats(admin_id);
  END IF;
  
  IF facilitator_id IS NOT NULL THEN
    PERFORM recalculate_user_profile_stats(facilitator_id);
  END IF;
  
  IF viewer_id IS NOT NULL THEN
    PERFORM recalculate_user_profile_stats(viewer_id);
  END IF;

  RAISE NOTICE '✅ Seed complete!';
END $$;

-- ============================================================================
-- SEED COMPLETE!
-- ============================================================================
-- 
-- Test Users Created:
-- 
-- | Role        | Email                              | Password          | Username    |
-- |-------------|------------------------------------|--------------------|-------------|
-- | Admin       | admin@chartingthecourse.test       | TestPassword123!   | admin       |
-- | Facilitator | facilitator@chartingthecourse.test | TestPassword123!   | facilitator |
-- | Viewer      | viewer@chartingthecourse.test      | TestPassword123!   | viewer      |
--
-- Run: npm run db:seed
-- ============================================================================
