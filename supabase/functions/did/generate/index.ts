import {
  createSupabaseClient,
  createServiceRoleClient,
  getAuthUser,
  corsHeaders,
  handleCors
} from '../../_shared/auth.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseClient();
    const user = await getAuthUser(req, supabase);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { did, public_key } = await req.json();

    if (!did?.startsWith('did:key:z')) {
      return new Response(JSON.stringify({ error: 'Invalid DID format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const adminSupabase = createServiceRoleClient();
    const { error } = await adminSupabase
      .from('profiles')
      .update({ did, public_key })
      .eq('id', user.id);

    if (error) {
      console.error('[did-generate] DB update error:', error);
      return new Response(JSON.stringify({ error: 'Failed to store DID' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('[did-generate] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
