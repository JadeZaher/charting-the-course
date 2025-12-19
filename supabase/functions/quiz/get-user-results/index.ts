// Edge Function: Get User's Quiz Results
// Matches behavior of existing Express API GET /api/quiz-results/user

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

    // Get all results for this user
    const { data: results, error } = await supabase
      .from("quiz_results")
      .select(`
        *,
        quizzes (
          id,
          title,
          description,
          passing_score
        )
      `)
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false });

    if (error) {
      console.error("Error fetching user results:", error);
      return errorResponse("Failed to fetch quiz results", error.message, 500);
    }

    return successResponse(results || []);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});

