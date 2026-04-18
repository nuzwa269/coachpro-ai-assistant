-- 1. Add trial-credit columns
ALTER TABLE public.payment_requests
  ADD COLUMN IF NOT EXISTS trial_credits_granted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_credits_amount INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trial_credits_reverted BOOLEAN NOT NULL DEFAULT false;

-- 2. Extend transaction_kind enum (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'trial_grant'
                 AND enumtypid = 'public.transaction_kind'::regtype) THEN
    ALTER TYPE public.transaction_kind ADD VALUE 'trial_grant';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'trial_revert'
                 AND enumtypid = 'public.transaction_kind'::regtype) THEN
    ALTER TYPE public.transaction_kind ADD VALUE 'trial_revert';
  END IF;
END$$;

-- 3. grant_trial_credits: callable by payment owner, idempotent, lifetime once per user
CREATE OR REPLACE FUNCTION public.grant_trial_credits(_payment_id uuid)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment RECORD;
  v_already_used BOOLEAN;
  v_plan public.user_plan;
  v_current_credits INT;
  v_amount INT := 50;
  v_new_balance INT;
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_payment FROM public.payment_requests WHERE id = _payment_id FOR UPDATE;
  IF v_payment IS NULL THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;
  IF v_payment.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  -- Already granted on this payment? Idempotent return.
  IF v_payment.trial_credits_granted_at IS NOT NULL THEN
    RETURN 0;
  END IF;

  -- Only on pending payments
  IF v_payment.status <> 'pending' THEN
    RETURN 0;
  END IF;

  -- Lifetime once per user across all payments
  SELECT EXISTS (
    SELECT 1 FROM public.payment_requests
    WHERE user_id = auth.uid()
      AND id <> _payment_id
      AND trial_credits_granted_at IS NOT NULL
  ) INTO v_already_used;
  IF v_already_used THEN
    RETURN 0;
  END IF;

  SELECT plan, credits INTO v_plan, v_current_credits
  FROM public.profiles WHERE id = auth.uid() FOR UPDATE;

  -- Only free plan users (paid users already have credits) and only if running low
  IF v_plan <> 'free' THEN
    RETURN 0;
  END IF;
  IF v_current_credits >= v_amount THEN
    RETURN 0;
  END IF;

  v_new_balance := v_current_credits + v_amount;
  UPDATE public.profiles SET credits = v_new_balance, updated_at = now() WHERE id = auth.uid();

  UPDATE public.payment_requests
    SET trial_credits_granted_at = now(),
        trial_credits_amount = v_amount
    WHERE id = _payment_id;

  INSERT INTO public.credit_transactions (user_id, amount, kind, balance_after, reference_id, notes)
  VALUES (auth.uid(), v_amount, 'trial_grant', v_new_balance, _payment_id,
          'Instant trial credits while payment is reviewed');

  RETURN v_amount;
END;
$$;

-- 4. Update approve_payment to subtract trial amount already granted
CREATE OR REPLACE FUNCTION public.approve_payment(_payment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment RECORD;
  v_full_credits INT := 0;
  v_credits_to_add INT := 0;
  v_new_plan public.user_plan;
  v_new_balance INT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve payments';
  END IF;

  SELECT * INTO v_payment FROM public.payment_requests WHERE id = _payment_id FOR UPDATE;
  IF v_payment IS NULL OR v_payment.status <> 'pending' THEN
    RAISE EXCEPTION 'Payment not found or already processed';
  END IF;

  IF v_payment.kind = 'subscription' THEN
    SELECT monthly_credits INTO v_full_credits FROM public.subscription_plans WHERE id = v_payment.plan_id;
    v_new_plan := v_payment.plan_id::public.user_plan;
    -- Subtract trial already granted (clamped at 0)
    v_credits_to_add := GREATEST(v_full_credits - COALESCE(v_payment.trial_credits_amount, 0), 0);
    UPDATE public.profiles
      SET plan = v_new_plan,
          credits = credits + v_credits_to_add,
          plan_renews_at = now() + INTERVAL '30 days',
          updated_at = now()
      WHERE id = v_payment.user_id
      RETURNING credits INTO v_new_balance;
    INSERT INTO public.credit_transactions (user_id, amount, kind, balance_after, reference_id, notes)
    VALUES (v_payment.user_id, v_credits_to_add, 'subscription_grant', v_new_balance, _payment_id,
            'Plan: ' || v_payment.plan_id ||
            CASE WHEN COALESCE(v_payment.trial_credits_amount,0) > 0
                 THEN ' (minus ' || v_payment.trial_credits_amount || ' trial)'
                 ELSE '' END);
  ELSE
    SELECT credits INTO v_full_credits FROM public.credit_packs WHERE id = v_payment.pack_id;
    v_credits_to_add := GREATEST(v_full_credits - COALESCE(v_payment.trial_credits_amount, 0), 0);
    UPDATE public.profiles
      SET credits = credits + v_credits_to_add, updated_at = now()
      WHERE id = v_payment.user_id
      RETURNING credits INTO v_new_balance;
    INSERT INTO public.credit_transactions (user_id, amount, kind, balance_after, reference_id, notes)
    VALUES (v_payment.user_id, v_credits_to_add, 'pack_purchase', v_new_balance, _payment_id,
            'Credit pack' ||
            CASE WHEN COALESCE(v_payment.trial_credits_amount,0) > 0
                 THEN ' (minus ' || v_payment.trial_credits_amount || ' trial)'
                 ELSE '' END);
  END IF;

  UPDATE public.payment_requests
    SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
    WHERE id = _payment_id;
END;
$$;

-- 5. reject_payment: admin only, reverts trial credits if any
CREATE OR REPLACE FUNCTION public.reject_payment(_payment_id uuid, _admin_notes text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment RECORD;
  v_current INT;
  v_revert INT;
  v_new_balance INT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can reject payments';
  END IF;

  SELECT * INTO v_payment FROM public.payment_requests WHERE id = _payment_id FOR UPDATE;
  IF v_payment IS NULL OR v_payment.status <> 'pending' THEN
    RAISE EXCEPTION 'Payment not found or already processed';
  END IF;

  -- Revert trial credits if granted and not already reverted
  IF v_payment.trial_credits_granted_at IS NOT NULL
     AND NOT v_payment.trial_credits_reverted
     AND COALESCE(v_payment.trial_credits_amount, 0) > 0 THEN
    SELECT credits INTO v_current FROM public.profiles WHERE id = v_payment.user_id FOR UPDATE;
    v_revert := LEAST(v_current, v_payment.trial_credits_amount);
    v_new_balance := v_current - v_revert;
    UPDATE public.profiles SET credits = v_new_balance, updated_at = now() WHERE id = v_payment.user_id;
    INSERT INTO public.credit_transactions (user_id, amount, kind, balance_after, reference_id, notes)
    VALUES (v_payment.user_id, -v_revert, 'trial_revert', v_new_balance, _payment_id,
            'Trial credits reverted (payment rejected)');
  END IF;

  UPDATE public.payment_requests
    SET status = 'rejected',
        admin_notes = _admin_notes,
        reviewed_by = auth.uid(),
        reviewed_at = now(),
        trial_credits_reverted = (v_payment.trial_credits_granted_at IS NOT NULL)
    WHERE id = _payment_id;
END;
$$;

-- 6. Enable realtime on payment_requests
ALTER TABLE public.payment_requests REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'payment_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_requests;
  END IF;
END$$;