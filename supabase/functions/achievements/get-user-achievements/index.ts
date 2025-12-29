// Edge Function: Get User Achievements
// Returns achievements for a specific user

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from "../../_shared/response.ts";
import type { UserAchievement, UserXPLevel, LevelDefinition } from "../../_shared/types.ts";

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Initialize Supabase client
    const supabase = createSupabaseClient();

    // Get user_id from URL path (optional - defaults to current user)
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const userId = pathParts[pathParts.length - 1];

    // Get authenticated user
    const user = await getAuthUser(req, supabase);

    // Determine target user
    let targetUserId = user?.id;
    if (userId && userId !== "get-user-achievements") {
      targetUserId = userId;
    }

    if (!targetUserId) {
      return unauthorizedResponse("Authentication required or user_id must be provided");
    }

    // Check if viewing own achievements or public profile
    const isOwnProfile = user?.id === targetUserId;

    if (!isOwnProfile) {
      // Check if profile is public
      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_visibility")
        .eq("id", targetUserId)
        .single();

      if (!profile) {
        return notFoundResponse("User not found");
      }

      if (profile.profile_visibility !== "public") {
        return errorResponse("Achievements are not publicly visible for this user", undefined, 403);
      }
    }

    // Parse query parameters
    const achievementType = url.searchParams.get("type");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    // Build query
    let query = supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", targetUserId)
      .order("earned_at", { ascending: false })
      .limit(limit);

    if (achievementType) {
      query = query.eq("achievement_type", achievementType);
    }

    const { data: achievements, error } = await query;

    if (error) {
      console.error("Error fetching achievements:", error);
      return errorResponse("Failed to fetch achievements", error.message, 500);
    }

    // Get XP/level info
    const { data: xpLevel } = await supabase
      .from("user_xp_levels")
      .select("*")
      .eq("user_id", targetUserId)
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

    // Group achievements by type
    const byType: Record<string, UserAchievement[]> = {};
    achievements?.forEach((achievement) => {
      const type = achievement.achievement_type;
      if (!byType[type]) {
        byType[type] = [];
      }
      byType[type].push(achievement);
    });

    // Calculate total XP from achievements
    const totalXPFromAchievements = achievements?.reduce(
      (sum, a) => sum + (a.xp_awarded || 0),
      0
    ) || 0;

    return successResponse({
      achievements: achievements as UserAchievement[],
      total: achievements?.length || 0,
      by_type: byType,
      total_xp_from_achievements: totalXPFromAchievements,
      xp_level: xpLevel as UserXPLevel | null,
      level_info: levelInfo,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});

