// Edge Function: Bulk Assign Quiz to Users
// Assigns a quiz to multiple users or teams at once

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, isAdminOrFacilitator, createServiceRoleClient, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from "../../_shared/response.ts";
import type { QuizAssignment } from "../../_shared/types.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Validation schema for bulk assignment
const bulkAssignSchema = z.object({
  quiz_id: z.string().uuid(),
  user_ids: z.array(z.string().uuid()).optional(),
  team_ids: z.array(z.string().uuid()).optional(),
  due_date: z.string().datetime().optional().nullable(),
}).refine(
  (data) => (data.user_ids && data.user_ids.length > 0) || (data.team_ids && data.team_ids.length > 0),
  { message: "Either user_ids or team_ids must be provided with at least one entry" }
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
    const body = await req.json();
    const validationResult = bulkAssignSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        "Invalid assignment data",
        validationResult.error.errors,
        400
      );
    }

    const { quiz_id, user_ids, team_ids, due_date } = validationResult.data;

    // Verify quiz exists
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id, created_by")
      .eq("id", quiz_id)
      .single();

    if (quizError || !quiz) {
      return notFoundResponse("Quiz not found");
    }

    // Use service role for bulk inserts (to bypass RLS for batch operation)
    const adminSupabase = createServiceRoleClient();

    const assignments: QuizAssignment[] = [];
    const errors: string[] = [];

    // Create user assignments
    if (user_ids && user_ids.length > 0) {
      const userAssignments = user_ids.map((userId) => ({
        quiz_id,
        user_id: userId,
        team_id: null,
        assigned_by: user.id,
        due_date: due_date ? new Date(due_date).toISOString() : null,
      }));

      const { data: createdUserAssignments, error: userAssignError } = await adminSupabase
        .from("quiz_assignments")
        .upsert(userAssignments, {
          onConflict: "quiz_id,user_id",
          ignoreDuplicates: true,
        })
        .select();

      if (userAssignError) {
        console.error("Error creating user assignments:", userAssignError);
        errors.push(`User assignments: ${userAssignError.message}`);
      } else if (createdUserAssignments) {
        assignments.push(...(createdUserAssignments as QuizAssignment[]));
      }
    }

    // Create team assignments
    if (team_ids && team_ids.length > 0) {
      const teamAssignments = team_ids.map((teamId) => ({
        quiz_id,
        user_id: null,
        team_id: teamId,
        assigned_by: user.id,
        due_date: due_date ? new Date(due_date).toISOString() : null,
      }));

      const { data: createdTeamAssignments, error: teamAssignError } = await adminSupabase
        .from("quiz_assignments")
        .insert(teamAssignments)
        .select();

      if (teamAssignError) {
        console.error("Error creating team assignments:", teamAssignError);
        errors.push(`Team assignments: ${teamAssignError.message}`);
      } else if (createdTeamAssignments) {
        assignments.push(...(createdTeamAssignments as QuizAssignment[]));
      }
    }

    return successResponse({
      assignments,
      created_count: assignments.length,
      errors: errors.length > 0 ? errors : undefined,
    }, 201);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});

