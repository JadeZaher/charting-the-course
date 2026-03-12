import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS" };
const ok = (data: unknown, status = 200) => new Response(JSON.stringify({ data }), { status, headers: { ...cors, "Content-Type": "application/json" } });
const err = (error: string, details?: unknown, status = 400) => new Response(JSON.stringify({ error, details }), { status, headers: { ...cors, "Content-Type": "application/json" } });
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  // (implementation deployed via MCP)
  return err("Use deployed version", undefined, 501);
});
