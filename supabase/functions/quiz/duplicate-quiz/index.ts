// Edge Function: Duplicate Quiz
// Creates a copy of an existing quiz with new ID

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, isAdminOrFacilitator, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from "../../_shared/response.ts";
import type { Quiz } from "../../_shared/types.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Validation schema for duplicate options
const duplicateQuizSchema = z.object({
  new_title: z.string().min(1).max(200).optional(),
  visibility: z.enum(["public", "private", "team", "assigned"]).optional(),
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

    // Check if user is admin or facilitator
    const userIsAdminOrFacilitator = await isAdminOrFacilitator(user.id, supabase);
    if (!userIsAdminOrFacilitator) {
      return forbiddenResponse("Admin or facilitator access required");
    }

    // Get quiz_id from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const quizId = pathParts[pathParts.length - 1];

    if (!quizId || quizId === "duplicate-quiz") {
      return errorResponse("Quiz ID is required", undefined, 400);
    }

    // Parse options (optional body)
    let options = {};
    try {
      const body = await req.json();
      const validationResult = duplicateQuizSchema.safeParse(body);
      if (validationResult.success) {
        options = validationResult.data;
      }
    } catch {
      // No body or invalid JSON - use defaults
    }

    const { new_title, visibility } = options as any;

    // Get original quiz
    const { data: originalQuiz, error: fetchError } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .single();

    if (fetchError || !originalQuiz) {
      return notFoundResponse("Quiz not found");
    }

    // Create duplicate quiz
    const { data: duplicatedQuiz, error: createError } = await supabase
      .from("quizzes")
      .insert({
        title: new_title || `${originalQuiz.title} (Copy)`,
        description: originalQuiz.description,
        course_id: originalQuiz.course_id,
        mode: originalQuiz.mode,
        survey_json: originalQuiz.survey_json,
        questions: originalQuiz.questions,
        time_limit: originalQuiz.time_limit,
        passing_score: originalQuiz.passing_score,
        allow_retakes: originalQuiz.allow_retakes,
        visibility: visibility || originalQuiz.visibility,
        team_id: originalQuiz.team_id,
        created_by: user.id, // New creator is the duplicator
        is_published: false, // Duplicates start unpublished
      })
      .select()
      .single();

    if (createError) {
      console.error("Error duplicating quiz:", createError);
      return errorResponse("Failed to duplicate quiz", createError.message, 500);
    }

    return successResponse(duplicatedQuiz as Quiz, 201);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});

