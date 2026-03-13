// Edge Function: ethos/remove-member
// POST — Remove a user from ethos_members. Requires canManageContent.

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
    const { ethos_id, user_id } = body;

    if (!ethos_id || !user_id) {
      return errorResponse("ethos_id and user_id are required", undefined, 400);
    }

    const adminSupabase = createServiceRoleClient();

    const { error } = await adminSupabase
      .from("ethos_members")
      .delete()
      .eq("ethos_id", ethos_id)
      .eq("user_id", user_id);

    if (error) {
      console.error("Error removing member:", error);
      return errorResponse("Failed to remove member", error.message, 500);
    }

    return successResponse({ removed: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse("Internal server error", error instanceof Error ? error.message : String(error), 500);
  }
});
