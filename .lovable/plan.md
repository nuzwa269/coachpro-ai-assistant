
## Plan: Smart Context Management for Long Chats

Three coordinated changes — backend trimming + summarization, friendly error fallback, and a UI health indicator. No pricing changes.

---

### 1. Recent window + rolling summary (backend)

**File:** `supabase/functions/chat-ai/index.ts`

Add a new `conversation_summaries` table to store one rolling summary per conversation, plus durable facts.

**New table:**
```sql
create table public.conversation_summaries (
  conversation_id uuid primary key references conversations(id) on delete cascade,
  summary text not null default '',
  durable_facts text not null default '',  -- preferences, goals, decisions, key refs
  summarized_up_to_message_id uuid,        -- last message included in summary
  message_count_at_summary int default 0,
  updated_at timestamptz default now()
);
```
RLS: user can read summaries for their own conversations only; service role writes.

**Logic in `chat-ai`:**
- Fetch full message history from DB for `conversation_id` (don't trust client-sent array beyond the latest user message).
- Define `RECENT_WINDOW = 16` messages (8 turns).
- If total messages ≤ 16 → send as-is, no summary needed.
- If > 16 → build payload as:
  ```
  [system_prompt]
  [system: "Conversation summary so far: {summary}\n\nKey facts: {durable_facts}"]
  [last 16 messages raw]
  [new user message]
  ```
- After every 10 new messages past the threshold, async-trigger a summarization call (cheap model: `google/gemini-2.5-flash-lite`) that:
  - Takes the OLD summary + the messages now falling out of the recent window
  - Produces a new compressed summary + extracts durable facts (preferences, goals, decisions, file/code refs, open questions)
  - Upserts into `conversation_summaries`
- Summarization cost is absorbed by us (not deducted from user credits) — it's infrastructure.

**Why DB-driven, not client array:** prevents tampering, ensures summary stays in sync, and we control what the AI sees.

---

### 2. Friendly context-exceeded fallback

**File:** `supabase/functions/chat-ai/index.ts`

Wrap the provider call. On error response, detect:
- `context_length_exceeded` / `maximum context length` / status 400 with token-related message
- Anthropic `invalid_request_error` with input length

On detection:
1. Force an immediate aggressive summarization: collapse ALL but the last 6 messages into the summary.
2. Retry the request once.
3. If retry also fails → return `{ error: "chat_too_long", message: "..." }` with status 413.

**Frontend handling** in `src/pages/ProjectWorkspace.tsx`:
- Catch `chat_too_long` → show friendly dialog:
  - "This conversation has grown very large. We've saved a summary. Start a fresh chat to continue smoothly — your context is preserved."
  - Button: "Start new chat" (creates new conversation, optionally seeded with the summary as the first system note).

---

### 3. Chat health indicator (UI)

**File:** `src/pages/ProjectWorkspace.tsx` (workspace header area, near model name)

Replace any raw "X messages" idea with a **health pill** based on a composite score:

```
score = messageCount * 1 + totalCharsInLast20 / 2000
```

Buckets:
- `score < 20` → green dot · "Healthy"
- `score 20–50` → amber dot · "Getting long"
- `score > 50` → red dot · "Very long — consider new chat" + small "New chat" button inline

Tooltip on hover: "Chat length affects AI memory and response quality. Long chats are auto-summarized."

Subtle, fits in header. No numeric counter shown by default — only the qualitative signal, as requested.

---

### Technical notes

- New migration creates `conversation_summaries` + RLS.
- `chat-ai` does ONE extra `select` for summary on every call (negligible).
- Summarization is fire-and-forget after the user gets their reply (doesn't slow chat).
- Summarization uses `gemini-2.5-flash-lite` directly via Lovable AI gateway, hardcoded — not from `ai_models` table.
- Recent window of 16 is conservative; tunable via constant at top of `index.ts`.
- No changes to credit deduction logic, no changes to pricing UI.

### Files touched
- `supabase/migrations/<new>.sql` — new table + RLS
- `supabase/functions/chat-ai/index.ts` — DB-history fetch, summary injection, summarizer, error fallback
- `src/pages/ProjectWorkspace.tsx` — health pill, chat_too_long dialog, "Start new chat" handler

### Out of scope (per your instruction)
- Token-based per-message pricing — deferred.
