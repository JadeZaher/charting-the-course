// Edge Function: Get Public Profile by Username or Share Slug
// For viewing profiles via /u/:username or share links

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, notFoundResponse } from "../../_shared/response.ts";
import type { PublicProfileResponse, UserBadge, UserAchievement, LevelDefinition } from "../../_shared/types.ts";

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Initialize Supabase client
    const supabase = createSupabaseClient();

    // Get identifier from URL path (username, share_slug, or share_token)
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const identifier = pathParts[pathParts.length - 1];
    const shareToken = url.searchParams.get("token");

    if (!identifier || identifier === "get-public-profile") {
      return errorResponse("Username or share slug is required", undefined, 400);
    }

    // Try to find profile by username, share_slug, or via share token
    let profile: any = null;
    let isTokenAccess = false;
    let shareLink: any = null;

    // Check if accessing via share token
    if (shareToken) {
      const { data: link } = await supabase
        .from("profile_share_links")
        .select("*, profiles(*)")
        .eq("share_token", shareToken)
        .eq("is_active", true)
        .single();

      if (link && link.profiles) {
        shareLink = link;
        profile = link.profiles;
        isTokenAccess = true;

        // Increment view count
        await supabase
          .from("profile_share_links")
          .update({
            view_count: link.view_count + 1,
            last_viewed_at: new Date().toISOString(),
          })
          .eq("id", link.id);
      }
    }

    // If no token access, try to find by username or share_slug
    if (!profile) {
      const { data: foundProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .or(`username.eq.${identifier},share_slug.eq.${identifier}`)
        .single();

      if (profileError || !foundProfile) {
        return notFoundResponse("Profile not found");
      }

      profile = foundProfile;
    }

    // Check visibility
    if (!isTokenAccess && profile.profile_visibility === "private") {
      return errorResponse("This profile is private", undefined, 403);
    }

    if (!isTokenAccess && profile.profile_visibility === "link-only") {
      return errorResponse("This profile requires a share link to view", undefined, 403);
    }

    // Get privacy settings
    const { data: privacySettings } = await supabase
      .from("user_privacy_settings")
      .select("*")
      .eq("user_id", profile.id)
      .single();

    // Get profile data/stats
    const { data: profileData } = await supabase
      .from("user_profile_data")
      .select("*")
      .eq("user_id", profile.id)
      .single();

    // Get XP/level info
    const { data: xpLevel } = await supabase
      .from("user_xp_levels")
      .select("*")
      .eq("user_id", profile.id)
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

    // Determine what to show based on privacy settings and share link settings
    const showBadges = isTokenAccess
      ? shareLink.show_badges
      : privacySettings?.show_badges ?? false;

    const showAchievements = isTokenAccess
      ? shareLink.show_achievements
      : true; // Default show achievements for public profiles

    const showStats = isTokenAccess
      ? shareLink.show_stats
      : true; // Default show stats for public profiles

    // Get badges if allowed
    let badges: UserBadge[] | null = null;
    if (showBadges) {
      const { data: badgesData } = await supabase
        .from("user_badges")
        .select("*")
        .eq("user_id", profile.id)
        .order("earned_at", { ascending: false });
      badges = badgesData;
    }

    // Get achievements if allowed
    let achievements: UserAchievement[] | null = null;
    if (showAchievements) {
      const { data: achievementsData } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", profile.id)
        .order("earned_at", { ascending: false })
        .limit(20);
      achievements = achievementsData;
    }

    // Build response
    const response: PublicProfileResponse = {
      profile: {
        id: profile.id,
        username: profile.username,
        first_name: profile.first_name,
        last_name: profile.last_name,
        avatar_url: profile.avatar_url,
        cover_url: profile.cover_url,
        headline: profile.headline,
        bio: profile.bio,
        social_links: profile.social_links,
        profile_tags: profile.profile_tags,
      },
      stats: showStats
        ? {
            total_quizzes_completed: profileData?.total_quizzes_completed ?? 0,
            total_badges_earned: profileData?.total_badges_earned ?? 0,
            current_level: xpLevel?.current_level ?? 1,
            level_name: levelInfo?.level_name ?? "Newcomer",
            level_icon: levelInfo?.level_icon ?? "🌱",
            total_xp: xpLevel?.total_xp ?? 0,
          }
        : null,
      badges,
      achievements,
      level_info: levelInfo,
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

