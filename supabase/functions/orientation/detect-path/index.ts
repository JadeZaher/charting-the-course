// Edge Function: orientation/detect-path
// Determines whether user is on 'ready' or 'explorer' orientation path
// Body: { ethos_id: string }

import { createSupabaseClient, getAuthUser, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse } from "../../_shared/response.ts";

interface DetectionResult {
  path: "ready" | "explorer";
  confidence: number;
  signals: string[];
}

async function checkSolutionAssignment(
  userId: string,
  supabase: any
): Promise<{ assigned: boolean; placeholderMode: boolean }> {
  // Read the designated survey reference from app_settings
  const { data: setting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'primary_solution_survey')
    .single();

  const surveyId = setting?.value?.survey_id;

  // No survey bound yet — default ALLOW (placeholder mode)
  if (!surveyId) return { assigned: true, placeholderMode: true };

  // Survey is bound — check if this user has completed it
  const { data: result } = await supabase
    .from('quiz_results')
    .select('id')
    .eq('user_id', userId)
    .eq('quiz_id', surveyId)
    .single();

  return { assigned: !!result, placeholderMode: false };
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseClient();
    const user = await getAuthUser(req, supabase);
    if (!user) return unauthorizedResponse("Authentication required");

    const { ethos_id } = await req.json();

    const assignmentCheck = await checkSolutionAssignment(user.id, supabase);

    // Fetch user's tiles
    const { data: userTiles } = await supabase
      .from("profile_tiles")
      .select("dimension, tile_type, content")
      .eq("user_id", user.id)
      .eq("is_visible", true);

    // Fetch user's team assignments (teams they belong to)
    const { data: teamAssignments } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id);

    // Fetch existing ethos membership
    const { data: ethosMembership } = ethos_id
      ? await supabase
          .from("ethos_members")
          .select("id, member_type")
          .eq("ethos_id", ethos_id)
          .eq("user_id", user.id)
          .maybeSingle()
      : { data: null };

    const result = detectPath(userTiles || [], teamAssignments || [], ethosMembership);

    return successResponse({
      ...result,
      assignment: {
        assigned: assignmentCheck.assigned,
        placeholder_mode: assignmentCheck.placeholderMode,
      },
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

function detectPath(
  userTiles: any[],
  teamAssignments: any[],
  ethosMembership: any
): DetectionResult {
  // Signal 1: Already a member of this ETHOS as steward/founder
  if (ethosMembership && ["steward", "founder"].includes(ethosMembership.member_type)) {
    return { path: "ready", confidence: 95, signals: ["ethos_steward"] };
  }

  // Signal 2: Has team assignment
  if (teamAssignments.length > 0) {
    return { path: "ready", confidence: 90, signals: ["team_assigned"] };
  }

  // Signal 3: Rich profile (5+ tiles across 3+ dimensions)
  const dimensions = new Set(
    userTiles.map((t: any) => t.dimension).filter(Boolean)
  );
  if (userTiles.length >= 5 && dimensions.size >= 3) {
    return { path: "ready", confidence: 60, signals: ["rich_profile"] };
  }

  // Default: explorer path
  return { path: "explorer", confidence: 100, signals: ["default"] };
}
