// Edge Function: Get App Setting
// Any authenticated user can read settings (RLS enforced)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse } from "../../_shared/response.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseClient();

    const user = await getAuthUser(req, supabase);
    if (!user) {
      return unauthorizedResponse("Authentication required");
    }

    const url = new URL(req.url);
    const key = url.searchParams.get("key");

    if (!key) {
      return errorResponse("Missing required query parameter: key", undefined, 400);
    }

    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value, updated_at")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error("Error fetching setting:", error);
      return errorResponse("Failed to fetch setting", error.message, 500);
    }

    if (!data) {
      return errorResponse(`Setting '${key}' not found`, undefined, 404);
    }

    return successResponse(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});
