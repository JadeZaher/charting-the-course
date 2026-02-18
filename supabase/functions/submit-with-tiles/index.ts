// Edge Function: Submit Quiz with Tile Generation (Phase 4)
// Generates profile tiles from quiz answers instead of tags/badges
// For assessment quizzes: No Pass/Fail scoring, creates profile tiles
// For graded quizzes: Still calculates score, but also creates tiles

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, isAdminOrFacilitator, createServiceRoleClient, corsHeaders, handleCors } from "../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from "../_shared/response.ts";
import { generateTilesFromSubmission, isAssessmentQuiz, cleanupOldTiles, getStrategyForQuiz } from "../_shared/tileGeneration.ts";
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

    if (!quizId || quizId === "submit-with-tiles") {
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

    // Use service role client for transaction-like operations
    const adminSupabase = createServiceRoleClient();

    // Business rule: Check for existing results if retakes not allowed
    if (!quiz.allow_retakes) {
      const { data: existingResult } = await adminSupabase
        .from("quiz_results")
        .select("id")
        .eq("user_id", user.id)
        .eq("quiz_id", quizId)
        .maybeSingle();

      if (existingResult) {
        return errorResponse(
          "You have already completed this quiz and retakes are not allowed.",
          undefined,
          400
        );
      }
    }

    // Determine if this is an assessment quiz (no correct answers)
    const isAssessment = isAssessmentQuiz(quiz.survey_json);

    // Calculate score (correctness for graded, completion for assessments)
    let score = 0;
    let isPassed: boolean | null = null;
    let resultMetadata: Record<string, any> = {};
    
    if (quiz.survey_json && typeof quiz.survey_json === "object") {
      const surveyDef = quiz.survey_json as any;
      let correctCount = 0;
      let gradableQuestions = 0;
      let totalQuestions = 0;
      let answeredQuestions = 0;

      // Non-question element types in SurveyJS that should be excluded
      const nonQuestionTypes = ['html', 'panel', 'image', 'expression', 'flowpanel'];
      
      if (surveyDef.pages && Array.isArray(surveyDef.pages)) {
        for (const page of surveyDef.pages) {
          if (page.elements && Array.isArray(page.elements)) {
            for (const element of page.elements) {
              // Skip non-question elements
              if (nonQuestionTypes.includes(element.type)) {
                continue;
              }
              
              // Count actual questions for completion percentage
              totalQuestions++;
              const userAnswer = survey_results[element.name];
              
              // Check if question was answered (not undefined/null/empty)
              const isAnswered = userAnswer !== undefined && 
                                 userAnswer !== null && 
                                 userAnswer !== '' &&
                                 !(Array.isArray(userAnswer) && userAnswer.length === 0);
              
              if (isAnswered) {
                answeredQuestions++;
              }

              // For graded quizzes, also track correctness
              if (!isAssessment && element.correctAnswer !== undefined && element.correctAnswer !== null) {
                gradableQuestions++;
                if (isAnswered) {
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

      // Calculate percentages
      const completionPercentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
      const correctnessPercentage = gradableQuestions > 0 ? Math.round((correctCount / gradableQuestions) * 100) : 0;
      const skippedQuestions = totalQuestions - answeredQuestions;
      const incorrectCount = gradableQuestions - correctCount;
      
      if (isAssessment) {
        // For assessments: score = completion percentage
        score = completionPercentage;
      } else {
        // For graded quizzes: score = correctness percentage
        score = correctnessPercentage;
        
        // Check passing score
        if (quiz.passing_score) {
          isPassed = score >= quiz.passing_score;
        }
      }
      
      // Build result metadata
      resultMetadata = {
        totalQuestions,
        answeredQuestions,
        skippedQuestions,
        completionPercentage,
        isAssessment,
        // Only include graded-specific fields for graded quizzes
        ...(isAssessment ? {} : {
          correctCount,
          incorrectCount,
          gradableQuestions,
          correctnessPercentage,
        }),
      };
    }

    // Save quiz result
    // For assessments: score = completion percentage
    // For graded quizzes: score = correctness percentage
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
        result_metadata: resultMetadata,
      })
      .select()
      .single();

    if (resultError) {
      console.error("Error saving quiz result:", resultError);
      return errorResponse("Failed to save quiz result", resultError.message, 500);
    }

    if (!quizResult) {
      return errorResponse("Failed to save quiz result: no data returned", undefined, 500);
    }

    // Clean up old tiles from previous submissions (retakes)
    await cleanupOldTiles(adminSupabase, user.id, quizId, quizResult.id);

    // Get strategy for this quiz
    const strategy = getStrategyForQuiz(quizId, quiz.survey_json);

    // Generate profile tiles from submission
    const tiles = generateTilesFromSubmission(
      user.id,
      quizResult.id,
      quiz.survey_json,
      survey_results as Record<string, any>,
      strategy
    );

    // Save tiles to database
    let tilesCreated = 0;

    if (tiles.length > 0) {
      const { data: createdTiles, error: tilesError } = await adminSupabase
        .from("profile_tiles")
        .insert(tiles)
        .select();

      if (tilesError) {
        console.error("Error saving tiles:", tilesError);
      } else {
        tilesCreated = createdTiles?.length || 0;
      }
    }

    // Delete quiz progress since it's completed
    await supabase
      .from("quiz_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("quiz_id", quizId);

    // Return result with tile stats
    return successResponse(
      {
        result: quizResult as QuizResult,
        tiles_created: tilesCreated,
        is_assessment: isAssessment,
      },
      201
    );
  } catch (error) {
    console.error("Unexpected error in submit-with-tiles:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});
