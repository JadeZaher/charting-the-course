// Edge Function: Update App Setting
// Admin/Facilitator only — upserts a key/value pair in app_settings

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, createServiceRoleClient, getAuthUser, isAdminOrFacilitator, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "../../_shared/response.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const updateSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.record(z.unknown()),
});

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseClient();

    const user = await getAuthUser(req, supabase);
    if (!user) {
      return unauthorizedResponse("Authentication required");
    }

    const userIsAdminOrFacilitator = await isAdminOrFacilitator(user.id, supabase);
    if (!userIsAdminOrFacilitator) {
      return forbiddenResponse("Admin or facilitator access required");
    }

    const body = await req.json();
    const validationResult = updateSettingSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        "Invalid setting data",
        validationResult.error.errors,
        400
      );
    }

    const { key, value } = validationResult.data;

    const adminSupabase = createServiceRoleClient();

    const { data, error } = await adminSupabase
      .from("app_settings")
      .upsert(
        {
          key,
          value,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      )
      .select()
      .single();

    if (error) {
      console.error("Error updating setting:", error);
      return errorResponse("Failed to update setting", error.message, 500);
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
