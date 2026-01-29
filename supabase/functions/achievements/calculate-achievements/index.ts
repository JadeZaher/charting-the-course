// DISABLED: Gamification paused as part of Tile Architecture Migration (Jan 2026)
// Edge Function: Calculate and Assign Achievements After Quiz Submission
// Called after quiz submission to check and award badges, XP, and achievements

/*
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, createServiceRoleClient, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse } from "../../_shared/response.ts";
import type { BadgeConditions, UserAchievement, EarnedBadge } from "../../_shared/types.ts";
import { determineBadgesFromTags } from "../../_shared/tagExtraction.ts";

interface AchievementResult {
  badges_earned: string[];
  achievements_earned: string[];
  xp_awarded: number;
  leveled_up: boolean;
  new_level: number | null;
}

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

    // Parse request body
    const { quiz_result_id, quiz_id, score } = await req.json();

    if (!quiz_result_id || !quiz_id) {
      return errorResponse("quiz_result_id and quiz_id are required", undefined, 400);
    }

    // Use service role for calculations
    const adminSupabase = createServiceRoleClient();

    const result: AchievementResult = {
      badges_earned: [],
      achievements_earned: [],
      xp_awarded: 0,
      leveled_up: false,
      new_level: null,
    };

    // Get all badge definitions
    const { data: badgeDefinitions } = await adminSupabase
      .from("badge_definitions")
      .select("*")
      .eq("is_active", true);

    // Get user's current data
    const { data: userTags } = await adminSupabase
      .from("user_tags")
      .select("tag_key, tag_value, tag_category")
      .eq("user_id", user.id);

    const { data: quizResults } = await adminSupabase
      .from("quiz_results")
      .select("id, quiz_id, score")
      .eq("user_id", user.id);

    const { data: existingBadges } = await adminSupabase
      .from("user_badges")
      .select("badge_key")
      .eq("user_id", user.id);

    const existingBadgeKeys = new Set(existingBadges?.map((b) => b.badge_key) || []);

    // Calculate base XP for quiz completion
    let baseXP = 25; // Base XP for completing a quiz
    if (score >= 90) baseXP += 25; // Bonus for high score
    if (score === 100) baseXP += 25; // Bonus for perfect score

    result.xp_awarded = baseXP;

    // Check each badge definition
    for (const badgeDef of badgeDefinitions || []) {
      // Skip if user already has this badge
      if (existingBadgeKeys.has(badgeDef.badge_key)) {
        continue;
      }

      const conditions = badgeDef.conditions as BadgeConditions;
      let earned = false;

      switch (conditions.type) {
        case "tag_match": {
          // Check tag value match
          if (conditions.tag_value_match) {
            const match = userTags?.find(
              (t) =>
                t.tag_key === conditions.tag_value_match!.tag_key &&
                t.tag_value.toLowerCase() === conditions.tag_value_match!.value.toLowerCase()
            );
            earned = !!match;
          }

          // Check required tags
          if (!earned && conditions.required_tags && conditions.required_tags.length > 0) {
            const hasAllTags = conditions.required_tags.every((tag) =>
              userTags?.some((t) => t.tag_key === tag)
            );
            earned = hasAllTags;
          }

          // Check any of tags
          if (!earned && conditions.any_of_tags && conditions.any_of_tags.length > 0) {
            const hasAnyTag = conditions.any_of_tags.some((tag) =>
              userTags?.some((t) => t.tag_key === tag)
            );
            earned = hasAnyTag;
          }
          break;
        }

        case "quiz_count": {
          const quizCount = quizResults?.length || 0;
          earned = quizCount >= (conditions.min_quiz_count || 0);
          break;
        }

        case "quiz_score": {
          // Check if any quiz has the minimum score
          if (conditions.min_quiz_score) {
            const hasScore = quizResults?.some((r) => r.score >= conditions.min_quiz_score!);
            earned = !!hasScore;
          }
          break;
        }

        case "tag_count": {
          if (conditions.min_tag_count) {
            const categoryTags = userTags?.filter(
              (t) => t.tag_category === conditions.min_tag_count!.category
            );
            earned = (categoryTags?.length || 0) >= conditions.min_tag_count.count;
          }
          break;
        }

        case "custom": {
          // Custom badges need specific logic
          // For now, skip custom badges in auto-calculation
          break;
        }
      }

      // Award badge if earned
      if (earned) {
        const { error: badgeError } = await adminSupabase.from("user_badges").upsert({
          user_id: user.id,
          badge_key: badgeDef.badge_key,
          badge_name: badgeDef.badge_name,
          badge_description: badgeDef.badge_description,
          badge_category: badgeDef.badge_category,
          badge_icon: badgeDef.badge_icon,
          badge_definition_id: badgeDef.id,
          strength: 1,
        }, {
          onConflict: "user_id,badge_key",
        });

        if (!badgeError) {
          result.badges_earned.push(badgeDef.badge_key);
          result.xp_awarded += badgeDef.xp_reward;

          // Create badge earned achievement
          await adminSupabase.from("user_achievements").upsert({
            user_id: user.id,
            achievement_type: "badge_earned",
            achievement_key: `badge-${badgeDef.badge_key}`,
            achievement_name: `Earned: ${badgeDef.badge_name}`,
            achievement_description: badgeDef.badge_description,
            achievement_icon: badgeDef.badge_icon,
            related_badge_id: badgeDef.id,
            xp_awarded: badgeDef.xp_reward,
            achievement_data: { badge_key: badgeDef.badge_key },
          }, {
            onConflict: "user_id,achievement_key",
          });

          result.achievements_earned.push(`badge-${badgeDef.badge_key}`);
        }
      }
    }

    // Check for first quiz achievement
    if (quizResults?.length === 1) {
      await adminSupabase.from("user_achievements").upsert({
        user_id: user.id,
        achievement_type: "first_quiz",
        achievement_key: "first-quiz-completed",
        achievement_name: "First Steps",
        achievement_description: "Completed your first quiz",
        achievement_icon: "🎯",
        related_quiz_id: quiz_id,
        xp_awarded: 50,
        achievement_data: { quiz_id },
      }, {
        onConflict: "user_id,achievement_key",
      });

      result.achievements_earned.push("first-quiz-completed");
      result.xp_awarded += 50;
    }

    // Check for perfect score achievement
    if (score === 100) {
      const achievementKey = `perfect-score-${quiz_id}`;
      const { data: existingPerfect } = await adminSupabase
        .from("user_achievements")
        .select("id")
        .eq("user_id", user.id)
        .eq("achievement_key", achievementKey)
        .single();

      if (!existingPerfect) {
        await adminSupabase.from("user_achievements").insert({
          user_id: user.id,
          achievement_type: "quiz_perfect_score",
          achievement_key: achievementKey,
          achievement_name: "Perfect Score!",
          achievement_description: "Achieved 100% on a quiz",
          achievement_icon: "💯",
          related_quiz_id: quiz_id,
          xp_awarded: 50,
          achievement_data: { quiz_id, score: 100 },
        });

        result.achievements_earned.push(achievementKey);
        result.xp_awarded += 50;
      }
    }

    // Award XP and check for level up
    if (result.xp_awarded > 0) {
      const { data: xpResult } = await adminSupabase.rpc("award_xp", {
        user_uuid: user.id,
        xp_amount: result.xp_awarded,
        source_type: "quiz",
      });

      if (xpResult && xpResult.length > 0) {
        const [xpData] = xpResult;
        result.leveled_up = xpData.leveled_up;
        result.new_level = xpData.leveled_up ? xpData.new_level : null;

        // Create level up achievement if leveled up
        if (result.leveled_up) {
          await adminSupabase.from("user_achievements").insert({
            user_id: user.id,
            achievement_type: "level_up",
            achievement_key: `level-up-${xpData.new_level}`,
            achievement_name: `Level ${xpData.new_level}!`,
            achievement_description: `Reached level ${xpData.new_level}`,
            achievement_icon: "⬆️",
            xp_awarded: 0,
            achievement_data: { new_level: xpData.new_level, total_xp: xpData.new_total_xp },
          });

          result.achievements_earned.push(`level-up-${xpData.new_level}`);
        }
      }
    }

    // Update user profile stats
    await adminSupabase.rpc("recalculate_user_profile_stats", {
      user_uuid: user.id,
    });

    return successResponse(result);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});
*/

// Placeholder response for disabled function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      message: "Gamification is currently disabled",
      badges_earned: [],
      achievements_earned: [],
      xp_awarded: 0,
      leveled_up: false,
      new_level: null
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
});
