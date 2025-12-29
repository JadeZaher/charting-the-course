// Edge Function: Save Quiz Progress
// Matches behavior of existing Express API POST /api/quiz-progress/:quizId

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, isAdminOrFacilitator, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from "../../_shared/response.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Validation schema for progress
const saveProgressSchema = z.object({
  current_question_index: z.number().int().min(0),
  answers: z.array(z.unknown()),
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

    if (!quizId || quizId === "save-progress") {
      return errorResponse("Quiz ID is required", undefined, 400);
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = saveProgressSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        "Invalid progress data",
        validationResult.error.errors,
        400
      );
    }

    const { current_question_index, answers } = validationResult.data;

    // Verify quiz exists and user has access
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id, is_published")
      .eq("id", quizId)
      .single();

    if (quizError || !quiz) {
      return notFoundResponse("Quiz not found");
    }

    // Check access: unpublished quizzes only accessible to admin/facilitator
    if (!quiz.is_published) {
      const userIsPrivileged = await isAdminOrFacilitator(user.id, supabase);
      if (!userIsPrivileged) {
        return forbiddenResponse("Access denied to unpublished quiz");
      }
    }

    // Upsert progress (create or update)
    const { data: progress, error: progressError } = await supabase
      .from("quiz_progress")
      .upsert({
        user_id: user.id,
        quiz_id: quizId,
        current_question_index,
        answers,
        last_updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,quiz_id",
      })
      .select()
      .single();

    if (progressError) {
      console.error("Error saving quiz progress:", progressError);
      return errorResponse("Failed to save quiz progress", progressError.message, 500);
    }

    return successResponse(progress);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});

