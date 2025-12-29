// Edge Function: Assign Quiz to Users
// Matches behavior of existing Express API for quiz assignments

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, isAdminOrFacilitator, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from "../../_shared/response.ts";
import type { CreateQuizAssignmentRequest, QuizAssignment } from "../../_shared/types.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Validation schema for quiz assignment
const assignQuizSchema = z.object({
  quiz_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  team_id: z.string().uuid().optional(),
  due_date: z.string().datetime().optional().nullable(),
}).refine(
  (data) => data.user_id || data.team_id,
  { message: "Either user_id or team_id must be provided" }
);

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

    // Parse and validate request body
    const body: CreateQuizAssignmentRequest = await req.json();
    const validationResult = assignQuizSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        "Invalid assignment data",
        validationResult.error.errors,
        400
      );
    }

    const { quiz_id, user_id, team_id, due_date } = validationResult.data;

    // Verify quiz exists and user can modify it
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id, created_by")
      .eq("id", quiz_id)
      .single();

    if (quizError || !quiz) {
      return notFoundResponse("Quiz not found");
    }

    // Create assignment (RLS will ensure user can insert)
    const { data: assignment, error: assignError } = await supabase
      .from("quiz_assignments")
      .insert({
        quiz_id,
        user_id: user_id || null,
        team_id: team_id || null,
        assigned_by: user.id,
        due_date: due_date ? new Date(due_date).toISOString() : null,
      })
      .select()
      .single();

    if (assignError) {
      console.error("Error creating assignment:", assignError);
      return errorResponse("Failed to create assignment", assignError.message, 500);
    }

    return successResponse(assignment as QuizAssignment, 201);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});

