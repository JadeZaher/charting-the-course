// Edge Function: Update Badge Definition
// Admin/Facilitator only - updates an existing badge definition

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, isAdminOrFacilitator, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from "../../_shared/response.ts";
import type { BadgeDefinition } from "../../_shared/types.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Validation schema (all fields optional for partial update)
const updateBadgeSchema = z.object({
  badge_name: z.string().min(1).max(200).optional(),
  badge_description: z.string().max(1000).optional().nullable(),
  badge_category: z.string().max(100).optional().nullable(),
  badge_icon: z.string().max(500).optional().nullable(),
  badge_color: z.string().max(20).optional().nullable(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  display_order: z.number().int().optional(),
  conditions: z.object({
    type: z.enum(["tag_match", "quiz_score", "quiz_count", "tag_count", "custom"]),
    required_tags: z.array(z.string()).optional(),
    any_of_tags: z.array(z.string()).optional(),
    tag_value_match: z.object({
      tag_key: z.string(),
      value: z.string(),
    }).optional(),
    min_quiz_score: z.number().min(0).max(100).optional(),
    min_quiz_count: z.number().int().min(0).optional(),
    quiz_ids: z.array(z.string().uuid()).optional(),
    min_tag_count: z.object({
      category: z.string(),
      count: z.number().int().min(0),
    }).optional(),
    min_streak: z.number().int().min(0).optional(),
    description: z.string().optional(),
  }).optional(),
  xp_reward: z.number().int().min(0).optional(),
}).partial();

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

    // Check if user is admin or facilitator
    const userIsAdminOrFacilitator = await isAdminOrFacilitator(user.id, supabase);
    if (!userIsAdminOrFacilitator) {
      return forbiddenResponse("Admin or facilitator access required");
    }

    // Get badge_id from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const badgeId = pathParts[pathParts.length - 1];

    if (!badgeId || badgeId === "update-badge") {
      return errorResponse("Badge ID is required", undefined, 400);
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = updateBadgeSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        "Invalid badge data",
        validationResult.error.errors,
        400
      );
    }

    const updates = validationResult.data;

    // Update badge definition
    const { data: badge, error } = await supabase
      .from("badge_definitions")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", badgeId)
      .select()
      .single();

    if (error) {
      console.error("Error updating badge:", error);
      return errorResponse("Failed to update badge", error.message, 500);
    }

    if (!badge) {
      return notFoundResponse("Badge not found");
    }

    return successResponse(badge as BadgeDefinition);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});

