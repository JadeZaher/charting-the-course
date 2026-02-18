// Edge Function: Submit Quiz with Tag Extraction & Badge Generation
// Enhanced version of submit-answers that includes full tag/badge workflow
// Matches behavior of existing Express API POST /api/quizzes/:id/submit

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, isAdminOrFacilitator, createServiceRoleClient, corsHeaders, handleCors } from "../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from "../_shared/response.ts";
import { extractTagsFromQuizSubmission, determineBadgesFromTags } from "../_shared/tagExtraction.ts";
import type { SubmitQuizRequest, QuizResult } from "../_shared/types.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Validation schema for quiz submission
const submitQuizSchema = z.object({
  survey_results: z.record(z.unknown()),
  time_spent: z.number().int().positive().optional(),
});

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

    // Get quiz_id from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const quizId = pathParts[pathParts.length - 1];

    if (!quizId || quizId === "submit-with-tags") {
      return errorResponse("Quiz ID is required", undefined, 400);
    }

    // Parse and validate request body
    const body: SubmitQuizRequest = await req.json();
    const validationResult = submitQuizSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        "Invalid submission data",
        validationResult.error.errors,
        400
      );
    }

    const { survey_results, time_spent } = validationResult.data;

    // Get the quiz
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .single();

    if (quizError || !quiz) {
      return notFoundResponse("Quiz not found");
    }

    // Check if user is privileged
    const userIsPrivileged = await isAdminOrFacilitator(user.id, supabase);

    // Access control: Check if quiz is published or user is privileged
    if (!quiz.is_published && !userIsPrivileged) {
      return forbiddenResponse("Access denied to unpublished quiz");
    }

    // Business rule: Check quiz mode
    if (quiz.mode === "upload") {
      return errorResponse(
        "This quiz is in upload-only mode. Please use the upload feature instead.",
        undefined,
        400
      );
    }

    // Use service role client for transaction-like operations (needed for retake check and all DB operations)
    const adminSupabase = createServiceRoleClient();

    // Business rule: Check for existing results if retakes not allowed
    // Must use service role client to bypass RLS
    if (!quiz.allow_retakes) {
      const { data: existingResult } = await adminSupabase
        .from("quiz_results")
        .select("id")
        .eq("user_id", user.id)
        .eq("quiz_id", quizId)
        .maybeSingle(); // Use maybeSingle() to handle case when no result exists

      if (existingResult) {
        return errorResponse(
          "You have already completed this quiz and retakes are not allowed.",
          undefined,
          400
        );
      }
    }

    // Calculate score (matching Express API logic)
    let score = 0;
    let isPassed = true;
    let correctCount = 0;
    let totalQuestions = 0;

    if (quiz.survey_json && typeof quiz.survey_json === "object") {
      const surveyDef = quiz.survey_json as any;

      if (surveyDef.pages && Array.isArray(surveyDef.pages)) {
        for (const page of surveyDef.pages) {
          if (page.elements && Array.isArray(page.elements)) {
            for (const element of page.elements) {
              if (
                element.correctAnswer !== undefined &&
                element.correctAnswer !== null
              ) {
                totalQuestions++;
                const userAnswer = survey_results[element.name];

                if (userAnswer !== undefined) {
                  const userAnswerStr = String(userAnswer).trim().toLowerCase();
                  const correctAnswerStr = String(element.correctAnswer)
                    .trim()
                    .toLowerCase();

                  if (userAnswerStr === correctAnswerStr) {
                    correctCount++;
                  }
                }
              }
            }
          }
        }
      }

      score =
        totalQuestions > 0
          ? Math.round((correctCount / totalQuestions) * 100)
          : 0;
    }

    // Check passing score
    if (quiz.passing_score) {
      isPassed = score >= quiz.passing_score;
    }

    // Save quiz result
    const { data: quizResult, error: resultError } = await adminSupabase
      .from("quiz_results")
      .insert({
        quiz_id: quizId,
        user_id: user.id,
        survey_results,
        score,
        is_passed: isPassed,
        time_spent: time_spent || null,
        is_imported: false,
      })
      .select()
      .single();

    if (resultError) {
      console.error("Error saving quiz result:", resultError);
      console.error("Quiz ID:", quizId);
      console.error("User ID:", user.id);
      console.error("Score:", score);
      return errorResponse("Failed to save quiz result", resultError.message, 500);
    }

    if (!quizResult) {
      console.error("Quiz result insert returned no data");
      return errorResponse("Failed to save quiz result: no data returned", undefined, 500);
    }

    // Clean up tags from previous quiz attempts (retakes)
    const { data: previousResults } = await adminSupabase
      .from("quiz_results")
      .select("id")
      .eq("user_id", user.id)
      .eq("quiz_id", quizId)
      .neq("id", quizResult.id)
      .order("completed_at", { ascending: false });

    if (previousResults && previousResults.length > 0) {
      for (const prevResult of previousResults) {
        await adminSupabase
          .from("user_tags")
          .delete()
          .eq("quiz_result_id", prevResult.id);
      }
    }

    // Extract tags from quiz submission
    const extractedTags = extractTagsFromQuizSubmission(
      user.id,
      quizResult.id,
      quiz.survey_json,
      survey_results
    );

    // Save tags to database
    let tagsCreated = 0;
    if (extractedTags.length > 0) {
      const { data: createdTags, error: tagsError } = await adminSupabase
        .from("user_tags")
        .insert(extractedTags)
        .select();

      if (tagsError) {
        console.error("Error saving tags:", tagsError);
      } else {
        tagsCreated = createdTags?.length || 0;
      }
    }

    // Recalculate badges from ALL current tags
    // Delete all existing badges and rebuild from scratch
    await adminSupabase.from("user_badges").delete().eq("user_id", user.id);

    // Get all user tags
    const { data: allUserTags } = await adminSupabase
      .from("user_tags")
      .select("tag_key, tag_value, tag_category")
      .eq("user_id", user.id);

    // Determine badges to earn
    const badgesToEarn = determineBadgesFromTags(allUserTags || []);

    // Create badges
    let badgesCreated = 0;
    if (badgesToEarn.length > 0) {
      const badgeInserts = badgesToEarn.map((badge) => ({
        user_id: user.id,
        badge_key: badge.badge_key,
        badge_name: badge.badge_name,
        badge_description: badge.badge_description,
        badge_category: badge.badge_category,
        badge_icon: badge.badge_icon,
        strength: 1,
        source_tag_keys: badge.source_tag_keys,
      }));

      const { data: createdBadges, error: badgesError } = await adminSupabase
        .from("user_badges")
        .insert(badgeInserts)
        .select();

      if (badgesError) {
        console.error("Error saving badges:", badgesError);
      } else {
        badgesCreated = createdBadges?.length || 0;
      }
    }

    // Update user profile stats (optional - function may not exist)
    try {
      const { error: rpcError } = await adminSupabase.rpc("recalculate_user_profile_stats", {
        user_uuid: user.id,
      });
      if (rpcError) {
        console.warn("recalculate_user_profile_stats RPC not available:", rpcError.message);
        // Continue without failing - stats can be recalculated later
      }
    } catch (rpcError) {
      console.warn("recalculate_user_profile_stats RPC failed:", rpcError);
      // Continue without failing - stats can be recalculated later
    }

    // Delete quiz progress since it's completed
    await supabase
      .from("quiz_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("quiz_id", quizId);

    // Return result with tag/badge stats
    return successResponse(
      {
        result: quizResult as QuizResult,
        tags_created: tagsCreated,
        badges_earned: badgesCreated,
      },
      201
    );
  } catch (error) {
    console.error("Unexpected error in submit-with-tags:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});
