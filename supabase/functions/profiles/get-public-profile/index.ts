// Edge Function: Get Public Profile
// Matches behavior of existing Express API GET /api/profile/:userId endpoint

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, notFoundResponse } from "../../_shared/response.ts";
import type { Profile } from "../../_shared/types.ts";

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Initialize Supabase client
    const supabase = createSupabaseClient();

    // Get authenticated user (optional - for owner checks)
    const currentUser = await getAuthUser(req, supabase);
    
    // Get user_id from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const userId = pathParts[pathParts.length - 1];

    if (!userId || userId === "get-public-profile") {
      return errorResponse("User ID is required", undefined, 400);
    }

    // Check if requester is the owner
    const isOwner = currentUser && currentUser.id === userId;

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return notFoundResponse("Profile not found");
    }

    // If not the owner and profile is not public, return minimal data
    if (!isOwner && profile.profile_visibility !== "public") {
      // Return minimal public data (matching existing API behavior)
      return successResponse({
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        avatar_url: profile.avatar_url,
        profile_visibility: profile.profile_visibility,
      });
    }

    // Get user's role (if owner or admin)
    let role = null;
    if (isOwner || currentUser) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select(`
          roles!inner (
            key,
            name
          )
        `)
        .eq("user_id", userId)
        .single();

      if (roleData?.roles) {
        const rolesArray = Array.isArray(roleData.roles) ? roleData.roles : [roleData.roles];
        role = rolesArray[0]?.key || null;
      }
    }

    // Get privacy settings (if exists - from existing user_privacy_settings table)
    // Note: This will be migrated in later phases
    const { data: privacySettings } = await supabase
      .from("user_privacy_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Get profile data (if exists - from existing user_profile_data table)
    const { data: profileData } = await supabase
      .from("user_profile_data")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Get badges (if privacy allows)
    let badges = [];
    if (isOwner || privacySettings?.show_badges || profile.profile_visibility === "public") {
      const { data: badgesData } = await supabase
        .from("user_badges")
        .select("*")
        .eq("user_id", userId);
      badges = badgesData || [];
    }

    // Get tags (if privacy allows)
    let tags = [];
    if (isOwner || privacySettings?.show_tags || profile.profile_visibility === "public") {
      const { data: tagsData } = await supabase
        .from("user_tags")
        .select("*")
        .eq("user_id", userId);
      tags = tagsData || [];
    }

    // Return full profile data (matching existing API response structure)
    return successResponse({
      user: {
        id: profile.id,
        email: currentUser?.email || null, // Only show email to owner
        first_name: profile.first_name,
        last_name: profile.last_name,
        username: profile.username,
        bio: profile.bio,
        profile_image_url: profile.avatar_url,
        role: role,
        location_data: profile.location_data,
        contact_data: profile.contact_data,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        last_login_at: profile.last_login_at,
      },
      profileData: profileData || null,
      badges: badges,
      tags: tags,
      privacy: privacySettings || null,
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

