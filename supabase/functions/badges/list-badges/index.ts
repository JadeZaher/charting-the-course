// Edge Function: List Badge Definitions
// Returns all badge definitions (active only for non-admins)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getAuthUser, isAdmin, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse } from "../../_shared/response.ts";
import type { BadgeDefinition } from "../../_shared/types.ts";

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Initialize Supabase client
    const supabase = createSupabaseClient();

    // Get authenticated user (optional - public can see active badges)
    const user = await getAuthUser(req, supabase);

    // Check if user is admin
    const userIsAdmin = user ? await isAdmin(user.id, supabase) : false;

    // Parse query parameters
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const featuredOnly = url.searchParams.get("featured") === "true";
    const includeInactive = url.searchParams.get("include_inactive") === "true" && userIsAdmin;

    // Build query
    let query = supabase
      .from("badge_definitions")
      .select("*")
      .order("display_order", { ascending: true })
      .order("badge_name", { ascending: true });

    // Filter by active status (unless admin requesting all)
    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    // Filter by category if specified
    if (category) {
      query = query.eq("badge_category", category);
    }

    // Filter by featured if specified
    if (featuredOnly) {
      query = query.eq("is_featured", true);
    }

    const { data: badges, error } = await query;

    if (error) {
      console.error("Error fetching badges:", error);
      return errorResponse("Failed to fetch badges", error.message, 500);
    }

    // Get unique categories for filtering
    const categories = [...new Set(badges?.map((b) => b.badge_category).filter(Boolean) || [])];

    return successResponse({
      badges: badges as BadgeDefinition[],
      categories,
      total: badges?.length || 0,
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

