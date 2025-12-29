// Edge Function: Delete Quiz
// Matches behavior of existing Express API DELETE /api/quizzes/:id

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, isAdmin, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from "../../_shared/response.ts";

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

    // Check if user is admin (only admins can delete quizzes, matching Express API)
    const userIsAdmin = await isAdmin(user.id, supabase);
    if (!userIsAdmin) {
      return forbiddenResponse("Admin access required");
    }

    // Get quiz_id from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const quizId = pathParts[pathParts.length - 1];

    if (!quizId || quizId === "delete-quiz") {
      return errorResponse("Quiz ID is required", undefined, 400);
    }

    // Check if quiz exists
    const { data: existingQuiz, error: checkError } = await supabase
      .from("quizzes")
      .select("id")
      .eq("id", quizId)
      .single();

    if (checkError || !existingQuiz) {
      return notFoundResponse("Quiz not found");
    }

    // Delete quiz (cascade will handle results, progress, assignments)
    const { error: deleteError } = await supabase
      .from("quizzes")
      .delete()
      .eq("id", quizId);

    if (deleteError) {
      console.error("Error deleting quiz:", deleteError);
      return errorResponse("Failed to delete quiz", deleteError.message, 500);
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

