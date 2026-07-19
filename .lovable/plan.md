
## Plan: On-demand image generation for BuildSight & VISUAL ARCHITECT

### Concept (updated)
Image **خودکار نہیں** بنے گی۔ ان دو اسسٹنٹس کا behavior یہ ہوگا:
1. **ہر جواب کے آخر میں** ایک ready-to-use **image prompt** (انگلش میں) copyable code block میں دیا جائے گا — یوزر اسے کہیں بھی (Midjourney, DALL-E, وغیرہ) استعمال کر سکے۔
2. اسی prompt block کے نیچے ایک بٹن: **"🖼 Generate this image (15 credits)"**
3. یوزر کلک کرے → confirmation dialog: *"15 credits will be deducted to generate this image. Continue?"*
4. Confirm → image generate ہو کر اسی message کے نیچے دکھائی جائے، credits کٹیں۔ Cancel → کچھ نہ ہو۔

### Cost
- Text reply: 1 credit (as usual)
- Image generation: **15 credits**, صرف یوزر کے explicit confirm پر
- Failed generation → کوئی credit نہ کٹے

### 1. Database migration
`assistants` پر:
- `provides_image_prompt boolean DEFAULT false` — اسسٹنٹ ہر reply میں image prompt دے
- `image_credits_cost int DEFAULT 15`

`messages` پر:
- `image_url text` (nullable) — generated image کا signed URL
- `image_prompt text` (nullable) — assistant کا دیا ہوا prompt (regenerate کے لیے)
- `image_generated_at timestamptz` (nullable)

Update: BuildSight اور VISUAL ARCHITECT کے rows پر `provides_image_prompt = true`, `image_credits_cost = 15` کریں۔

Storage bucket `generated-images` (private) + RLS: user reads only `{user_id}/*`; service_role writes.

### 2. Edge function changes
**Existing `chat-ai` function:**
- اگر assistant.`provides_image_prompt = true`:
  - system prompt میں یہ اضافہ کریں: *"At the end of every reply, on a new line, add exactly this block (English only):*
    ```
    IMAGE_PROMPT: <one clear English sentence describing the UI/product visual you just recommended, max 40 words>
    ```*"*
- Parser (frontend یا backend) اس line کو detect کر کے prompt نکالے، اسے `messages.image_prompt` میں save کرے، اور UI میں copyable block + "Generate" بٹن دکھائے۔

**New edge function `generate-message-image`:**
- Input: `{ message_id }`
- Steps:
  1. Auth check + user id
  2. Load message → verify user owns the conversation → read `image_prompt` and assistant's `image_credits_cost`
  3. Reject if `image_url` already exists (idempotent)
  4. Check credits ≥ 15; if not, return 402 with clear message
  5. Call `POST https://ai.gateway.lovable.dev/v1/images/generations`:
     ```json
     { "model": "openai/gpt-image-2", "prompt": "<image_prompt>", "size": "1024x1024", "quality": "low", "n": 1 }
     ```
  6. Decode `b64_json`, upload to `generated-images/{user_id}/{message_id}.png`
  7. Signed URL (7 days) → update `messages` row: `image_url`, `image_generated_at`
  8. Deduct 15 credits via existing pattern; log to `credit_transactions` with kind `image_generation`
  9. On content-policy or any failure → return error, no credits deducted

### 3. Frontend — `AssistantMessage.tsx`
- Existing parser already renders fenced code blocks. Add special handling:
  - When component receives a message with `image_prompt` (from DB) but no `image_url`:
    - Show the prompt in a copyable "Prompt" block (already existing style)
    - Below it: **"🖼 Generate this image (15 credits)"** button
    - On click → confirm dialog (shadcn `AlertDialog`) → call `generate-message-image` edge function
    - While generating: shimmer skeleton
  - When `image_url` present: show image card with **Download** button (+ small "Regenerate — 15 credits" link)

### 4. `ProjectWorkspace.tsx`
- Pass `message.image_prompt`, `message.image_url`, `message.id` to `AssistantMessage`
- After generate call succeeds: refresh conversation (invalidate query) so UI updates

### 5. Admin UI — `AdminAssistants.tsx`
Editor dialog میں اضافہ:
- Switch: **"Provide image prompt in every reply"**
- Number: **"Image credits cost"** (default 15)
- Small helper text: *"When enabled, the assistant ends each reply with a copyable image prompt. Users can optionally generate the image for the specified credits."*

### 6. UX polish
- Header chip on these two assistants: **"Includes image prompts • 15 credits to render"**
- Toast on successful image: *"Image generated — 15 credits used"*
- Failed generation: friendly error (esp. content-policy: *"The prompt was blocked. Try rephrasing."*)

### Files touched
- New migration (2 columns on `assistants`, 3 on `messages`, storage bucket, seed update)
- `supabase/functions/chat-ai/index.ts` (append instruction for these assistants only)
- `supabase/functions/generate-message-image/index.ts` (NEW)
- `src/components/chat/AssistantMessage.tsx`
- `src/pages/ProjectWorkspace.tsx` (+ possibly `SavedResponses.tsx`)
- `src/components/admin/AdminAssistants.tsx`

### Out of scope
- No auto-generation
- No streaming / no partial previews
- No image editing / user-uploaded references
- No medium/high quality tier (admin-only future work)

### Confirm before build
- ✅ 15 credits per image
- ✅ On-demand only (confirm dialog before deduction)
- ✅ Free image **prompt** always provided (text only, no extra cost)
- ✅ Applies only to **BuildSight** & **VISUAL ARCHITECT**
