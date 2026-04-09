// Edge Function: ethos/add-member
// POST — Upsert a user into ethos_members. Requires canManageContent.

import { createSupabaseClient, createServiceRoleClient, getAuthUser, isAdminOrFacilitator, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "../../_shared/response.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseClient();
    const user = await getAuthUser(req, supabase);
    if (!user) return unauthorizedResponse("Authentication required");

    const canManage = await isAdminOrFacilitator(user.id, supabase);
    if (!canManage) return forbiddenResponse("Admin or facilitator access required");

    const body = await req.json();
    const { ethos_id, user_id, role_in_ethos, member_type } = body;

    if (!ethos_id || !user_id) {
      return errorResponse("ethos_id and user_id are required", undefined, 400);
    }

    const adminSupabase = createServiceRoleClient();

    const { data, error } = await adminSupabase
      .from("ethos_members")
      .upsert(
        {
          ethos_id,
          user_id,
          role_in_ethos: role_in_ethos || null,
          member_type: member_type || "member",
        },
        { onConflict: "ethos_id,user_id" }
      )
      .select("*, profiles(username, first_name, last_name, avatar_url)")
      .maybeSingle();

    if (error) {
      console.error("Error adding member:", error);
      return errorResponse("Failed to add member", error.message, 500);
    }

    // data may be null if upsert found existing row with no changes — still a success
    return successResponse(data ?? { ethos_id, user_id, role_in_ethos, member_type }, 201);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse("Internal server error", error instanceof Error ? error.message : String(error), 500);
  }
});
