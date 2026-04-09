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

    const adminSupabase = createServiceRoleClient();

    // 1. Fetch badge summary
    const { data: badges } = await adminSupabase
      .from('user_badges')
      .select('badge_key, badge_name, badge_category, strength')
      .eq('user_id', user.id);

    const badgeSummary: Record<string, unknown> = {};
    for (const b of badges || []) {
      badgeSummary[b.badge_key] = {
        name: b.badge_name,
        category: b.badge_category,
        strength: b.strength
      };
    }

    // 2. Fetch areas of focus from user_tags
    const { data: tags } = await adminSupabase
      .from('user_tags')
      .select('tag_key, tag_value, tag_category')
      .eq('user_id', user.id)
      .eq('tag_category', 'focus');

    const areasOfFocus = (tags || []).map(t => ({
      key: t.tag_key,
      value: t.tag_value
    }));

    // 3. Fetch orientation status from user_journey_progress
    const { data: progress } = await adminSupabase
      .from('user_journey_progress')
      .select('orientation_path, status, ethos_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 4. Fetch DID from profiles
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('did')
      .eq('id', user.id)
      .single();

    // 5. Upsert ctc_handoff
    const { error } = await adminSupabase
      .from('ctc_handoff')
      .upsert({
        user_id: user.id,
        did: profile?.did ?? null,
        badge_summary: badgeSummary,
        areas_of_focus: areasOfFocus,
        orientation_path: progress?.orientation_path ?? null,
        orientation_status: progress?.status ?? 'in_progress',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('[assemble-handoff] Upsert error:', error);
      return new Response(JSON.stringify({ error: 'Failed to assemble handoff' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('[assemble-handoff] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
