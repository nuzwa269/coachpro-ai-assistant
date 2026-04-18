
CREATE TABLE public.conversation_summaries (
  conversation_id UUID PRIMARY KEY REFERENCES public.conversations(id) ON DELETE CASCADE,
  summary TEXT NOT NULL DEFAULT '',
  durable_facts TEXT NOT NULL DEFAULT '',
  summarized_up_to_message_id UUID,
  message_count_at_summary INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.conversation_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own conversation summaries"
ON public.conversation_summaries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_summaries.conversation_id
      AND c.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE TRIGGER set_conversation_summaries_updated_at
BEFORE UPDATE ON public.conversation_summaries
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
