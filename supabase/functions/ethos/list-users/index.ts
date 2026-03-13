// Edge Function: ethos/list-users
// GET — Search profiles for member assignment. Requires canManageContent.
// Query params: ?search=foo&limit=20

import { createSupabaseClient, getAuthUser, isAdminOrFacilitator, handleCors } from "../../_shared/auth.ts";
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

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);

    let query = supabase
      .from("profiles")
      .select("id, username, display_name, email, avatar_url")
      .limit(limit)
      .order("username");

    if (search) {
      query = query.or(
        `username.ilike.%${search}%,display_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching users:", error);
      return errorResponse("Failed to fetch users", error.message, 500);
    }

    return successResponse({ users: data || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse("Internal server error", error instanceof Error ? error.message : String(error), 500);
  }
});
