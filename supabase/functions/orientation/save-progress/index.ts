// Edge Function: orientation/save-progress
// Upserts user_journey_progress for the authenticated user
// Body: { ethos_id, journey_map_id, current_step, step_key?, step_response?, status? }

import { createSupabaseClient, getAuthUser, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse } from "../../_shared/response.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseClient();
    const user = await getAuthUser(req, supabase);
    if (!user) return unauthorizedResponse("Authentication required");

    const body = await req.json();
    const {
      ethos_id,
      journey_map_id,
      current_step,
      step_key,
      step_response,
      status,
      orientation_path,
      was_recommended,
    } = body;

    if (!ethos_id || !journey_map_id) {
      return errorResponse("ethos_id and journey_map_id are required", undefined, 400);
    }

    // Check if record exists
    const { data: existing } = await supabase
      .from("user_journey_progress")
      .select("id, completed_steps, step_responses, status")
      .eq("user_id", user.id)
      .eq("ethos_id", ethos_id)
      .maybeSingle();

    const now = new Date().toISOString();
    const updatedStepResponses = {
      ...(existing?.step_responses || {}),
      ...(step_key && step_response !== undefined ? { [step_key]: step_response } : {}),
    };

    // Build completed_steps array
    let completedSteps: number[] = existing?.completed_steps || [];
    if (typeof current_step === "number" && current_step > 0) {
      const prevStep = current_step - 1;
      if (!completedSteps.includes(prevStep)) {
        completedSteps = [...completedSteps, prevStep];
      }
    }

    const upsertData: any = {
      user_id: user.id,
      ethos_id,
      journey_map_id,
      current_step: current_step ?? existing?.current_step ?? 0,
      completed_steps: completedSteps,
      step_responses: updatedStepResponses,
      updated_at: now,
    };

    if (status) upsertData.status = status;
    if (orientation_path) upsertData.orientation_path = orientation_path;
    if (was_recommended !== undefined) upsertData.was_recommended = was_recommended;

    // Set started_at on first save
    if (!existing) {
      upsertData.started_at = now;
      upsertData.status = upsertData.status || "in_progress";
    }

    // Set completed_at if status is complete
    if (status === "complete") {
      upsertData.completed_at = now;
    }

    const { data, error } = await supabase
      .from("user_journey_progress")
      .upsert(upsertData, { onConflict: "user_id,ethos_id" })
      .select()
      .single();

    if (error) {
      return errorResponse("Failed to save progress", error.message, 500);
    }

    // If complete, also update profiles.orientation_status
    if (status === "complete") {
      await supabase
        .from("profiles")
        .update({ orientation_status: "complete", updated_at: now })
        .eq("id", user.id);
    }

    return successResponse(data);

  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});
