// Universal AI chat edge function — supports Lovable AI, any OpenAI-compatible provider, and native Anthropic.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Msg = { role: "user" | "assistant" | "system"; content: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const body = await req.json();
    const { conversation_id, model_id, messages, system_prompt } = body as {
      conversation_id: string;
      model_id: string;
      messages: Msg[];
      system_prompt?: string;
    };

    if (!conversation_id || !model_id || !Array.isArray(messages)) {
      return json({ error: "Missing fields: conversation_id, model_id, messages" }, 400);
    }

    // Service-role client for model lookup + credit deduction
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: model, error: modelErr } = await serviceClient
      .from("ai_models")
      .select("*")
      .eq("id", model_id)
      .eq("is_active", true)
      .maybeSingle();
    if (modelErr || !model) return json({ error: "Model not found or inactive" }, 404);

    // Pre-check credits
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .maybeSingle();
    if (!profile || profile.credits < model.credits_cost) {
      return json({ error: `Insufficient credits. Need ${model.credits_cost}.` }, 402);
    }

    const fullMessages: Msg[] = system_prompt
      ? [{ role: "system", content: system_prompt }, ...messages]
      : messages;

    // Route to provider
    let assistantContent = "";

    if (model.provider_type === "lovable") {
      assistantContent = await callOpenAICompat({
        url: "https://ai.gateway.lovable.dev/v1/chat/completions",
        apiKey: Deno.env.get("LOVABLE_API_KEY")!,
        modelName: model.id,
        messages: fullMessages,
      });
    } else if (model.provider_type === "openai_compatible") {
      const apiKey = Deno.env.get(model.api_key_secret_name);
      if (!apiKey) return json({ error: `Secret ${model.api_key_secret_name} not configured` }, 500);
      const base = (model.api_base_url || "").replace(/\/+$/, "");
      assistantContent = await callOpenAICompat({
        url: `${base}/chat/completions`,
        apiKey,
        modelName: model.api_model_name!,
        messages: fullMessages,
      });
    } else if (model.provider_type === "anthropic") {
      const apiKey = Deno.env.get(model.api_key_secret_name);
      if (!apiKey) return json({ error: `Secret ${model.api_key_secret_name} not configured` }, 500);
      assistantContent = await callAnthropic({
        apiKey,
        modelName: model.api_model_name!,
        messages: fullMessages,
      });
    } else {
      return json({ error: "Unknown provider type" }, 500);
    }

    // Insert assistant message
    const { data: aiMsg, error: insErr } = await serviceClient
      .from("messages")
      .insert({
        conversation_id,
        user_id: userId,
        role: "assistant",
        content: assistantContent,
        model_id: model.id,
        credits_used: model.credits_cost,
      })
      .select("id,role,content,created_at,conversation_id,model_id,credits_used")
      .single();
    if (insErr) return json({ error: insErr.message }, 500);

    // Deduct credits via RPC
    const { error: dedErr } = await serviceClient.rpc("deduct_credits", {
      _user_id: userId,
      _model_id: model.id,
      _conversation_id: conversation_id,
      _message_id: aiMsg.id,
    });
    if (dedErr) console.error("deduct_credits error:", dedErr);

    await serviceClient
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversation_id);

    return json({ message: aiMsg, credits_used: model.credits_cost });
  } catch (e) {
    console.error("chat-ai error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callOpenAICompat(opts: {
  url: string; apiKey: string; modelName: string; messages: Msg[];
}): Promise<string> {
  const resp = await fetch(opts.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.modelName,
      messages: opts.messages,
      stream: false,
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Provider error ${resp.status}: ${t.slice(0, 300)}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(opts: {
  apiKey: string; modelName: string; messages: Msg[];
}): Promise<string> {
  // Split system from rest for Anthropic format
  const systemMsg = opts.messages.find((m) => m.role === "system")?.content;
  const convo = opts.messages.filter((m) => m.role !== "system");

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": opts.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.modelName,
      max_tokens: 4096,
      system: systemMsg,
      messages: convo,
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Anthropic error ${resp.status}: ${t.slice(0, 300)}`);
  }
  const data = await resp.json();
  return data.content?.[0]?.text ?? "";
}
