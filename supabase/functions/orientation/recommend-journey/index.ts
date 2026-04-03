// Edge Function: orientation/recommend-journey
// Matches user to best journey_map for a given ethos
// Body: { ethos_id: string }

import { createSupabaseClient, getAuthUser, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from "../../_shared/response.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseClient();
    const user = await getAuthUser(req, supabase);
    if (!user) return unauthorizedResponse("Authentication required");

    const { ethos_id } = await req.json();
    if (!ethos_id) return errorResponse("ethos_id is required", undefined, 400);

    // Get active journey maps for this ethos (+ default maps)
    const { data: maps, error } = await supabase
      .from("journey_maps")
      .select("*")
      .eq("is_active", true)
      .or(`ethos_id.eq.${ethos_id},is_default.eq.true`)
      .order("is_default");

    if (error) {
      return errorResponse("Failed to fetch journey maps", error.message, 500);
    }

    if (!maps || maps.length === 0) {
      return notFoundResponse("No journey maps found for this ETHOS");
    }

    // Get user's dimensions + tags for scoring
    const { data: userTags } = await supabase
      .from("user_tags")
      .select("tag_key, tag_value")
      .eq("user_id", user.id);

    const { data: userTiles } = await supabase
      .from("profile_tiles")
      .select("dimension")
      .eq("user_id", user.id)
      .eq("is_visible", true);

    const userDimSet = new Set([
      ...(userTags || []).map((t: any) => t.tag_value?.toLowerCase()).filter(Boolean),
      ...(userTiles || []).map((t: any) => t.dimension?.toLowerCase()).filter(Boolean),
    ]);

    // Score each map
    const scoredMaps = maps.map((map: any) => {
      const mapSectors: string[] = (map.sector_alignment || []).map((s: string) => s.toLowerCase());
      const mapRoles: string[] = (map.role_types || []).map((r: string) => r.toLowerCase());

      const matchedSectors = mapSectors.filter(s => userDimSet.has(s));
      const matchedRoles = mapRoles.filter(r => userDimSet.has(r));

      const score = matchedSectors.length * 2 + matchedRoles.length;
      const misalignmentFlags: string[] = [];

      if (mapSectors.length > 0 && matchedSectors.length === 0) {
        misalignmentFlags.push(`Built for ${mapSectors.join(", ")} focus areas`);
      }
      if (mapRoles.length > 0 && matchedRoles.length === 0) {
        misalignmentFlags.push(`Designed for ${mapRoles.join(", ")} roles`);
      }

      return { map, score, misalignment_flags: misalignmentFlags };
    });

    // Sort by score descending, then prefer ethos-specific over defaults
    scoredMaps.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Prefer ethos-specific maps over defaults
      if (a.map.ethos_id === ethos_id && b.map.ethos_id !== ethos_id) return -1;
      if (b.map.ethos_id === ethos_id && a.map.ethos_id !== ethos_id) return 1;
      return 0;
    });

    const [best, ...rest] = scoredMaps;

    return successResponse({
      recommended: best.map,
      alternatives: rest.map(r => r.map),
      misalignment_flags: best.misalignment_flags,
      score: best.score,
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
