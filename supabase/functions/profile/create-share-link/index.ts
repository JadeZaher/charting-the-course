// Edge Function: Create Profile Share Link
// Creates a shareable link for link-only profile access

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse } from "../../_shared/response.ts";
import type { CreateShareLinkRequest, ProfileShareLink } from "../../_shared/types.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Validation schema
const createShareLinkSchema = z.object({
  expires_at: z.string().datetime().optional().nullable(),
  show_badges: z.boolean().default(true),
  show_achievements: z.boolean().default(true),
  show_stats: z.boolean().default(true),
  show_quiz_history: z.boolean().default(false),
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
    let body: CreateShareLinkRequest = {};
    try {
      body = await req.json();
    } catch {
      // Use defaults
    }

    const validationResult = createShareLinkSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        "Invalid share link data",
        validationResult.error.errors,
        400
      );
    }

    const options = validationResult.data;

    // Generate share token
    const { data: shareToken } = await supabase.rpc("generate_share_token");

    if (!shareToken) {
      return errorResponse("Failed to generate share token", undefined, 500);
    }

    // Create share link
    const { data: shareLink, error } = await supabase
      .from("profile_share_links")
      .insert({
        user_id: user.id,
        share_token: shareToken,
        expires_at: options.expires_at || null,
        show_badges: options.show_badges,
        show_achievements: options.show_achievements,
        show_stats: options.show_stats,
        show_quiz_history: options.show_quiz_history,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating share link:", error);
      return errorResponse("Failed to create share link", error.message, 500);
    }

    return successResponse(shareLink as ProfileShareLink, 201);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});

