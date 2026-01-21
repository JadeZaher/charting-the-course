// Edge Function: Create Badge Definition
// Admin/Facilitator only - creates a new badge definition

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, createServiceRoleClient, getAuthUser, isAdminOrFacilitator, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "../../_shared/response.ts";
import type { CreateBadgeDefinitionRequest, BadgeDefinition } from "../../_shared/types.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Validation schema
const createBadgeSchema = z.object({
  badge_key: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  badge_name: z.string().min(1).max(200),
  badge_description: z.string().max(1000).optional().nullable(),
  badge_category: z.string().max(100).optional().nullable(),
  badge_icon: z.string().max(500).optional().nullable(),
  badge_color: z.string().max(20).optional().nullable(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  display_order: z.number().int().default(0),
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
  }),
  xp_reward: z.number().int().min(0).default(0),
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

    // Check if user is admin or facilitator
    const userIsAdminOrFacilitator = await isAdminOrFacilitator(user.id, supabase);
    if (!userIsAdminOrFacilitator) {
      return forbiddenResponse("Admin or facilitator access required");
    }

    // Parse and validate request body
    const body: CreateBadgeDefinitionRequest = await req.json();
    const validationResult = createBadgeSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        "Invalid badge data",
        validationResult.error.errors,
        400
      );
    }

    const badgeData = validationResult.data;

    // Use service role client for database operations to bypass RLS
    // Auth has already been validated above, so this is safe
    const adminSupabase = createServiceRoleClient();

    // Check if badge_key already exists
    const { data: existingBadge } = await adminSupabase
      .from("badge_definitions")
      .select("id")
      .eq("badge_key", badgeData.badge_key)
      .maybeSingle();

    if (existingBadge) {
      return errorResponse("Badge key already exists", undefined, 409);
    }

    // Create badge definition
    const { data: badge, error } = await adminSupabase
      .from("badge_definitions")
      .insert({
        ...badgeData,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating badge:", error);
      return errorResponse("Failed to create badge", error.message, 500);
    }

    return successResponse(badge as BadgeDefinition, 201);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});

