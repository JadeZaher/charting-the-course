// Edge Function: Get Assigned Quizzes for User
// Matches behavior of existing Express API GET /api/quiz-assignments/user

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse } from "../../_shared/response.ts";

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Initialize Supabase client
    const supabase = createSupabaseClient();

    // Get authenticated user
    const user = await getAuthUser(req, supabase);
    if (!user) {
      return unauthorizedResponse("Authentication required");
    }

    // Get assignments for this user
    const { data: userAssignments, error: userAssignError } = await supabase
      .from("quiz_assignments")
      .select(`
        *,
        quizzes (
          id,
          title,
          description,
          mode,
          time_limit,
          passing_score,
          allow_retakes,
          visibility,
          is_published,
          created_at
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (userAssignError) {
      console.error("Error fetching user assignments:", userAssignError);
      return errorResponse("Failed to fetch user assignments", userAssignError.message, 500);
    }

    // Get team-based assignments
    // First get user's teams
    const { data: userTeams } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id);

    let teamAssignments: any[] = [];
    if (userTeams && userTeams.length > 0) {
      const teamIds = userTeams.map(t => t.team_id);
      const { data: teamAssigns, error: teamAssignError } = await supabase
        .from("quiz_assignments")
        .select(`
          *,
          quizzes (
            id,
            title,
            description,
            mode,
            time_limit,
            passing_score,
            allow_retakes,
            visibility,
            is_published,
            created_at
          )
        `)
        .in("team_id", teamIds)
        .order("created_at", { ascending: false });

      if (!teamAssignError && teamAssigns) {
        teamAssignments = teamAssigns;
      }
    }

    // Combine and deduplicate by quiz_id
    const allAssignments = [...(userAssignments || []), ...teamAssignments];
    const uniqueAssignments = Array.from(
      new Map(allAssignments.map(a => [a.quiz_id, a])).values()
    );

    // Sort by created_at descending
    uniqueAssignments.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return successResponse({ assignments: uniqueAssignments });
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});

