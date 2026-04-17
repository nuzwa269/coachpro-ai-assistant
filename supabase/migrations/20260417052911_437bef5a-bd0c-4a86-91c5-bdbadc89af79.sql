
-- Fix: set search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Fix: scope avatar SELECT to own folder (still publicly readable for direct URL access via signed/public URLs from the bucket itself)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Users view own avatar files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Public can view avatars by direct path" ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'avatars');

-- =====================================
-- SEED: AI MODELS
-- =====================================
INSERT INTO public.ai_models (id, display_name, provider, category, credits_cost, min_plan, description) VALUES
  ('google/gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite', 'google', 'text', 1, 'free', 'Fastest and cheapest. Great for simple tasks.'),
  ('google/gemini-3-flash-preview', 'Gemini 3 Flash', 'google', 'text', 1, 'free', 'Fast next-gen model. Balanced and efficient.'),
  ('google/gemini-2.5-flash', 'Gemini 2.5 Flash', 'google', 'text', 2, 'basic', 'Balanced cost and quality.'),
  ('openai/gpt-5-nano', 'GPT-5 Nano', 'openai', 'text', 2, 'basic', 'Fast and efficient OpenAI model.'),
  ('openai/gpt-5-mini', 'GPT-5 Mini', 'openai', 'text', 3, 'basic', 'Strong reasoning at lower cost.'),
  ('google/gemini-2.5-pro', 'Gemini 2.5 Pro', 'google', 'reasoning', 5, 'pro', 'Top-tier reasoning and large context.'),
  ('google/gemini-3.1-pro-preview', 'Gemini 3.1 Pro', 'google', 'reasoning', 6, 'pro', 'Latest preview reasoning model.'),
  ('openai/gpt-5', 'GPT-5', 'openai', 'reasoning', 8, 'pro', 'Excellent reasoning and accuracy.'),
  ('openai/gpt-5.2', 'GPT-5.2', 'openai', 'reasoning', 10, 'pro', 'OpenAI''s latest, most powerful model.'),
  ('google/gemini-2.5-flash-image', 'Nano Banana (Image)', 'google', 'image', 4, 'basic', 'Image generation from text.'),
  ('google/gemini-3.1-flash-image-preview', 'Nano Banana 2 (Image)', 'google', 'image', 5, 'basic', 'Faster image gen with Pro quality.'),
  ('google/gemini-3-pro-image-preview', 'Gemini 3 Pro Image', 'google', 'image', 8, 'pro', 'Premium image generation.');

-- =====================================
-- SEED: PREBUILT ASSISTANTS
-- =====================================
INSERT INTO public.assistants (owner_id, name, description, system_prompt, icon, category, is_prebuilt, default_model_id) VALUES
  (NULL, 'Code Tutor', 'Learn programming concepts with clear explanations and examples', 'You are a friendly, patient programming tutor. Explain concepts in simple terms with practical code examples. Always check understanding before moving on.', 'GraduationCap', 'Education', true, 'google/gemini-3-flash-preview'),
  (NULL, 'System Architect', 'Design scalable software architectures and system diagrams', 'You are an expert system architect. Help design scalable, maintainable software systems. Discuss tradeoffs, patterns, and best practices.', 'Building2', 'Architecture', true, 'google/gemini-3-flash-preview'),
  (NULL, 'Debug Helper', 'Find and fix bugs in your code with step-by-step guidance', 'You are a debugging expert. Help users identify, isolate, and fix bugs. Ask clarifying questions, suggest hypotheses, and walk through fixes step by step.', 'Bug', 'Development', true, 'google/gemini-3-flash-preview'),
  (NULL, 'Tech Explainer', 'Understand complex tech concepts in simple language', 'You explain complex technology topics in simple, accessible language. Use analogies and real-world examples. Avoid jargon unless you define it.', 'Lightbulb', 'Education', true, 'google/gemini-3-flash-preview');

-- =====================================
-- SEED: SUBSCRIPTION PLANS
-- =====================================
INSERT INTO public.subscription_plans (id, name, price_pkr, monthly_credits, max_projects, max_custom_assistants, max_saved_responses, features, is_popular, sort_order) VALUES
  ('free', 'Free', 0, 0, 3, 1, 10, '["20 signup credits","1 prebuilt assistant","3 projects","Basic chat history"]'::jsonb, false, 1),
  ('basic', 'Basic', 999, 100, NULL, 5, 100, '["100 credits/month","All prebuilt assistants","Unlimited projects","5 custom assistants","Save up to 100 responses","Priority support"]'::jsonb, true, 2),
  ('pro', 'Pro', 2499, 500, NULL, NULL, NULL, '["500 credits/month","All prebuilt assistants","Unlimited projects","Unlimited custom assistants","Unlimited saved responses","Premium AI models","Priority support"]'::jsonb, false, 3);

-- =====================================
-- SEED: CREDIT PACKS
-- =====================================
INSERT INTO public.credit_packs (name, credits, price_pkr, is_popular, sort_order) VALUES
  ('Starter', 50, 299, false, 1),
  ('Popular', 200, 999, true, 2),
  ('Power User', 500, 1999, false, 3);
