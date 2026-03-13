// Edge Function: journey-maps/duplicate
// POST — Clone a journey map, append "(copy)" to title and "-copy-{ts}" to slug.
// New copy starts inactive. Requires canManageContent.

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
    const { id } = body;

    if (!id) {
      return errorResponse("id is required", undefined, 400);
    }

    const adminSupabase = createServiceRoleClient();

    // Fetch the original map
    const { data: original, error: fetchError } = await adminSupabase
      .from("journey_maps")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !original) return notFoundResponse("Journey map not found");

    const newSlug = `${original.slug}-copy-${Date.now()}`;

    const { data: newMap, error: insertError } = await adminSupabase
      .from("journey_maps")
      .insert({
        title: `${original.title} (copy)`,
        slug: newSlug,
        description: original.description,
        ethos_id: original.ethos_id,
        sector_alignment: original.sector_alignment,
        role_types: original.role_types,
        min_alignment_score: original.min_alignment_score,
        content_sequence: original.content_sequence,
        exit_package: original.exit_package,
        is_active: false,
        is_default: false,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error duplicating journey map:", insertError);
      return errorResponse("Failed to duplicate journey map", insertError.message, 500);
    }

    return successResponse(newMap, 201);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse("Internal server error", error instanceof Error ? error.message : String(error), 500);
  }
});
