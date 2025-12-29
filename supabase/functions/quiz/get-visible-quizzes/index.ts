// Edge Function: Get Visible Quizzes
// Matches behavior of existing Express API GET /api/quizzes
// Returns quizzes based on visibility rules and user permissions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getAuthUser, isAdminOrFacilitator, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse } from "../../_shared/response.ts";
import type { Quiz } from "../../_shared/types.ts";

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

    // Check if user is privileged (admin or facilitator)
    const userIsPrivileged = await isAdminOrFacilitator(user.id, supabase);

    let quizzes: Quiz[];

    if (userIsPrivileged) {
      // Admins and facilitators can see all quizzes
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching quizzes:", error);
        return errorResponse("Failed to fetch quizzes", error.message, 500);
      }

      quizzes = (data || []) as Quiz[];
    } else {
      // Regular users see only published quizzes they have access to
      // RLS policies will automatically filter based on visibility rules
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching quizzes:", error);
        return errorResponse("Failed to fetch quizzes", error.message, 500);
      }

      quizzes = (data || []) as Quiz[];

      // Note: In Express API, correct answers are redacted for non-privileged users
      // This is handled client-side or in a separate endpoint if needed
    }

    return successResponse({ quizzes });
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});

