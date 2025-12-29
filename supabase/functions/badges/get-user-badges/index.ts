// Edge Function: Get User Badges
// Returns badges earned by a specific user

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from "../../_shared/response.ts";
import type { UserBadge, BadgeDefinition } from "../../_shared/types.ts";

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
    if (userId && userId !== "get-user-badges") {
      targetUserId = userId;
    }

    if (!targetUserId) {
      return unauthorizedResponse("Authentication required or user_id must be provided");
    }

    // Check if viewing own badges or public profile
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

      // Check privacy settings
      const { data: privacySettings } = await supabase
        .from("user_privacy_settings")
        .select("show_badges")
        .eq("user_id", targetUserId)
        .single();

      if (
        profile.profile_visibility !== "public" ||
        !privacySettings?.show_badges
      ) {
        return errorResponse("Badges are not publicly visible for this user", undefined, 403);
      }
    }

    // Get user badges with badge definitions
    const { data: badges, error } = await supabase
      .from("user_badges")
      .select(`
        *,
        badge_definitions (
          badge_key,
          badge_name,
          badge_description,
          badge_category,
          badge_icon,
          badge_color,
          xp_reward
        )
      `)
      .eq("user_id", targetUserId)
      .order("earned_at", { ascending: false });

    if (error) {
      console.error("Error fetching user badges:", error);
      return errorResponse("Failed to fetch badges", error.message, 500);
    }

    // Get badge count by category
    const categoryCounts: Record<string, number> = {};
    badges?.forEach((badge) => {
      const category = badge.badge_category || "other";
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    return successResponse({
      badges: badges as (UserBadge & { badge_definitions: BadgeDefinition | null })[],
      total: badges?.length || 0,
      by_category: categoryCounts,
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

