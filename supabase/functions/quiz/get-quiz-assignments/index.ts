// Edge Function: Get Assignments for a Quiz
// Matches behavior of existing Express API GET /api/quiz-assignments/:quizId

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, isAdminOrFacilitator, corsHeaders, handleCors } from "../../_shared/auth.ts";
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

    // Check if user is admin or facilitator
    const userIsAdminOrFacilitator = await isAdminOrFacilitator(user.id, supabase);
    if (!userIsAdminOrFacilitator) {
      return forbiddenResponse("Admin or facilitator access required");
    }

    // Get quiz_id from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const quizId = pathParts[pathParts.length - 1];

    if (!quizId || quizId === "get-quiz-assignments") {
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

    // Get all assignments for this quiz
    const { data: assignments, error: assignError } = await supabase
      .from("quiz_assignments")
      .select(`
        *,
        profiles!quiz_assignments_user_id_fkey (
          id,
          first_name,
          last_name,
          username,
          avatar_url
        ),
        teams (
          id,
          name,
          description
        )
      `)
      .eq("quiz_id", quizId)
      .order("created_at", { ascending: false });

    if (assignError) {
      console.error("Error fetching assignments:", assignError);
      return errorResponse("Failed to fetch assignments", assignError.message, 500);
    }

    return successResponse({ assignments: assignments || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});

