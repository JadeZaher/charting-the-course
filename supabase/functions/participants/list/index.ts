// Edge Function: participants/list
// GET ?ethos_id=<uuid> — returns all participants with ethos_user_access for the given ethos
// Caller must have ethos_user_access for that ethos_id (or be admin)

import { createSupabaseClient, createServiceRoleClient, getAuthUser, isAdminOrFacilitator, handleCors } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "../../_shared/response.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseClient();
    const user = await getAuthUser(req, supabase);
    if (!user) return unauthorizedResponse("Authentication required");

    const url = new URL(req.url);
    const ethos_id = url.searchParams.get("ethos_id");

    if (!ethos_id) {
      return errorResponse("ethos_id is required", undefined, 400);
    }

    const adminSupabase = createServiceRoleClient();
    const userIsAdmin = await isAdminOrFacilitator(user.id, supabase);

    // Verify caller has access to this ethos
    if (!userIsAdmin) {
      const { data: accessCheck } = await adminSupabase
        .from("ethos_user_access")
        .select("id")
        .eq("user_id", user.id)
        .eq("ethos_id", ethos_id)
        .maybeSingle();

      if (!accessCheck) {
        return forbiddenResponse("Access not granted for this ETHOS");
      }
    }

    // Fetch all users with ethos_user_access for this ethos_id
    const { data: accessRows } = await adminSupabase
      .from("ethos_user_access")
      .select("user_id, profiles(id, username, first_name, last_name)")
      .eq("ethos_id", ethos_id);

    // Fetch participant_contacts for this ethos_id
    const { data: contacts } = await adminSupabase
      .from("participant_contacts")
      .select("user_id, phone, email")
      .eq("ethos_id", ethos_id);

    // Fetch ethos_members for this ethos_id
    const { data: members } = await adminSupabase
      .from("ethos_members")
      .select("user_id, member_type, role_in_ethos")
      .eq("ethos_id", ethos_id);

    // Build lookup maps
    const contactMap: Record<string, { phone: string | null; email: string | null }> = {};
    for (const c of contacts || []) {
      contactMap[(c as any).user_id] = { phone: (c as any).phone ?? null, email: (c as any).email ?? null };
    }

    const memberMap: Record<string, { member_type: string; role_in_ethos: string | null }> = {};
    for (const m of members || []) {
      memberMap[(m as any).user_id] = { member_type: (m as any).member_type, role_in_ethos: (m as any).role_in_ethos ?? null };
    }

    // Assemble participants
    const STATUS_ORDER: Record<string, number> = { member: 0, waiting: 1, aligned: 2 };

    const participants = (accessRows || []).map((row: any) => {
      const profile = row.profiles;
      const userId = row.user_id;
      const contact = contactMap[userId] ?? { phone: null, email: null };
      const memberInfo = memberMap[userId];

      let ethos_status: "aligned" | "member" | "waiting" = "aligned";
      if (memberInfo) {
        ethos_status = memberInfo.member_type === "member" ? "member"
          : memberInfo.member_type === "waiting" ? "waiting"
          : "aligned";
      }

      return {
        user_id: userId,
        username: profile?.username ?? "",
        first_name: profile?.first_name ?? "",
        last_name: profile?.last_name ?? "",
        profile_url: `/users/${profile?.username ?? userId}`,
        phone: contact.phone,
        email: contact.email,
        ethos_status,
        ethos_role: memberInfo?.role_in_ethos ?? null,
      };
    });

    participants.sort((a, b) => (STATUS_ORDER[a.ethos_status] ?? 99) - (STATUS_ORDER[b.ethos_status] ?? 99));

    return successResponse({ participants });

  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});
