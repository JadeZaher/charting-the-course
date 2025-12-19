// Edge Function: Get Private Profile (Authenticated User's Own Profile)
// Returns full profile data including settings and XP details

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getAuthUser, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from "../../_shared/response.ts";
import type { PrivateProfileResponse, UserBadge, UserAchievement, LevelDefinition, QuizResult } from "../../_shared/types.ts";

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Initialize Supabase client
    const supabase = createSupabaseClient();

    // Get authenticated user
    const user = await getAuthUser(req, supabase);
    if (!user) {
      return unauthorizedResponse("Authentication required");
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return notFoundResponse("Profile not found");
    }

    // Get privacy settings
    const { data: privacySettings } = await supabase
      .from("user_privacy_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Get profile data/stats
    const { data: profileData } = await supabase
      .from("user_profile_data")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Get XP/level info
    const { data: xpLevel } = await supabase
      .from("user_xp_levels")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Get current level definition
    let levelInfo: LevelDefinition | null = null;
    if (xpLevel) {
      const { data: levelDef } = await supabase
        .from("level_definitions")
        .select("*")
        .eq("level", xpLevel.current_level)
        .single();
      levelInfo = levelDef;
    }

    // Get all badges
    const { data: badges } = await supabase
      .from("user_badges")
      .select("*")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false });

    // Get all achievements
    const { data: achievements } = await supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false });

    // Get share links
    const { data: shareLinks } = await supabase
      .from("profile_share_links")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Get quiz history
    const { data: quizHistory } = await supabase
      .from("quiz_results")
      .select(`
        *,
        quizzes (
          id,
          title,
          description
        )
      `)
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(50);

    // Build response
    const response: PrivateProfileResponse = {
      profile: profile,
      stats: {
        total_quizzes_completed: profileData?.total_quizzes_completed ?? 0,
        total_badges_earned: profileData?.total_badges_earned ?? 0,
        current_level: xpLevel?.current_level ?? 1,
        level_name: levelInfo?.level_name ?? "Newcomer",
        level_icon: levelInfo?.level_icon ?? "🌱",
        total_xp: xpLevel?.total_xp ?? 0,
      },
      badges: badges as UserBadge[],
      achievements: achievements as UserAchievement[],
      level_info: levelInfo,
      xp_details: xpLevel,
      privacy_settings: privacySettings
        ? {
            is_profile_public: privacySettings.is_profile_public,
            show_badges: privacySettings.show_badges,
            show_quiz_results: privacySettings.show_quiz_results,
            show_tags: privacySettings.show_tags,
            shared_dimensions: privacySettings.shared_dimensions,
            allow_discovery: privacySettings.allow_discovery,
          }
        : null,
      share_links: shareLinks,
      quiz_history: quizHistory as QuizResult[],
    };

    return successResponse(response);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});

