// Edge Function: Get Quiz Progress
// Matches behavior of existing Express API GET /api/quiz-progress/:quizId

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse } from "../../_shared/response.ts";

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

    if (!quizId || quizId === "get-progress") {
      return errorResponse("Quiz ID is required", undefined, 400);
    }

    // Get progress for this user and quiz
    const { data: progress, error } = await supabase
      .from("quiz_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("quiz_id", quizId)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
      console.error("Error fetching quiz progress:", error);
      return errorResponse("Failed to fetch quiz progress", error.message, 500);
    }

    // Return progress or null (matching Express API behavior)
    return successResponse(progress || null);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});

