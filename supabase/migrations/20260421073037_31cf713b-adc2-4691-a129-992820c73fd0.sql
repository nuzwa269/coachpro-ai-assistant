ALTER TABLE public.assistants
  ADD COLUMN IF NOT EXISTS conversation_starters text[] NOT NULL DEFAULT '{}'::text[];