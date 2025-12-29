// Edge Function: Delete Quiz Progress
// Matches behavior of existing Express API DELETE /api/quiz-progress/:quizId

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { errorResponse, unauthorizedResponse, notFoundResponse } from "../../_shared/response.ts";

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

    if (!quizId || quizId === "delete-progress") {
      return errorResponse("Quiz ID is required", undefined, 400);
    }

    // Verify quiz exists
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id")
      .eq("id", quizId)
      .single();

    if (quizError || !quiz) {
      return notFoundResponse("Quiz not found");
    }

    // Delete progress (RLS will ensure user can only delete their own)
    const { error: deleteError } = await supabase
      .from("quiz_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("quiz_id", quizId);

    if (deleteError) {
      console.error("Error deleting quiz progress:", deleteError);
      return errorResponse("Failed to delete quiz progress", deleteError.message, 500);
    }

    // Return 204 No Content (matching Express API)
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
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

