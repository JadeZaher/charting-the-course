// Edge Function: Update User Profile
// Matches behavior of existing Express API profile update endpoints

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse } from "../../_shared/response.ts";
import type { UpdateProfileRequest } from "../../_shared/types.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Validation schema for profile updates
const updateProfileSchema = z.object({
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  username: z.string().min(3).max(50).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  location_data: z.record(z.unknown()).optional().nullable(),
  contact_data: z.record(z.unknown()).optional().nullable(),
  profile_visibility: z.enum(["public", "private", "link-only"]).optional(),
});

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

    // Parse and validate request body
    const body: UpdateProfileRequest = await req.json();
    const validationResult = updateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        "Invalid request data",
        validationResult.error.errors,
        400
      );
    }

    const updates = validationResult.data;

    // Check if username is being updated and if it's already taken
    if (updates.username !== undefined && updates.username !== null) {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", updates.username)
        .neq("id", user.id)
        .single();

      if (existingProfile) {
        return errorResponse("Username is already taken", undefined, 409);
      }
    }

    // Update profile
    const { data: profile, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return errorResponse("Failed to update profile", error.message, 500);
    }

    if (!profile) {
      return errorResponse("Profile not found", undefined, 404);
    }

    return successResponse(profile);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});

