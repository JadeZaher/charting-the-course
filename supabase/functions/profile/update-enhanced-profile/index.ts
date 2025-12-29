// Edge Function: Update Enhanced Profile
// Updates profile with all enhanced fields (cover, headline, social links, etc.)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from "../../_shared/response.ts";
import type { UpdateEnhancedProfileRequest, EnhancedProfile } from "../../_shared/types.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Validation schema for profile updates
const updateProfileSchema = z.object({
  first_name: z.string().max(100).optional().nullable(),
  last_name: z.string().max(100).optional().nullable(),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  cover_url: z.string().url().optional().nullable(),
  headline: z.string().max(200).optional().nullable(),
  social_links: z.record(z.string().url().or(z.string().max(0))).optional().nullable(),
  share_slug: z.string().min(3).max(50).regex(/^[a-z0-9_-]+$/).optional().nullable(),
  profile_tags: z.array(z.string().max(50)).max(20).optional().nullable(),
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
    const body: UpdateEnhancedProfileRequest = await req.json();
    const validationResult = updateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        "Invalid profile data",
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

    // Check if share_slug is being updated and if it's already taken
    if (updates.share_slug !== undefined && updates.share_slug !== null) {
      const { data: existingSlug } = await supabase
        .from("profiles")
        .select("id")
        .eq("share_slug", updates.share_slug)
        .neq("id", user.id)
        .single();

      if (existingSlug) {
        return errorResponse("Share slug is already taken", undefined, 409);
      }
    }

    // Auto-generate share_slug from username if not provided and profile is becoming public
    if (
      updates.profile_visibility === "public" &&
      !updates.share_slug
    ) {
      // Get current profile to check if slug already exists
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("share_slug, username")
        .eq("id", user.id)
        .single();

      if (!currentProfile?.share_slug) {
        const baseUsername = updates.username || currentProfile?.username || user.id;
        const { data: generatedSlug } = await supabase.rpc("generate_share_slug", {
          base_username: baseUsername,
        });
        if (generatedSlug) {
          updates.share_slug = generatedSlug;
        }
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
      return notFoundResponse("Profile not found");
    }

    return successResponse(profile as EnhancedProfile);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});

