// Edge Function: ethos/create
// POST — Insert new ETHOS row. Requires canManageContent (admin/facilitator).

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
      name, slug, tagline, description, mission,
      sector, ethos_type, external_url, image_url,
      parent_ethos_id, is_public, is_active,
    } = body;

    if (!name || !slug) {
      return errorResponse("name and slug are required", undefined, 400);
    }

    const adminSupabase = createServiceRoleClient();

    const { data, error } = await adminSupabase
      .from("ethos")
      .insert({
        name,
        slug,
        tagline: tagline || null,
        description: description || null,
        mission: mission || null,
        sector: sector || null,
        ethos_type: ethos_type || "team",
        external_url: external_url || null,
        image_url: image_url || null,
        parent_ethos_id: parent_ethos_id || null,
        is_public: is_public ?? true,
        is_active: is_active ?? true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating ethos:", error);
      return errorResponse("Failed to create ETHOS", error.message, 500);
    }

    return successResponse(data, 201);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse("Internal server error", error instanceof Error ? error.message : String(error), 500);
  }
});
