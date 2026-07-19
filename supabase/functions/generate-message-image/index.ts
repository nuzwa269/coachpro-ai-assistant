// On-demand image generation for chat messages.
// - Extracts the assistant's stored image prompt (fenced ```image-prompt block
//   OR "IMAGE_PROMPT:" marker) from the message content.
// - Calls Lovable AI Gateway (openai/gpt-image-2, low quality).
// - Uploads PNG to the private "generated-images" bucket at {user_id}/{message_id}.png.
// - Signs a long-lived URL and appends `![Generated image](URL)` to the message.
// - Deducts credits atomically and records a credit_transactions row.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractImagePrompt(content: string): string | null {
  if (!content) return null;
  // Fenced ```image-prompt block
  const fence = content.match(/```image-prompt\s*\n?([\s\S]*?)```/i);
  if (fence && fence[1].trim()) return fence[1].trim();
  // IMAGE_PROMPT: single-line marker
  const marker = content.match(/IMAGE_PROMPT\s*:\s*([^\n]+)/i);
  if (marker && marker[1].trim()) return marker[1].trim();
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const publishable =
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, publishable, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const messageId = (body as { message_id?: string }).message_id;
    if (!messageId) return json({ error: "Missing message_id" }, 400);

    const service = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Load message + conversation + assistant
    const { data: msg, error: msgErr } = await service
      .from("messages")
      .select("id, conversation_id, role, content, user_id")
      .eq("id", messageId)
      .maybeSingle();
    if (msgErr || !msg) return json({ error: "Message not found" }, 404);
    if (msg.role !== "assistant") return json({ error: "Only assistant messages" }, 400);

    const { data: convo } = await service
      .from("conversations")
      .select("user_id, assistant_id, assistants ( provides_image_prompt, image_credits_cost )")
      .eq("id", msg.conversation_id)
      .maybeSingle();
    if (!convo || convo.user_id !== userId) {
      return json({ error: "Access denied" }, 403);
    }
    const assistant = (convo as any).assistants;
    if (!assistant?.provides_image_prompt) {
      return json({ error: "This assistant does not support image generation" }, 400);
    }
    const cost: number = assistant.image_credits_cost ?? 15;

    // Idempotency — already generated?
    if (/!\[Generated image\]\(/.test(msg.content)) {
      return json({ error: "Image already generated for this message" }, 409);
    }

    const prompt = extractImagePrompt(msg.content);
    if (!prompt) return json({ error: "No image prompt found in this message" }, 400);

    // Credit check
    const { data: profile } = await service
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .maybeSingle();
    if (!profile || profile.credits < cost) {
      return json({ error: `Insufficient credits. Need ${cost}.` }, 402);
    }

    // Call Gateway image endpoint (non-streaming for simplicity server-side)
    const gwResp = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-image-2",
        prompt,
        size: "1024x1024",
        quality: "low",
        n: 1,
      }),
    });
    if (!gwResp.ok) {
      const t = await gwResp.text();
      console.error("image gateway error", gwResp.status, t.slice(0, 500));
      const blocked = /content_policy|moderation_blocked|safety/i.test(t);
      return json(
        {
          error: blocked
            ? "The image prompt was blocked by safety filters. Try rephrasing."
            : "Image generation failed. Please try again.",
        },
        502,
      );
    }
    const gwData = await gwResp.json();
    const b64: string | undefined = gwData?.data?.[0]?.b64_json;
    if (!b64) return json({ error: "Empty image response" }, 502);

    // Decode base64 -> Uint8Array
    const binStr = atob(b64);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);

    const path = `${userId}/${messageId}.png`;
    const { error: upErr } = await service.storage
      .from("generated-images")
      .upload(path, bytes, { contentType: "image/png", upsert: true });
    if (upErr) {
      console.error("storage upload error", upErr);
      return json({ error: "Failed to save image" }, 500);
    }

    // Long-lived signed URL (~100 years)
    const { data: signed, error: signErr } = await service.storage
      .from("generated-images")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 100);
    if (signErr || !signed?.signedUrl) {
      console.error("sign url error", signErr);
      return json({ error: "Failed to sign image URL" }, 500);
    }
    const imageUrl = signed.signedUrl;

    // Deduct credits atomically-ish: re-check + update
    const { data: fresh } = await service
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .maybeSingle();
    if (!fresh || fresh.credits < cost) {
      return json({ error: `Insufficient credits. Need ${cost}.` }, 402);
    }
    const newBalance = fresh.credits - cost;
    const { error: dedErr } = await service
      .from("profiles")
      .update({ credits: newBalance, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (dedErr) {
      console.error("credit deduct error", dedErr);
      return json({ error: "Failed to deduct credits" }, 500);
    }
    await service.from("credit_transactions").insert({
      user_id: userId,
      amount: -cost,
      kind: "image_generation",
      balance_after: newBalance,
      reference_id: messageId,
      notes: `Image generation for message ${messageId}`,
    });

    // Append image markdown to message content
    const updatedContent = `${msg.content.trimEnd()}\n\n![Generated image](${imageUrl})`;
    await service
      .from("messages")
      .update({ content: updatedContent })
      .eq("id", messageId);

    return json({
      image_url: imageUrl,
      credits_used: cost,
      new_content: updatedContent,
    });
  } catch (e) {
    console.error("generate-message-image error", e);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});