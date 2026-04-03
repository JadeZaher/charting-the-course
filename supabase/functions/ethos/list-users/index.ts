// Edge Function: ethos-list-users
// GET — Search profiles for member assignment. Requires admin/facilitator.
// Uses service role client to bypass profiles RLS.
// Query params: ?search=foo&limit=50

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS" };
const ok = (data: unknown, status = 200) => new Response(JSON.stringify({ data }), { status, headers: { ...cors, "Content-Type": "application/json" } });
const fail = (error: string, details?: unknown, status = 400) => new Response(JSON.stringify({ error, details }), { status, headers: { ...cors, "Content-Type": "application/json" } });

function getUrl() { return Deno.env.get("SUPABASE_URL")!; }
function getAnonKey() { return (Deno.env.get("ANON_KEY") || Deno.env.get("SUPABASE_ANON_KEY"))!; }
function getSvcKey() { return (Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))!; }
function anonClient() { return createClient(getUrl(), getAnonKey()); }
function adminClient() { return createClient(getUrl(), getSvcKey(), { auth: { autoRefreshToken: false, persistSession: false } }); }

async function getUser(req: Request) {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;
  const token = auth.replace("Bearer ", "");
  const { data: { user }, error } = await anonClient().auth.getUser(token);
  if (error || !user) return null;
  return { id: user.id };
}
async function canManage(userId: string): Promise<boolean> {
  const { data } = await anonClient().rpc("is_admin_or_facilitator", { user_uuid: userId });
  return data === true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const user = await getUser(req);
    if (!user) return fail("Authentication required", undefined, 401);
    if (!await canManage(user.id)) return fail("Admin or facilitator access required", undefined, 403);

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

    const sb = adminClient();
    let query = sb.from("profiles").select("id, username, first_name, last_name, avatar_url").limit(limit).order("username");
    if (search) {
      query = query.or(`username.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) return fail("Failed to fetch users", error.message, 500);
    return ok({ users: data || [] });
  } catch (e) {
    return fail("Internal server error", e instanceof Error ? e.message : String(e), 500);
  }
});
