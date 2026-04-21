

## Plan: AI Help Page + Per-Assistant Default Model

دو features ایک ساتھ:
**(A)** "AI Assistant کیسے Activate کریں" کا in-app help/documentation صفحہ
**(C)** Admin سے ہر assistant کے لیے default AI model منتخب کرنے کی سہولت

---

### Part A — Help / Documentation Page

**نیا route:** `/help/assistants` (sidebar میں "Help" link)

**نیا file:** `src/pages/HelpAssistants.tsx`
- اردو + English bilingual content (آپ کی app کی طرز پر)
- مرحلہ وار guide cards کے ساتھ:
  1. **AI Assistants کیا ہیں؟** — مختصر تعارف
  2. **Activate کیسے کریں** — `/assistants` پر جائیں → کارڈ پر "Activate" دبائیں → Free plan میں 1، paid میں زیادہ
  3. **Chat میں استعمال** — Dashboard پر assistant card پر کلک → input میں منتخب → پیغام بھیجیں
  4. **Conversation Starters** — اگر admin نے سیٹ کیے ہوں تو نیچے chips ظاہر ہوں گے
  5. **Custom Assistant بنانا** — `/assistants` → "Create Assistant" → name, description, system prompt
  6. **Credits کیسے کٹتے ہیں** — ہر پیغام پر منتخب model کے مطابق
- ہر step کے ساتھ متعلقہ صفحے کا shortcut button (مثلاً "Open Assistants Page")
- آخر میں FAQ accordion (5–6 عام سوالات)

**Sidebar update:** `src/components/layout/AppSidebar.tsx` میں "Help" link (HelpCircle icon) شامل
**Routing:** `src/App.tsx` میں نیا route register

---

### Part C — Per-Assistant Default Model

**Goal:** Admin ہر prebuilt assistant کے لیے ایک default AI model چن سکے (مثلاً "Coding Expert" → GPT-5، "Marketing Helper" → Gemini Flash)۔ جب user اس assistant سے chat کرے، یہی model خودکار استعمال ہو۔

**Database:** کالم `assistants.default_model_id` پہلے سے موجود ہے ✅ — کوئی migration درکار نہیں۔

**Admin UI changes** (`src/components/admin/AdminAssistants.tsx`):
- Assistant editor dialog میں نیا dropdown: **"Default AI Model"**
- `ai_models` table سے `is_active = true` models load کر کے Select میں دکھائیں (display_name + provider + credits cost)
- "None (user choice)" option بھی ہو — یعنی default نہ ہو تو user کا منتخب کردہ model چلے
- Save پر `default_model_id` update ہو
- Assistants list میں ہر row پر badge: "Default: GPT-5" یا "Default: User choice"

**User-side behavior:**

1. **`src/pages/Dashboard.tsx`** اور **`src/pages/ProjectWorkspace.tsx`**:
   - Assistant fetch query میں `default_model_id` شامل کریں
   - جب user کوئی assistant select کرے:
     - اگر اس کا `default_model_id` set ہے → model picker میں خودکار وہی model select ہو جائے
     - چھوٹا badge/note: *"Using {ModelName} (assistant default)"* model picker کے قریب
     - User چاہے تو manually تبدیل کر سکتا ہے (override allowed)

2. **`supabase/functions/chat-ai/index.ts`**:
   - Request body میں اگر `assistant_id` آئے اور client نے `model_id` نہ بھیجا ہو، تو `assistants.default_model_id` استعمال کرے
   - User کا plan check برقرار رہے (`min_plan` validation)
   - اگر assistant کا default model user کے plan سے بڑا ہو → user کے plan کے لیے دستیاب fallback model پر گرے، toast دکھائیں

---

### Files to be edited / created

**Created:**
- `src/pages/HelpAssistants.tsx`

**Edited:**
- `src/App.tsx` — نیا route
- `src/components/layout/AppSidebar.tsx` — Help link
- `src/components/admin/AdminAssistants.tsx` — default model dropdown + badge
- `src/pages/Dashboard.tsx` — assistant select پر default model auto-set
- `src/pages/ProjectWorkspace.tsx` — same behavior + indicator
- `supabase/functions/chat-ai/index.ts` — server-side default model fallback

**No DB migration needed** (column پہلے سے موجود ہے)

---

### Out of scope
- Custom OpenAI/Anthropic API keys (Option B) — اگر بعد میں چاہیں تو الگ plan
- AI provider settings میں کوئی تبدیلی نہیں — Lovable AI Gateway جوں کا توں

