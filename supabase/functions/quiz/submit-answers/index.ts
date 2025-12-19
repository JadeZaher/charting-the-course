// Edge Function: Submit Quiz Answers
// Matches behavior of existing Express API POST /api/quizzes/:id/submit

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, isAdminOrFacilitator, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from "../../_shared/response.ts";
import type { SubmitQuizRequest, QuizResult, Quiz } from "../../_shared/types.ts";
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

    if (!quizId || quizId === "submit-answers") {
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

    // Business rule: Check for existing results if retakes not allowed
    if (!quiz.allow_retakes) {
      const { data: existingResult } = await supabase
        .from("quiz_results")
        .select("id")
        .eq("user_id", user.id)
        .eq("quiz_id", quizId)
        .limit(1)
        .single();

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

    if (quiz.survey_json && typeof quiz.survey_json === 'object') {
      const surveyDef = quiz.survey_json as any;

      if (surveyDef.pages && Array.isArray(surveyDef.pages)) {
        for (const page of surveyDef.pages) {
          if (page.elements && Array.isArray(page.elements)) {
            for (const element of page.elements) {
              if (element.correctAnswer !== undefined && element.correctAnswer !== null) {
                totalQuestions++;
                const userAnswer = survey_results[element.name];

                if (userAnswer !== undefined) {
                  const userAnswerStr = String(userAnswer).trim().toLowerCase();
                  const correctAnswerStr = String(element.correctAnswer).trim().toLowerCase();

                  if (userAnswerStr === correctAnswerStr) {
                    correctCount++;
                  }
                }
              }
            }
          }
        }
      }

      score = totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;
    }

    // Check passing score
    if (quiz.passing_score) {
      isPassed = score >= quiz.passing_score;
    }

    // Save result (RLS will ensure user can insert)
    const { data: quizResult, error: resultError } = await supabase
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
      return errorResponse("Failed to save quiz result", resultError.message, 500);
    }

    // Delete quiz progress since it's completed
    await supabase
      .from("quiz_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("quiz_id", quizId);

    // Note: Tag extraction and badge calculation will be handled in Phase 3
    // For now, we just save the result

    return successResponse(quizResult as QuizResult, 201);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});

