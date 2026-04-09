// Edge Function: participants/update-contact
// POST { ethos_id, phone?, email? } — upserts participant_contacts for calling user

import { createSupabaseClient, createServiceRoleClient, getAuthUser, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "../../_shared/response.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseClient();
    const user = await getAuthUser(req, supabase);
    if (!user) return unauthorizedResponse("Authentication required");

    if (req.method !== "POST") {
      return errorResponse("Method not allowed", undefined, 405);
    }

    const body = await req.json();
    const { ethos_id, phone, email } = body;

    if (!ethos_id) {
      return errorResponse("ethos_id is required", undefined, 400);
    }

    // Verify caller has ethos_user_access for this ethos_id
    const { data: accessCheck } = await supabase
      .from("ethos_user_access")
      .select("id")
      .eq("user_id", user.id)
      .eq("ethos_id", ethos_id)
      .maybeSingle();

    if (!accessCheck) {
      return forbiddenResponse("Access not granted for this ETHOS");
    }

    const adminSupabase = createServiceRoleClient();

    const { error } = await adminSupabase
      .from("participant_contacts")
      .upsert(
        {
          user_id: user.id,
          ethos_id,
          phone: phone ?? null,
          email: email ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,ethos_id" }
      );

    if (error) {
      console.error("Error upserting participant_contacts:", error);
      return errorResponse("Failed to update contact info", error.message, 500);
    }

    return successResponse({ success: true });

  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});
