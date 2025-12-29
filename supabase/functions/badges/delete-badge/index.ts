// Edge Function: Delete Badge Definition
// Admin only - deletes a badge definition

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, isAdmin, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from "../../_shared/response.ts";

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

    // Check if user is admin (only admins can delete)
    const userIsAdmin = await isAdmin(user.id, supabase);
    if (!userIsAdmin) {
      return forbiddenResponse("Admin access required");
    }

    // Get badge_id from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const badgeId = pathParts[pathParts.length - 1];

    if (!badgeId || badgeId === "delete-badge") {
      return errorResponse("Badge ID is required", undefined, 400);
    }

    // Check if badge exists
    const { data: existingBadge } = await supabase
      .from("badge_definitions")
      .select("id")
      .eq("id", badgeId)
      .single();

    if (!existingBadge) {
      return notFoundResponse("Badge not found");
    }

    // Delete badge definition
    const { error } = await supabase
      .from("badge_definitions")
      .delete()
      .eq("id", badgeId);

    if (error) {
      console.error("Error deleting badge:", error);
      return errorResponse("Failed to delete badge", error.message, 500);
    }

    // Return 204 No Content
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

