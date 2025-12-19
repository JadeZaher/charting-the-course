// Shared authentication utilities for Supabase Edge Functions

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
}

/**
 * Get authenticated user from request
 * Returns null if not authenticated
 */
export async function getAuthUser(
  req: Request,
  supabase: SupabaseClient
): Promise<AuthUser | null> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    // Get user's role
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select(`
        role_id,
        roles!inner (
          key
        )
      `)
      .eq("user_id", user.id)
      .single();

    const roleKey = roleData?.roles && Array.isArray(roleData.roles) 
      ? roleData.roles[0]?.key 
      : roleData?.roles?.key || null;

    return {
      id: user.id,
      email: user.email,
      role: roleKey,
    };
  } catch (error) {
    console.error("Error getting auth user:", error);
    return null;
  }
}

/**
 * Check if user is admin
 */
export async function isAdmin(
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin", {
    user_uuid: userId,
  });

  if (error) {
    console.error("Error checking admin status:", error);
    return false;
  }

  return data === true;
}

/**
 * Check if user is admin or facilitator
 */
export async function isAdminOrFacilitator(
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin_or_facilitator", {
    user_uuid: userId,
  });

  if (error) {
    console.error("Error checking admin/facilitator status:", error);
    return false;
  }

  return data === true;
}

/**
 * Get Supabase URL from environment
 * Supports DB_URL (extracts from connection string) or SUPABASE_URL
 */
export function getSupabaseUrl(): string {
  // Try SUPABASE_URL first (direct)
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (supabaseUrl) return supabaseUrl;
  
  // Try extracting from DB_URL connection string
  const dbUrl = Deno.env.get("DB_URL") || Deno.env.get("SUPABASE_DB_URL");
  if (dbUrl) {
    try {
      const url = new URL(dbUrl);
      // Extract project ref from hostname (e.g., postgres.abc123.pooler.supabase.com)
      const hostParts = url.hostname.split(".");
      const projectRefIndex = hostParts.findIndex(part => part.match(/^[a-z0-9]+$/));
      if (projectRefIndex !== -1) {
        const projectRef = hostParts[projectRefIndex];
        return `https://${projectRef}.supabase.co`;
      }
    } catch {
      // Invalid URL, continue to fallback
    }
  }
  
  throw new Error("SUPABASE_URL or DB_URL must be set");
}

/**
 * Get Supabase anon key from environment
 * Supports ANON_KEY (preferred) or SUPABASE_ANON_KEY (legacy)
 */
export function getSupabaseAnonKey(): string {
  return Deno.env.get("ANON_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
}

/**
 * Create a standard Supabase client (for most operations)
 */
export function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();
  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Create Supabase client with service role (for admin operations)
 */
export function createServiceRoleClient(): SupabaseClient {
  const supabaseUrl = getSupabaseUrl();
  const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create Supabase client with user's JWT token
 */
export function createUserClient(token: string): SupabaseClient {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

/**
 * CORS headers for edge functions
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

/**
 * Handle CORS preflight requests
 */
export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}

