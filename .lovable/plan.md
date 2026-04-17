

# Final Decisions Locked

## 1. Free User — Choose Any 1 Prebuilt Assistant
Free user signup ke baad **kisi bhi 1 prebuilt assistant** ko activate kar sakta hai (Code Tutor / System Architect / Debug Helper / Tech Explainer — koi bhi). Baqi 3 lock honge. Switch karna chahe to current active wala deactivate karke doosra activate kare (sirf 1 active at a time).

**DB change:**
- `assistants` table se `min_plan` column hata diya — sab prebuilt sab ke liye visible hain (badges ke saath)
- New table **`user_active_assistants`**: `user_id`, `assistant_id`, `activated_at` — free user ke liye max 1 row (DB trigger se enforce)
- Paid users (basic/pro) ke liye unlimited rows (sab unlock)

**UI:**
- Assistants page par har prebuilt card par button: "Activate" (free user). Ek active hone ke baad baqi par "Locked — switch karne ke liye current ko deactivate karein"
- Active assistant par green checkmark badge

## 2. Per-Model Credit Pricing — Editable Anytime ✓
Haan, **bilkul baad mein bhi badal sakte hain** bina code change ke. Pricing `ai_models` table mein store hogi (DB row), code mein hardcoded nahi.

**Admin Panel → AI Models tab mein:**
- Har model ke saamne `credits_cost` field editable
- "Save" karte hi naya cost foran apply ho jayega (next message se)
- Naya model add karna ho to "Add Model" button — model ID, name, cost set karein
- Model band karna ho to `is_active = false` toggle

**Initial pricing** (jo aap ne approve kiya): 1 credit (cheap) se 10 credits (premium GPT) tak. Ye sirf **starting values** hain — kabhi bhi admin panel se badal sakte hain.

## 3. Confirmed Final Rules

| Setting | Value |
|---|---|
| Signup credits | **20** (one-time) |
| Free projects | 3 max |
| Free prebuilt assistants | **Any 1 of 4** (user chooses) |
| Free custom assistants | 1 max |
| Free saved responses | 10 max |
| Per-model pricing | Stored in DB, admin-editable |
| Pricing changes | Live via Admin Panel, no code |

## Next Step
Sab decisions ab final hain. **Implementation shuru karne ke liye approve karein** — main ye order mein build karunga:

1. Lovable Cloud enable + Email/Google auth (login/signup pages real)
2. DB migrations: enums, all tables, RLS policies, triggers, functions
3. Seed data: prebuilt assistants + AI models + plans + packs
4. Wire frontend (Dashboard, Projects, Workspace, Saved, Settings) to real DB
5. BuyCredits — real payment_requests submit
6. Admin Panel (`/admin`) — Users, Payments, AI Models, Assistants, Plans tabs
7. AI chat integration via Lovable AI Gateway with per-model deduction

Approve karein to step 1 se shuru karta hun.

