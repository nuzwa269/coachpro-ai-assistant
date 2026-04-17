
-- Add provider type enum
DO $$ BEGIN
  CREATE TYPE public.provider_type AS ENUM ('lovable', 'openai_compatible', 'anthropic');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add columns to ai_models
ALTER TABLE public.ai_models
  ADD COLUMN IF NOT EXISTS provider_type public.provider_type NOT NULL DEFAULT 'lovable',
  ADD COLUMN IF NOT EXISTS api_base_url text,
  ADD COLUMN IF NOT EXISTS api_model_name text,
  ADD COLUMN IF NOT EXISTS api_key_secret_name text;

-- Mark all existing rows as lovable provider (already default but be explicit)
UPDATE public.ai_models SET provider_type = 'lovable' WHERE provider_type IS NULL;
