// Edge Function: Admin User Management
// Matches behavior of existing Express API admin endpoints
// Supports: list users, assign roles, update user data

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthUser, isAdmin, createServiceRoleClient, corsHeaders, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "../../_shared/response.ts";
import type { AssignRoleRequest } from "../../_shared/types.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Validation schemas
const assignRoleSchema = z.object({
  user_id: z.string().uuid(),
  role_key: z.enum(["admin", "facilitator", "contributor", "viewer"]),
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

    // Check if user is admin
    const userIsAdmin = await isAdmin(user.id, supabase);
    if (!userIsAdmin) {
      return forbiddenResponse("Admin access required");
    }

    // Use service role client for admin operations
    const adminSupabase = createServiceRoleClient();

    // Handle different HTTP methods
    const method = req.method;
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";

    if (method === "GET") {
      // List all users
      if (action === "list") {
        const { data: profiles, error } = await adminSupabase
          .from("profiles")
          .select(`
            *,
            user_roles (
              roles (
                id,
                key,
                name
              )
            )
          `)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching users:", error);
          return errorResponse("Failed to fetch users", error.message, 500);
        }

        // Transform data to match existing API structure
        const users = profiles?.map((profile) => ({
          id: profile.id,
          email: null, // Email is in auth.users, not profiles
          first_name: profile.first_name,
          last_name: profile.last_name,
          username: profile.username,
          bio: profile.bio,
          profile_image_url: profile.avatar_url,
          role: profile.user_roles?.[0]?.roles?.key || "viewer",
          location_data: profile.location_data,
          contact_data: profile.contact_data,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          last_login_at: profile.last_login_at,
        })) || [];

        return successResponse({ users });
      }

      // Get single user
      if (action === "get") {
        const userId = url.searchParams.get("user_id");
        if (!userId) {
          return errorResponse("user_id parameter is required", undefined, 400);
        }

        const { data: profile, error } = await adminSupabase
          .from("profiles")
          .select(`
            *,
            user_roles (
              roles (
                id,
                key,
                name
              )
            )
          `)
          .eq("id", userId)
          .single();

        if (error || !profile) {
          return errorResponse("User not found", undefined, 404);
        }

        const userData = {
          id: profile.id,
          email: null,
          first_name: profile.first_name,
          last_name: profile.last_name,
          username: profile.username,
          bio: profile.bio,
          profile_image_url: profile.avatar_url,
          role: profile.user_roles?.[0]?.roles?.key || "viewer",
          location_data: profile.location_data,
          contact_data: profile.contact_data,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          last_login_at: profile.last_login_at,
        };

        return successResponse({ user: userData });
      }
    }

    if (method === "POST") {
      // Assign role to user
      if (action === "assign-role") {
        const body: AssignRoleRequest = await req.json();
        const validationResult = assignRoleSchema.safeParse(body);

        if (!validationResult.success) {
          return errorResponse(
            "Invalid request data",
            validationResult.error.errors,
            400
          );
        }

        const { user_id, role_key } = validationResult.data;

        // Get role ID
        const { data: role, error: roleError } = await adminSupabase
          .from("roles")
          .select("id")
          .eq("key", role_key)
          .single();

        if (roleError || !role) {
          return errorResponse("Invalid role", undefined, 400);
        }

        // Update or insert user role
        const { data: existingRole } = await adminSupabase
          .from("user_roles")
          .select("id")
          .eq("user_id", user_id)
          .single();

        if (existingRole) {
          // Update existing role
          const { data: updatedRole, error: updateError } = await adminSupabase
            .from("user_roles")
            .update({
              role_id: role.id,
              assigned_by: user.id,
            })
            .eq("user_id", user_id)
            .select()
            .single();

          if (updateError) {
            console.error("Error updating role:", updateError);
            return errorResponse("Failed to update role", updateError.message, 500);
          }

          return successResponse({ message: "Role updated successfully", user_role: updatedRole });
        } else {
          // Insert new role
          const { data: newRole, error: insertError } = await adminSupabase
            .from("user_roles")
            .insert({
              user_id,
              role_id: role.id,
              assigned_by: user.id,
            })
            .select()
            .single();

          if (insertError) {
            console.error("Error assigning role:", insertError);
            return errorResponse("Failed to assign role", insertError.message, 500);
          }

          return successResponse({ message: "Role assigned successfully", user_role: newRole });
        }
      }
    }

    if (method === "DELETE") {
      // Delete user (soft delete by removing profile)
      const userId = url.searchParams.get("user_id");
      if (!userId) {
        return errorResponse("user_id parameter is required", undefined, 400);
      }

      // Prevent self-deletion
      if (userId === user.id) {
        return errorResponse("Cannot delete your own account", undefined, 400);
      }

      // Delete user profile (cascade will handle related data)
      const { error: deleteError } = await adminSupabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (deleteError) {
        console.error("Error deleting user:", deleteError);
        return errorResponse("Failed to delete user", deleteError.message, 500);
      }

      return successResponse({ message: "User deleted successfully" });
    }

    return errorResponse("Invalid action or method", undefined, 400);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});

