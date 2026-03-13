// Edge Function: journey-maps/create
// POST — Insert new journey map. Requires canManageContent.

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
    const {
      title, slug, description, ethos_id,
      sector_alignment, role_types, min_alignment_score,
      content_sequence, exit_package, is_active, is_default,
    } = body;

    if (!title || !slug) {
      return errorResponse("title and slug are required", undefined, 400);
    }

    const adminSupabase = createServiceRoleClient();

    const { data, error } = await adminSupabase
      .from("journey_maps")
      .insert({
        title,
        slug,
        description: description || null,
        ethos_id: ethos_id || null,
        sector_alignment: sector_alignment || [],
        role_types: role_types || [],
        min_alignment_score: min_alignment_score || 0,
        content_sequence: content_sequence || [],
        exit_package: exit_package || {},
        is_active: is_active ?? true,
        is_default: is_default ?? false,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating journey map:", error);
      return errorResponse("Failed to create journey map", error.message, 500);
    }

    return successResponse(data, 201);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse("Internal server error", error instanceof Error ? error.message : String(error), 500);
  }
});
