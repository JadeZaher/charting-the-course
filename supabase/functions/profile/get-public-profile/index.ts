// Edge Function: Get Public Profile by Username or Share Slug
// For viewing profiles via /u/:username or share links

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceRoleClient, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, notFoundResponse } from "../../_shared/response.ts";
import type { PublicProfileResponse, UserBadge, UserAchievement, LevelDefinition } from "../../_shared/types.ts";

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Initialize Supabase client with service role to bypass RLS for public profile access
    // This is safe because we validate profile visibility before returning data
    const supabase = createServiceRoleClient();

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

    // Get tags if privacy allows (using same setting as badges for now)
    const showTags = isTokenAccess
      ? shareLink.show_badges ?? true
      : privacySettings?.show_tags ?? false;
    
    let tags: any[] = [];
    if (showTags) {
      const { data: tagsData } = await supabase
        .from("user_tags")
        .select("*")
        .eq("user_id", profile.id);
      tags = tagsData || [];
    }

    // Get agreements if tags are shown
    let agreements: any[] = [];
    if (showTags) {
      const { data: userAgreements } = await supabase
        .from("user_agreements")
        .select("id, agreement_key, source_quiz_id, created_at")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });
      
      if (userAgreements && userAgreements.length > 0) {
        const agreementKeys = [...new Set(userAgreements.map(ua => ua.agreement_key))];
        const quizIds = [...new Set(userAgreements.map(ua => ua.source_quiz_id))];
        
        const { data: agreementDefs } = await supabase
          .from("agreement_definitions")
          .select("agreement_key, agreement_statement, agreement_category")
          .in("agreement_key", agreementKeys);
        
        const { data: quizzes } = await supabase
          .from("quizzes")
          .select("id, title")
          .in("id", quizIds);
        
        agreements = userAgreements.map(ua => ({
          id: ua.id,
          agreement_key: ua.agreement_key,
          agreement_statement: agreementDefs?.find(ad => ad.agreement_key === ua.agreement_key)?.agreement_statement || ua.agreement_key,
          agreement_category: agreementDefs?.find(ad => ad.agreement_key === ua.agreement_key)?.agreement_category || null,
          source_quiz_id: ua.source_quiz_id,
          quiz_title: quizzes?.find(q => q.id === ua.source_quiz_id)?.title || null,
          created_at: ua.created_at
        }));
      }
    }

    // Get quiz results if privacy allows
    const showQuizResults = isTokenAccess
      ? shareLink.show_stats ?? true
      : privacySettings?.show_quiz_results ?? false;
    
    let quizResults: any[] = [];
    if (showQuizResults) {
      const { data: resultData } = await supabase
        .from("quiz_results")
        .select(`
          id, quiz_id, score, completed_at, survey_results,
          quiz:quizzes (title, survey_json)
        `)
        .eq("user_id", profile.id)
        .order("completed_at", { ascending: false })
        .limit(10);
      
      quizResults = (resultData || []).map((r: any) => ({
        id: r.id,
        quiz_id: r.quiz_id,
        score: r.score,
        completed_at: r.completed_at,
        survey_results: r.survey_results,
        quiz_title: r.quiz?.title,
        survey_json: r.quiz?.survey_json
      }));
    }

    // Build response with extended data
    const response: any = {
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
        profile_visibility: profile.profile_visibility,
        share_slug: profile.share_slug,
        created_at: profile.created_at,
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
      badges: badges || [],
      achievements,
      level_info: levelInfo,
      tags,
      agreements,
      quizResults,
      xpLevel: xpLevel ? {
        total_xp: xpLevel.total_xp,
        current_level: xpLevel.current_level,
        quiz_streak: xpLevel.quiz_streak || 0,
      } : null,
      privacy: privacySettings ? {
        is_profile_public: profile.profile_visibility === 'public',
        show_badges: privacySettings.show_badges ?? false,
        show_tags: privacySettings.show_tags ?? false,
        show_quiz_results: privacySettings.show_quiz_results ?? false,
      } : null,
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

