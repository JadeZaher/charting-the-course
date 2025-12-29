// Edge Function: Remove Quiz Assignment
// Matches behavior of existing Express API DELETE /api/quiz-assignments/:id

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

    // Get assignment_id from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const assignmentId = pathParts[pathParts.length - 1];

    if (!assignmentId || assignmentId === "remove-assignment") {
      return errorResponse("Assignment ID is required", undefined, 400);
    }

    // Check if assignment exists
    const { data: existingAssignment, error: checkError } = await supabase
      .from("quiz_assignments")
      .select("id")
      .eq("id", assignmentId)
      .single();

    if (checkError || !existingAssignment) {
      return notFoundResponse("Assignment not found");
    }

    // Delete assignment (RLS will ensure user can delete)
    const { error: deleteError } = await supabase
      .from("quiz_assignments")
      .delete()
      .eq("id", assignmentId);

    if (deleteError) {
      console.error("Error removing assignment:", deleteError);
      return errorResponse("Failed to remove assignment", deleteError.message, 500);
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

