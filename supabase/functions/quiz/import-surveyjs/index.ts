// Edge Function: Import Quiz from SurveyJS JSON
// Matches behavior of existing Express API POST /api/quizzes/import

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, isAdminOrFacilitator, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "../../_shared/response.ts";
import type { CreateQuizRequest, Quiz } from "../../_shared/types.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Validation schema for quiz import (same as create)
const importQuizSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  course_id: z.string().uuid().optional().nullable(),
  mode: z.enum(["take", "upload", "both"]).default("take"),
  survey_json: z.record(z.unknown()),
  time_limit: z.number().int().positive().optional().nullable(),
  passing_score: z.number().int().min(0).max(100).optional().nullable(),
  allow_retakes: z.boolean().default(true),
  visibility: z.enum(["public", "private", "team", "assigned"]).default("public"),
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

    // Parse and validate request body
    const body: CreateQuizRequest = await req.json();
    const validationResult = importQuizSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        "Invalid quiz data",
        validationResult.error.errors,
        400
      );
    }

    const quizData = validationResult.data;

    // Create quiz (imported quizzes start as unpublished, matching Express API)
    const { data: quiz, error } = await supabase
      .from("quizzes")
      .insert({
        ...quizData,
        created_by: user.id,
        is_published: false, // Imported quizzes start as unpublished
      })
      .select()
      .single();

    if (error) {
      console.error("Error importing quiz:", error);
      return errorResponse("Failed to import quiz", error.message, 500);
    }

    return successResponse(quiz as Quiz, 201);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});

