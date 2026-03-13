// Edge Function: journey-maps-list
// Uses service role client to bypass RLS on journey_maps (authenticated-only policy).
// Query params: ?ethos_id=uuid&is_active=true|false

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

    const url = new URL(req.url);
    const ethosId = url.searchParams.get("ethos_id");
    const isActiveParam = url.searchParams.get("is_active");

    const isManager = await canManage(user.id);

    let query = adminClient()
      .from("journey_maps")
      .select("id, slug, title, description, ethos_id, sector_alignment, role_types, is_active, is_default, content_sequence, created_at, updated_at, ethos(name, slug)")
      .order("title");

    if (!isManager) {
      query = query.eq("is_active", true);
    } else if (isActiveParam !== null) {
      query = query.eq("is_active", isActiveParam === "true");
    }
    if (ethosId) query = query.eq("ethos_id", ethosId);

    const { data, error } = await query;
    if (error) return fail("Failed to fetch journey maps", error.message, 500);

    const maps = (data || []).map((m: any) => ({
      id: m.id, slug: m.slug, title: m.title, description: m.description,
      ethos_id: m.ethos_id, ethos: m.ethos,
      sector_alignment: m.sector_alignment, role_types: m.role_types,
      is_active: m.is_active, is_default: m.is_default,
      step_count: Array.isArray(m.content_sequence) ? m.content_sequence.length : 0,
      created_at: m.created_at, updated_at: m.updated_at,
    }));

    return ok({ maps, total: maps.length });
  } catch (e) {
    return fail("Internal server error", e instanceof Error ? e.message : String(e), 500);
  }
});
