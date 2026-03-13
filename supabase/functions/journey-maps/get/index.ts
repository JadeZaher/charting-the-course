// Edge Function: journey-maps/get
// GET — Single journey map by ID with full content_sequence.
// Query params: ?id=uuid

import { createSupabaseClient, getAuthUser, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from "../../_shared/response.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseClient();
    const user = await getAuthUser(req, supabase);
    if (!user) return unauthorizedResponse("Authentication required");

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return errorResponse("id is required", undefined, 400);
    }

    const { data, error } = await supabase
      .from("journey_maps")
      .select("*, ethos(id, name, slug)")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching journey map:", error);
      return errorResponse("Failed to fetch journey map", error.message, 500);
    }

    if (!data) return notFoundResponse("Journey map not found");

    return successResponse(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse("Internal server error", error instanceof Error ? error.message : String(error), 500);
  }
});
