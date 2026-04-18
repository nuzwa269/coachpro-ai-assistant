// Universal AI chat edge function with smart context management:
// - DB-driven message history (not client array)
// - Recent window + rolling summary (durable facts) for long conversations
// - Friendly fallback on context_length_exceeded
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Msg = { role: "user" | "assistant" | "system"; content: string };

// Tunables
const RECENT_WINDOW = 16;            // messages kept verbatim
const SUMMARY_TRIGGER_EVERY = 10;    // re-summarize after N new msgs past threshold
const AGGRESSIVE_KEEP = 6;           // on context overflow, keep only this many recent msgs
const SUMMARIZER_MODEL = "google/gemini-2.5-flash-lite";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const body = await req.json();
    const { conversation_id, model_id, system_prompt } = body as {
      conversation_id: string;
      model_id: string;
      messages?: Msg[]; // accepted for backwards compat but ignored
      system_prompt?: string;
    };

    if (!conversation_id || !model_id) {
      return json({ error: "Missing fields: conversation_id, model_id" }, 400);
    }

    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: model, error: modelErr } = await serviceClient
      .from("ai_models")
      .select("*")
      .eq("id", model_id)
      .eq("is_active", true)
      .maybeSingle();
    if (modelErr || !model) return json({ error: "Model not found or inactive" }, 404);

    const { data: profile } = await serviceClient
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .maybeSingle();
    if (!profile || profile.credits < model.credits_cost) {
      return json({ error: `Insufficient credits. Need ${model.credits_cost}.` }, 402);
    }

    // Fetch full message history from DB (source of truth)
    const { data: allMsgs, error: histErr } = await serviceClient
      .from("messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true });
    if (histErr) return json({ error: histErr.message }, 500);

    const history: Array<{ id: string; role: string; content: string }> = allMsgs ?? [];

    // Fetch existing summary
    const { data: sumRow } = await serviceClient
      .from("conversation_summaries")
      .select("summary, durable_facts, summarized_up_to_message_id, message_count_at_summary")
      .eq("conversation_id", conversation_id)
      .maybeSingle();

    // Build payload (recent window + summary)
    const payload = buildPayload({
      history,
      systemPrompt: system_prompt,
      summary: sumRow?.summary ?? "",
      durableFacts: sumRow?.durable_facts ?? "",
      keep: RECENT_WINDOW,
    });

    // Call provider with retry-on-overflow
    let assistantContent = "";
    try {
      assistantContent = await callProvider(model, payload);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isContextOverflowError(msg)) {
        console.log("Context overflow detected — aggressive summarization + retry");
        // Aggressive collapse: summarize everything but the last AGGRESSIVE_KEEP messages
        await summarizeAndStore({
          serviceClient,
          conversationId: conversation_id,
          history,
          existingSummary: sumRow?.summary ?? "",
          existingFacts: sumRow?.durable_facts ?? "",
          keepRecent: AGGRESSIVE_KEEP,
        });
        // Re-fetch summary
        const { data: sumRow2 } = await serviceClient
          .from("conversation_summaries")
          .select("summary, durable_facts")
          .eq("conversation_id", conversation_id)
          .maybeSingle();
        const retryPayload = buildPayload({
          history,
          systemPrompt: system_prompt,
          summary: sumRow2?.summary ?? "",
          durableFacts: sumRow2?.durable_facts ?? "",
          keep: AGGRESSIVE_KEEP,
        });
        try {
          assistantContent = await callProvider(model, retryPayload);
        } catch (err2) {
          const msg2 = err2 instanceof Error ? err2.message : String(err2);
          if (isContextOverflowError(msg2)) {
            return json(
              { error: "chat_too_long", message: "This conversation has grown very large. Start a fresh chat to continue smoothly — your context has been saved." },
              413,
            );
          }
          throw err2;
        }
      } else {
        throw err;
      }
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

    // Deduct credits
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

    // Fire-and-forget: maintain rolling summary if we're past threshold
    const totalAfter = history.length + 1; // +1 for assistant we just inserted
    const lastSummarizedCount = sumRow?.message_count_at_summary ?? 0;
    if (
      totalAfter > RECENT_WINDOW &&
      totalAfter - lastSummarizedCount >= SUMMARY_TRIGGER_EVERY
    ) {
      // Don't await — return response fast
      const fullHistory = [...history, { id: aiMsg.id, role: "assistant", content: assistantContent }];
      maintainSummary({
        serviceClient,
        conversationId: conversation_id,
        history: fullHistory,
        existingSummary: sumRow?.summary ?? "",
        existingFacts: sumRow?.durable_facts ?? "",
      }).catch((e) => console.error("Background summarization error:", e));
    }

    return new Response(JSON.stringify({ message: aiMsg, credits_used: model.credits_cost }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat-ai error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

// ---------- helpers ----------

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildPayload(opts: {
  history: Array<{ role: string; content: string }>;
  systemPrompt?: string;
  summary: string;
  durableFacts: string;
  keep: number;
}): Msg[] {
  const out: Msg[] = [];
  if (opts.systemPrompt) out.push({ role: "system", content: opts.systemPrompt });

  if (opts.history.length > opts.keep && (opts.summary || opts.durableFacts)) {
    const memBlock = [
      opts.summary ? `Conversation summary so far:\n${opts.summary}` : "",
      opts.durableFacts ? `Key facts to remember:\n${opts.durableFacts}` : "",
    ].filter(Boolean).join("\n\n");
    out.push({ role: "system", content: memBlock });
  }

  const recent = opts.history.slice(-opts.keep);
  for (const m of recent) {
    out.push({ role: m.role as "user" | "assistant", content: m.content });
  }
  return out;
}

function isContextOverflowError(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes("context_length_exceeded") ||
    m.includes("maximum context length") ||
    m.includes("context length") ||
    m.includes("too many tokens") ||
    m.includes("input is too long") ||
    m.includes("prompt is too long") ||
    (m.includes("invalid_request_error") && m.includes("token"))
  );
}

async function callProvider(model: any, messages: Msg[]): Promise<string> {
  if (model.provider_type === "lovable") {
    return await callOpenAICompat({
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      apiKey: Deno.env.get("LOVABLE_API_KEY")!,
      modelName: model.id,
      messages,
    });
  } else if (model.provider_type === "openai_compatible") {
    const apiKey = Deno.env.get(model.api_key_secret_name);
    if (!apiKey) throw new Error(`Secret ${model.api_key_secret_name} not configured`);
    const base = (model.api_base_url || "").replace(/\/+$/, "");
    return await callOpenAICompat({
      url: `${base}/chat/completions`,
      apiKey,
      modelName: model.api_model_name!,
      messages,
    });
  } else if (model.provider_type === "anthropic") {
    const apiKey = Deno.env.get(model.api_key_secret_name);
    if (!apiKey) throw new Error(`Secret ${model.api_key_secret_name} not configured`);
    return await callAnthropic({
      apiKey,
      modelName: model.api_model_name!,
      messages,
    });
  }
  throw new Error("Unknown provider type");
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
    throw new Error(`Provider error ${resp.status}: ${t.slice(0, 500)}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(opts: {
  apiKey: string; modelName: string; messages: Msg[];
}): Promise<string> {
  const systemMsgs = opts.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
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
      system: systemMsgs || undefined,
      messages: convo,
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Anthropic error ${resp.status}: ${t.slice(0, 500)}`);
  }
  const data = await resp.json();
  return data.content?.[0]?.text ?? "";
}

// ---------- summarization ----------

async function maintainSummary(opts: {
  serviceClient: any;
  conversationId: string;
  history: Array<{ id: string; role: string; content: string }>;
  existingSummary: string;
  existingFacts: string;
}) {
  await summarizeAndStore({
    serviceClient: opts.serviceClient,
    conversationId: opts.conversationId,
    history: opts.history,
    existingSummary: opts.existingSummary,
    existingFacts: opts.existingFacts,
    keepRecent: RECENT_WINDOW,
  });
}

async function summarizeAndStore(opts: {
  serviceClient: any;
  conversationId: string;
  history: Array<{ id: string; role: string; content: string }>;
  existingSummary: string;
  existingFacts: string;
  keepRecent: number;
}) {
  const { history, keepRecent } = opts;
  if (history.length <= keepRecent) return;

  // Messages to compress = everything except the last keepRecent
  const toCompress = history.slice(0, history.length - keepRecent);
  if (toCompress.length === 0) return;

  const lastIncludedId = toCompress[toCompress.length - 1].id;

  const transcript = toCompress
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n")
    .slice(0, 60000); // safety cap on input length

  const prompt = `You maintain a rolling memory of a long conversation between a user and an AI assistant.

EXISTING SUMMARY (may be empty):
${opts.existingSummary || "(none yet)"}

EXISTING DURABLE FACTS (may be empty):
${opts.existingFacts || "(none yet)"}

NEW MESSAGES TO INCORPORATE:
${transcript}

Produce an updated, compressed memory. Respond ONLY with valid JSON in this exact shape:
{
  "summary": "A concise narrative (max ~400 words) of what's been discussed, decisions made, and current direction.",
  "durable_facts": "A bullet-style list of stable facts to never forget: user preferences, goals, constraints, named entities, file/code references, open questions. Max ~250 words."
}`;

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    console.error("LOVABLE_API_KEY missing — skipping summarization");
    return;
  }

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: SUMMARIZER_MODEL,
        messages: [
          { role: "system", content: "You output only valid JSON. No markdown, no commentary." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        stream: false,
      }),
    });
    if (!resp.ok) {
      console.error("Summarizer error", resp.status, (await resp.text()).slice(0, 300));
      return;
    }
    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: { summary?: string; durable_facts?: string } = {};
    try { parsed = JSON.parse(raw); } catch {
      // try to extract JSON object substring
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch { /* noop */ } }
    }
    const newSummary = (parsed.summary ?? "").trim() || opts.existingSummary;
    const newFacts = (parsed.durable_facts ?? "").trim() || opts.existingFacts;

    await opts.serviceClient
      .from("conversation_summaries")
      .upsert({
        conversation_id: opts.conversationId,
        summary: newSummary,
        durable_facts: newFacts,
        summarized_up_to_message_id: lastIncludedId,
        message_count_at_summary: history.length,
        updated_at: new Date().toISOString(),
      }, { onConflict: "conversation_id" });
  } catch (e) {
    console.error("Summarization failed:", e);
  }
}
