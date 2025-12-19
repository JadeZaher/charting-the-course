// Edge Function: Update Quiz
// Matches behavior of existing Express API PATCH /api/quizzes/:id

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, isAdminOrFacilitator, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from "../../_shared/response.ts";
import type { CreateQuizRequest, Quiz } from "../../_shared/types.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Validation schema for quiz updates (all fields optional)
const updateQuizSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  course_id: z.string().uuid().optional().nullable(),
  mode: z.enum(["take", "upload", "both"]).optional(),
  survey_json: z.record(z.unknown()).optional(),
  time_limit: z.number().int().positive().optional().nullable(),
  passing_score: z.number().int().min(0).max(100).optional().nullable(),
  allow_retakes: z.boolean().optional(),
  visibility: z.enum(["public", "private", "team", "assigned"]).optional(),
  team_id: z.string().uuid().optional().nullable(),
}).partial();

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

    if (!quizId || quizId === "update-quiz") {
      return errorResponse("Quiz ID is required", undefined, 400);
    }

    // Parse and validate request body
    const body: Partial<CreateQuizRequest> = await req.json();
    const validationResult = updateQuizSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        "Invalid quiz data",
        validationResult.error.errors,
        400
      );
    }

    const updates = validationResult.data;

    // Server-side field whitelisting - ignore protected fields (matching Express API)
    const { created_by, is_published, ...allowedUpdates } = updates as any;

    // Update quiz (RLS will ensure user can modify)
    const { data: quiz, error } = await supabase
      .from("quizzes")
      .update({
        ...allowedUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quizId)
      .select()
      .single();

    if (error) {
      console.error("Error updating quiz:", error);
      return errorResponse("Failed to update quiz", error.message, 500);
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

