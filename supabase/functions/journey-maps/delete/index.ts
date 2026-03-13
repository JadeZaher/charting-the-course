// Edge Function: journey-maps/delete
// POST — Soft delete (is_active=false) or hard delete with { hard: true }.
// Requires canManageContent.

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
    const { id, hard } = body;

    if (!id) {
      return errorResponse("id is required", undefined, 400);
    }

    const adminSupabase = createServiceRoleClient();

    if (hard) {
      const { error } = await adminSupabase.from("journey_maps").delete().eq("id", id);
      if (error) {
        console.error("Error deleting journey map:", error);
        return errorResponse("Failed to delete journey map", error.message, 500);
      }
      return successResponse({ deleted: true, permanent: true });
    } else {
      const { data, error } = await adminSupabase
        .from("journey_maps")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) {
        console.error("Error archiving journey map:", error);
        return errorResponse("Failed to archive journey map", error.message, 500);
      }
      return successResponse({ deleted: true, permanent: false, map: data });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse("Internal server error", error instanceof Error ? error.message : String(error), 500);
  }
});
