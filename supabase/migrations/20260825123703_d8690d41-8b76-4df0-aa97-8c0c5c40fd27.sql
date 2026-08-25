-- 1) Lock down SECURITY DEFINER functions
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated, PUBLIC;

-- Re-grant only the routines the app legitimately calls from the client
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_plan(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_payment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_payment(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_adjust_credits(uuid, integer, public.user_plan, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_trial_credits(uuid) TO authenticated;

-- Backend-only routines
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 2) Ownership-scoped write policies for the generated-images bucket
DROP POLICY IF EXISTS "Users upload own generated images" ON storage.objects;
CREATE POLICY "Users upload own generated images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'generated-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users update own generated images" ON storage.objects;
CREATE POLICY "Users update own generated images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'generated-images' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'generated-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users delete own generated images" ON storage.objects;
CREATE POLICY "Users delete own generated images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'generated-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3) Conversation summaries are backend-written only: make that explicit
REVOKE INSERT, UPDATE, DELETE ON public.conversation_summaries FROM anon, authenticated;
GRANT ALL ON public.conversation_summaries TO service_role;
