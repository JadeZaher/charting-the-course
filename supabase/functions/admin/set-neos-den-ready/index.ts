// Edge Function: Admin — Set ready_for_neos_den on ctc_handoff
// POST { user_id, ready_for_neos_den } — admin only

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, isAdmin, createServiceRoleClient, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "../../_shared/response.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseClient();

    const user = await getAuthUser(req, supabase);
    if (!user) {
      return unauthorizedResponse("Authentication required");
    }

    const userIsAdmin = await isAdmin(user.id, supabase);
    if (!userIsAdmin) {
      return forbiddenResponse("Admin access required");
    }

    if (req.method !== "POST") {
      return errorResponse("Method not allowed", undefined, 405);
    }

    const body = await req.json();
    const { user_id, ready_for_neos_den } = body;

    if (!user_id || typeof ready_for_neos_den !== "boolean") {
      return errorResponse("user_id and ready_for_neos_den (boolean) are required", undefined, 400);
    }

    const adminSupabase = createServiceRoleClient();

    const { error } = await adminSupabase
      .from("ctc_handoff")
      .upsert(
        {
          user_id,
          ready_for_neos_den,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Error upserting ctc_handoff:", error);
      return errorResponse("Failed to update NEOS Den status", error.message, 500);
    }

    return successResponse({ user_id, ready_for_neos_den });

  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});
