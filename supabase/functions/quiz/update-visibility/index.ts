// Edge Function: Update Quiz Visibility
// Matches behavior of updating quiz visibility field

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, isAdminOrFacilitator, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from "../../_shared/response.ts";
import type { Quiz } from "../../_shared/types.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Validation schema for visibility update
const updateVisibilitySchema = z.object({
  visibility: z.enum(["public", "private", "team", "assigned"]),
  team_id: z.string().uuid().optional().nullable(),
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

    if (!quizId || quizId === "update-visibility") {
      return errorResponse("Quiz ID is required", undefined, 400);
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = updateVisibilitySchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        "Invalid visibility data",
        validationResult.error.errors,
        400
      );
    }

    const { visibility, team_id } = validationResult.data;

    // Update quiz visibility (RLS will ensure user can modify)
    const { data: quiz, error } = await supabase
      .from("quizzes")
      .update({
        visibility,
        team_id: team_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quizId)
      .select()
      .single();

    if (error) {
      console.error("Error updating quiz visibility:", error);
      return errorResponse("Failed to update quiz visibility", error.message, 500);
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

