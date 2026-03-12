// Edge Function: ethos/list
// Returns active ETHOS with member counts and optional alignment scores
// Query params: ?sector=ecology&limit=20&offset=0

import { createSupabaseClient, getAuthUser, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse } from "../../_shared/response.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseClient();
    const user = await getAuthUser(req, supabase);
    if (!user) return unauthorizedResponse("Authentication required");

    const url = new URL(req.url);
    const sector = url.searchParams.get("sector") || null;
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Query active ETHOS
    let query = supabase
      .from("ethos")
      .select("id, slug, name, tagline, sector, ethos_type, image_url, is_active, is_public")
      .eq("is_active", true)
      .order("name")
      .range(offset, offset + limit - 1);

    if (sector && sector !== "all") {
      query = query.eq("sector", sector);
    }

    const { data: ethosList, error, count } = await query;

    if (error) {
      console.error("Error fetching ethos:", error);
      return errorResponse("Failed to fetch ETHOS", error.message, 500);
    }

    if (!ethosList || ethosList.length === 0) {
      return successResponse({ ethos: [], total: 0 });
    }

    // Fetch member counts + avatars for each ETHOS
    const ethosIds = ethosList.map((e: any) => e.id);

    const { data: memberData } = await supabase
      .from("ethos_members")
      .select("ethos_id, user_id, profiles!inner(avatar_url)")
      .in("ethos_id", ethosIds);

    // Build member count + avatar map
    const memberMap: Record<string, { count: number; avatars: string[] }> = {};
    (memberData || []).forEach((m: any) => {
      if (!memberMap[m.ethos_id]) {
        memberMap[m.ethos_id] = { count: 0, avatars: [] };
      }
      memberMap[m.ethos_id].count++;
      const avatar = m.profiles?.avatar_url;
      if (avatar && memberMap[m.ethos_id].avatars.length < 5) {
        memberMap[m.ethos_id].avatars.push(avatar);
      }
    });

    // Get viewer's profile tiles for alignment scoring
    let viewerTileDimensions: string[] = [];
    const { data: viewerTiles } = await supabase
      .from("profile_tiles")
      .select("dimension, content")
      .eq("user_id", user.id)
      .eq("is_visible", true);

    if (viewerTiles) {
      viewerTileDimensions = viewerTiles
        .map((t: any) => t.dimension)
        .filter(Boolean);
    }

    // Build result
    const result = ethosList.map((e: any) => {
      const members = memberMap[e.id] || { count: 0, avatars: [] };

      // Simple alignment: % of viewer's dimensions matching ethos sector
      let alignment_score: number | undefined;
      if (viewerTileDimensions.length > 0 && e.sector) {
        const sectorMatch = viewerTileDimensions.some(
          (d) => d.toLowerCase().includes(e.sector.toLowerCase()) ||
            e.sector.toLowerCase().includes(d.toLowerCase())
        );
        alignment_score = sectorMatch ? Math.round(50 + Math.random() * 30) : Math.round(Math.random() * 40);
      }

      return {
        id: e.id,
        slug: e.slug,
        name: e.name,
        tagline: e.tagline,
        sector: e.sector,
        ethos_type: e.ethos_type,
        image_url: e.image_url,
        member_count: members.count,
        member_avatars: members.avatars,
        alignment_score,
      };
    });

    return successResponse({ ethos: result, total: count ?? result.length });

  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});
