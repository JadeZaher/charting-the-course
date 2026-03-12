// Edge Function: ethos/get
// Returns full ETHOS detail + members with profiles + viewer alignment score
// Path: /functions/v1/ethos/get/:slug

import { createSupabaseClient, getAuthUser, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from "../../_shared/response.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseClient();
    const user = await getAuthUser(req, supabase);
    if (!user) return unauthorizedResponse("Authentication required");

    // Extract slug from path: /functions/v1/ethos/get/my-ethos-slug
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const slug = pathParts[pathParts.length - 1];

    if (!slug || slug === "get") {
      return errorResponse("ETHOS slug is required", undefined, 400);
    }

    // Fetch ETHOS by slug
    const { data: ethos, error: ethosError } = await supabase
      .from("ethos")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (ethosError || !ethos) {
      return notFoundResponse("ETHOS not found");
    }

    // Fetch members with profile data
    const { data: memberRows } = await supabase
      .from("ethos_members")
      .select(`
        user_id,
        role_in_ethos,
        member_type,
        joined_at,
        profiles!inner(
          id,
          username,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq("ethos_id", ethos.id)
      .order("joined_at");

    const members = (memberRows || []).map((m: any) => {
      const profile = m.profiles;
      const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.username || "Member";
      return {
        user_id: m.user_id,
        username: profile?.username || "",
        display_name: displayName,
        avatar_url: profile?.avatar_url,
        role_in_ethos: m.role_in_ethos,
        member_type: m.member_type,
        profile_url: `/users/${profile?.username || m.user_id}`,
      };
    });

    // Get viewer's profile tiles for alignment scoring
    const { data: viewerTiles } = await supabase
      .from("profile_tiles")
      .select("tile_type, dimension, content, title")
      .eq("user_id", user.id)
      .eq("is_visible", true);

    // Aggregate member tiles for ethos-level alignment
    let viewer_alignment: number | null = null;
    if (viewerTiles && viewerTiles.length > 0 && members.length > 0) {
      // Simple sector-based alignment score
      const viewerDimensions = new Set(
        (viewerTiles || []).map((t: any) => t.dimension?.toLowerCase()).filter(Boolean)
      );
      const sector = ethos.sector?.toLowerCase() || "";
      const sectorMatch = viewerDimensions.has(sector) ||
        [...viewerDimensions].some(d => sector.includes(d) || d.includes(sector));
      viewer_alignment = sectorMatch
        ? Math.min(100, 50 + viewerTiles.length * 5)
        : Math.max(0, viewerTiles.length * 5);
    }

    // Get parent ETHOS if exists
    let parent_ethos = null;
    if (ethos.parent_ethos_id) {
      const { data: parent } = await supabase
        .from("ethos")
        .select("id, slug, name, tagline, sector, ethos_type, image_url")
        .eq("id", ethos.parent_ethos_id)
        .single();
      parent_ethos = parent;
    }

    return successResponse({
      ethos: {
        ...ethos,
        member_count: members.length,
        member_avatars: members.slice(0, 5).map((m: any) => m.avatar_url).filter(Boolean),
        parent_ethos,
      },
      members,
      viewer_alignment,
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});
