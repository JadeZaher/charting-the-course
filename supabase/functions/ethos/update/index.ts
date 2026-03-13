// Edge Function: ethos/update
// POST — Update ETHOS by ID. Requires canManageContent (admin/facilitator).

import { createSupabaseClient, createServiceRoleClient, getAuthUser, isAdminOrFacilitator, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from "../../_shared/response.ts";

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
    const { id, ...updates } = body;

    if (!id) {
      return errorResponse("id is required", undefined, 400);
    }

    // Remove read-only fields from updates
    delete updates.created_by;
    delete updates.created_at;

    const adminSupabase = createServiceRoleClient();

    const { data, error } = await adminSupabase
      .from("ethos")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating ethos:", error);
      return errorResponse("Failed to update ETHOS", error.message, 500);
    }

    if (!data) return notFoundResponse("ETHOS not found");

    return successResponse(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse("Internal server error", error instanceof Error ? error.message : String(error), 500);
  }
});
