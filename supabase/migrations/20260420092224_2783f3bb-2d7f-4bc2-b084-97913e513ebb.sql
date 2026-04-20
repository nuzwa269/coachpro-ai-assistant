-- Add sort_order to assistants for admin-controlled ordering of prebuilt assistants
ALTER TABLE public.assistants
ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Backfill existing prebuilt assistants with an initial order based on name
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) * 10 AS rn
  FROM public.assistants
  WHERE is_prebuilt = true
)
UPDATE public.assistants a
SET sort_order = o.rn
FROM ordered o
WHERE a.id = o.id;

-- Helpful index for ordered reads
CREATE INDEX IF NOT EXISTS idx_assistants_prebuilt_sort
ON public.assistants (is_prebuilt, sort_order, name);