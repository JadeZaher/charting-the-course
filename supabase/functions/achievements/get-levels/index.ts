// Edge Function: Get Level Definitions
// Returns all level definitions for display

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse } from "../../_shared/response.ts";
import type { LevelDefinition } from "../../_shared/types.ts";

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Initialize Supabase client
    const supabase = createSupabaseClient();

    // Get all level definitions
    const { data: levels, error } = await supabase
      .from("level_definitions")
      .select("*")
      .order("level", { ascending: true });

    if (error) {
      console.error("Error fetching levels:", error);
      return errorResponse("Failed to fetch levels", error.message, 500);
    }

    return successResponse({
      levels: levels as LevelDefinition[],
      total: levels?.length || 0,
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

