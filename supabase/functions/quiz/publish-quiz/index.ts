// Edge Function: Publish/Unpublish Quiz
// Matches behavior of existing Express API POST /api/quizzes/:id/publish

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, isAdminOrFacilitator, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from "../../_shared/response.ts";
import type { Quiz } from "../../_shared/types.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Validation schema for publish action
const publishQuizSchema = z.object({
  is_published: z.boolean(),
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

    if (!quizId || quizId === "publish-quiz") {
      return errorResponse("Quiz ID is required", undefined, 400);
    }

    // Parse and validate request body (optional - defaults to publish)
    let isPublished = true; // Default: publish
    try {
      const body = await req.json();
      const validationResult = publishQuizSchema.safeParse(body);
      if (validationResult.success) {
        isPublished = validationResult.data.is_published;
      }
    } catch {
      // No body - default to publish (matching Express API behavior)
    }

    // Update quiz publish status (RLS will ensure user can modify)
    const { data: quiz, error } = await supabase
      .from("quizzes")
      .update({
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quizId)
      .select()
      .single();

    if (error) {
      console.error("Error publishing quiz:", error);
      return errorResponse("Failed to update quiz publish status", error.message, 500);
    }

    if (!quiz) {
      return notFoundResponse("Quiz not found");
    }

    return successResponse(quiz as Quiz);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});

