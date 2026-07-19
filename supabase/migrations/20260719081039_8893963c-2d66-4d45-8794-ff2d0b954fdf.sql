
-- 1) Assistants: image-prompt feature toggle + per-image credit cost
ALTER TABLE public.assistants
  ADD COLUMN IF NOT EXISTS provides_image_prompt boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS image_credits_cost integer NOT NULL DEFAULT 15;

-- 2) Extend transaction_kind enum with image_generation
ALTER TYPE public.transaction_kind ADD VALUE IF NOT EXISTS 'image_generation';

-- 3) Enable feature on BuildSight and VISUAL ARCHITECT
UPDATE public.assistants
  SET provides_image_prompt = true, image_credits_cost = 15
  WHERE id IN (
    '4c2ee91f-d4b1-408a-a66c-bf45b8b364c5',
    'c134128e-4291-4be2-89cb-09bd69049214'
  );

-- 4) Storage RLS for generated-images bucket:
-- Users can read/list their own files; only service role writes/deletes.
CREATE POLICY "Users can read own generated images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'generated-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
