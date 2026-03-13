// Edge Function: journey-maps-get
// Uses service role client to bypass RLS on journey_maps (authenticated-only policy).
// Query params: ?id=uuid OR ?slug=slug

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const user = await getUser(req);
    if (!user) return fail("Authentication required", undefined, 401);

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const slug = url.searchParams.get("slug");
    if (!id && !slug) return fail("id or slug required", undefined, 400);

    let query = adminClient()
      .from("journey_maps")
      .select("*, ethos(id, name, slug)");

    if (id) query = query.eq("id", id);
    else query = query.eq("slug", slug!);

    const { data, error } = await query.maybeSingle();
    if (error) return fail("Failed to fetch journey map", error.message, 500);
    if (!data) return fail("Journey map not found", undefined, 404);
    return ok(data);
  } catch (e) {
    return fail("Internal server error", e instanceof Error ? e.message : String(e), 500);
  }
});
