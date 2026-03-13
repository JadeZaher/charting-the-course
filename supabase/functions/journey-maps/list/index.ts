// Edge Function: journey-maps/list
// GET — List journey maps. Admins see all; others see only active.
// Query params: ?ethos_id=uuid&is_active=true|false

import { createSupabaseClient, getAuthUser, isAdminOrFacilitator, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse } from "../../_shared/response.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseClient();
    const user = await getAuthUser(req, supabase);
    if (!user) return unauthorizedResponse("Authentication required");

    const url = new URL(req.url);
    const ethosId = url.searchParams.get("ethos_id");
    const isActiveParam = url.searchParams.get("is_active");

    const canManage = await isAdminOrFacilitator(user.id, supabase);

    let query = supabase
      .from("journey_maps")
      .select("id, slug, title, description, ethos_id, sector_alignment, role_types, is_active, is_default, content_sequence, created_at, updated_at, ethos(name, slug)")
      .order("title");

    if (!canManage) {
      query = query.eq("is_active", true);
    } else if (isActiveParam !== null) {
      query = query.eq("is_active", isActiveParam === "true");
    }

    if (ethosId) {
      query = query.eq("ethos_id", ethosId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching journey maps:", error);
      return errorResponse("Failed to fetch journey maps", error.message, 500);
    }

    const maps = (data || []).map((m: any) => ({
      id: m.id,
      slug: m.slug,
      title: m.title,
      description: m.description,
      ethos_id: m.ethos_id,
      ethos: m.ethos,
      sector_alignment: m.sector_alignment,
      role_types: m.role_types,
      is_active: m.is_active,
      is_default: m.is_default,
      step_count: Array.isArray(m.content_sequence) ? m.content_sequence.length : 0,
      created_at: m.created_at,
      updated_at: m.updated_at,
    }));

    return successResponse({ maps, total: maps.length });
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse("Internal server error", error instanceof Error ? error.message : String(error), 500);
  }
});
