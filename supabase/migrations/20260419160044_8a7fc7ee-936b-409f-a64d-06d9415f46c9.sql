-- Allow deleting assistants without breaking past conversations.
-- Make conversations.assistant_id nullable and switch FK to ON DELETE SET NULL.

ALTER TABLE public.conversations
  ALTER COLUMN assistant_id DROP NOT NULL;

ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_assistant_id_fkey;

ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_assistant_id_fkey
  FOREIGN KEY (assistant_id)
  REFERENCES public.assistants(id)
  ON DELETE SET NULL;