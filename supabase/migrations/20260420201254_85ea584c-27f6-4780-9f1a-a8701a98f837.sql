-- 1. AI MODELS: hide sensitive provider/secret columns from non-admin users via a sanitized view
-- Drop the broad SELECT policy and replace with admin-only on the table.
DROP POLICY IF EXISTS "Anyone reads active models" ON public.ai_models;

CREATE POLICY "Admins read all model rows"
  ON public.ai_models FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Sanitized view (no api_base_url, api_model_name, api_key_secret_name).
CREATE OR REPLACE VIEW public.ai_models_public
WITH (security_invoker = true) AS
SELECT
  id, display_name, provider, category, credits_cost,
  min_plan, is_active, description, provider_type,
  created_at, updated_at
FROM public.ai_models
WHERE is_active = true;

GRANT SELECT ON public.ai_models_public TO authenticated, anon;

-- Allow authenticated users to read active models through the view by adding a
-- permissive SELECT policy that only exposes safe columns. Since RLS applies on
-- the base table for the view (security_invoker), we add an extra policy that
-- restricts non-admin reads, but only when sensitive columns are NOT being
-- selected is impossible at policy level — therefore we keep the table
-- admin-only and require app code to use the view for non-admin reads.

-- 2. USER_ROLES: prevent admins from removing their own admin role (avoid lockout/escalation games)
DROP POLICY IF EXISTS "Only admins delete roles" ON public.user_roles;
CREATE POLICY "Only admins delete roles (not self admin)"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND NOT (user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Only admins update roles" ON public.user_roles;
CREATE POLICY "Only admins update roles (not self admin)"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    AND NOT (user_id = auth.uid() AND role <> 'admin')
  );

-- 3. ADMIN CREDIT ADJUSTMENTS: SECURITY DEFINER RPC with audit log
CREATE OR REPLACE FUNCTION public.admin_adjust_credits(
  _user_id uuid,
  _new_credits integer,
  _new_plan public.user_plan DEFAULT NULL,
  _notes text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current INT;
  v_delta INT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can adjust credits';
  END IF;
  IF _new_credits < 0 THEN
    RAISE EXCEPTION 'Credits cannot be negative';
  END IF;

  SELECT credits INTO v_current FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF v_current IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  v_delta := _new_credits - v_current;

  UPDATE public.profiles
    SET credits = _new_credits,
        plan = COALESCE(_new_plan, plan),
        updated_at = now()
    WHERE id = _user_id;

  IF v_delta <> 0 THEN
    INSERT INTO public.credit_transactions (user_id, amount, kind, balance_after, notes)
    VALUES (_user_id, v_delta, 'admin_adjust', _new_credits,
            COALESCE(_notes, 'Admin adjustment (' || CASE WHEN v_delta > 0 THEN '+' ELSE '' END || v_delta || ') by ' || auth.uid()::text));
  END IF;

  RETURN v_delta;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_adjust_credits(uuid, integer, public.user_plan, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_adjust_credits(uuid, integer, public.user_plan, text) TO authenticated;