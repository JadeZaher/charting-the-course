// Edge Function: omnibot/chat
// OpenRouter-compatible AI proxy. Swap OMNIBOT_API_URL for Bedrock when ready.

import { createSupabaseClient, getAuthUser, handleCors, corsHeaders } from "../../_shared/auth.ts";
import { successResponse, errorResponse, unauthorizedResponse } from "../../_shared/response.ts";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  context?: {
    user_profile_summary?: string;
    ethos_name?: string;
    current_step?: string;
    session_type?: string;
  };
  max_tokens?: number;
  session_id?: string;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseClient();
    const user = await getAuthUser(req, supabase);
    if (!user) return unauthorizedResponse("Authentication required");

    const body: ChatRequest = await req.json();
    const { messages, context, max_tokens = 800, session_id } = body;

    const OMNIBOT_API_URL = Deno.env.get("OMNIBOT_API_URL");
    const OMNIBOT_API_KEY = Deno.env.get("OMNIBOT_API_KEY");
    const OMNIBOT_MODEL = Deno.env.get("OMNIBOT_MODEL") ?? "anthropic.claude-3-sonnet-20240229-v1:0";

    const systemContent = buildSystemPrompt(context);
    const messagesWithSystem: ChatMessage[] = [
      { role: "system", content: systemContent },
      ...messages,
    ];

    let assistantContent: string;
    let isStub = false;

    // STUB MODE: no API URL configured
    if (!OMNIBOT_API_URL) {
      assistantContent = generateStubResponse(messages, context);
      isStub = true;
    } else {
      // LIVE MODE: OpenRouter-compatible call
      const apiResponse = await fetch(`${OMNIBOT_API_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OMNIBOT_API_KEY}`,
        },
        body: JSON.stringify({
          model: OMNIBOT_MODEL,
          messages: messagesWithSystem,
          max_tokens,
        }),
      });

      if (!apiResponse.ok) {
        throw new Error(`OmniBot API error: ${apiResponse.status}`);
      }

      const data = await apiResponse.json();
      const choice = data.choices?.[0]?.message ?? data.content?.[0];
      assistantContent = choice?.content ?? "";
    }

    // Persist to omnibot_sessions if session_id provided
    if (session_id) {
      const newMessage = { role: "assistant", content: assistantContent, timestamp: new Date().toISOString() };
      await supabase.rpc("jsonb_array_append", {}).catch(() => {
        // Non-blocking: session persistence failure doesn't break the chat
      });
    }

    return successResponse({
      message: { role: "assistant", content: assistantContent },
      is_stub: isStub,
    });

  } catch (error) {
    console.error("OmniBot chat error:", error);
    return errorResponse(
      "Internal server error",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});

function buildSystemPrompt(context?: ChatRequest["context"]): string {
  const base = `You are OmniBot, the intelligent guide for the OmniOne ecosystem — a regenerative coordination framework for civilizational-scale collaboration. You help people understand the system, find their place in it, and navigate their orientation journey. You are warm, clear, grounded, and non-coercive. You never pressure people to join anything. You illuminate; you don't recruit.`;

  if (!context) return base;

  const parts = [base];
  if (context.ethos_name) parts.push(`The user is exploring the ${context.ethos_name} ETHOS.`);
  if (context.current_step) parts.push(`They are currently at: ${context.current_step}.`);
  if (context.user_profile_summary) parts.push(`User profile context: ${context.user_profile_summary}`);
  if (context.session_type === "intake") {
    parts.push(`This is an intake conversation. Ask short, open questions about what they want from life, what problems they care about, and how they like to work. Keep it conversational. 3-5 exchanges maximum before summarizing.`);
  }

  return parts.join("\n\n");
}

function generateStubResponse(messages: ChatMessage[], context?: ChatRequest["context"]): string {
  if (context?.session_type === "intake") {
    return "That's really meaningful. It sounds like you're looking for a way to contribute to something larger than yourself while staying true to your values. Can you tell me more about what kind of work energizes you most?";
  }
  return "I'm OmniBot, your guide through the OmniOne ecosystem. I'm here to help you understand where you fit, what's available to you, and how to take your next step. What would you like to know?";
}
