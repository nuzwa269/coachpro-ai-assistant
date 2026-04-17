
-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.user_plan AS ENUM ('free', 'basic', 'pro');
CREATE TYPE public.payment_method AS ENUM ('jazzcash', 'easypaisa', 'bank_transfer', 'whatsapp');
CREATE TYPE public.payment_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.payment_kind AS ENUM ('subscription', 'credit_pack');
CREATE TYPE public.transaction_kind AS ENUM ('signup_bonus', 'subscription_grant', 'pack_purchase', 'message_deduct', 'admin_adjust', 'refund');
CREATE TYPE public.model_category AS ENUM ('text', 'image', 'reasoning');

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT NOT NULL,
  avatar_url TEXT,
  plan public.user_plan NOT NULL DEFAULT 'free',
  credits INT NOT NULL DEFAULT 0,
  plan_renews_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER ROLES (separate table — security best practice)
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper to get current user's plan
CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id UUID)
RETURNS public.user_plan
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT plan FROM public.profiles WHERE id = _user_id
$$;

-- ============================================
-- AI MODELS (admin-managed, editable pricing)
-- ============================================
CREATE TABLE public.ai_models (
  id TEXT PRIMARY KEY, -- e.g. 'google/gemini-3-flash-preview'
  display_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  category public.model_category NOT NULL DEFAULT 'text',
  credits_cost INT NOT NULL DEFAULT 1 CHECK (credits_cost > 0),
  min_plan public.user_plan NOT NULL DEFAULT 'free',
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ASSISTANTS (prebuilt + custom)
-- ============================================
CREATE TABLE public.assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for prebuilt
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Bot',
  category TEXT,
  is_prebuilt BOOLEAN NOT NULL DEFAULT false,
  default_model_id TEXT REFERENCES public.ai_models(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_assistants_owner ON public.assistants(owner_id);
CREATE INDEX idx_assistants_prebuilt ON public.assistants(is_prebuilt) WHERE is_prebuilt = true;

-- ============================================
-- USER ACTIVE ASSISTANTS (free user picks 1 prebuilt)
-- ============================================
CREATE TABLE public.user_active_assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assistant_id UUID NOT NULL REFERENCES public.assistants(id) ON DELETE CASCADE,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, assistant_id)
);
ALTER TABLE public.user_active_assistants ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_active_assistants_user ON public.user_active_assistants(user_id);

-- Trigger: enforce free user can only activate 1 prebuilt
CREATE OR REPLACE FUNCTION public.enforce_active_assistant_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan public.user_plan;
  v_count INT;
BEGIN
  SELECT plan INTO v_plan FROM public.profiles WHERE id = NEW.user_id;
  IF v_plan = 'free' THEN
    SELECT COUNT(*) INTO v_count FROM public.user_active_assistants WHERE user_id = NEW.user_id;
    IF v_count >= 1 THEN
      RAISE EXCEPTION 'Free plan allows only 1 active prebuilt assistant. Deactivate the current one first or upgrade.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_enforce_active_assistant
  BEFORE INSERT ON public.user_active_assistants
  FOR EACH ROW EXECUTE FUNCTION public.enforce_active_assistant_limit();

-- ============================================
-- PROJECTS
-- ============================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_projects_user ON public.projects(user_id);

-- Trigger: enforce free user max 3 projects
CREATE OR REPLACE FUNCTION public.enforce_project_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan public.user_plan;
  v_count INT;
BEGIN
  SELECT plan INTO v_plan FROM public.profiles WHERE id = NEW.user_id;
  IF v_plan = 'free' THEN
    SELECT COUNT(*) INTO v_count FROM public.projects WHERE user_id = NEW.user_id;
    IF v_count >= 3 THEN
      RAISE EXCEPTION 'Free plan allows max 3 projects. Upgrade to create more.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_enforce_project_limit
  BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.enforce_project_limit();

-- Trigger: enforce free user max 1 custom assistant
CREATE OR REPLACE FUNCTION public.enforce_custom_assistant_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan public.user_plan;
  v_count INT;
BEGIN
  IF NEW.is_prebuilt = true OR NEW.owner_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT plan INTO v_plan FROM public.profiles WHERE id = NEW.owner_id;
  IF v_plan = 'free' THEN
    SELECT COUNT(*) INTO v_count FROM public.assistants
      WHERE owner_id = NEW.owner_id AND is_prebuilt = false;
    IF v_count >= 1 THEN
      RAISE EXCEPTION 'Free plan allows max 1 custom assistant. Upgrade to create more.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_enforce_custom_assistant
  BEFORE INSERT ON public.assistants
  FOR EACH ROW EXECUTE FUNCTION public.enforce_custom_assistant_limit();

-- ============================================
-- CONVERSATIONS
-- ============================================
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  assistant_id UUID NOT NULL REFERENCES public.assistants(id) ON DELETE RESTRICT,
  title TEXT NOT NULL DEFAULT 'New conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_conversations_project ON public.conversations(project_id);
CREATE INDEX idx_conversations_user ON public.conversations(user_id);

-- ============================================
-- MESSAGES
-- ============================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model_id TEXT REFERENCES public.ai_models(id) ON DELETE SET NULL,
  credits_used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_user ON public.messages(user_id);

-- ============================================
-- SAVED RESPONSES
-- ============================================
CREATE TABLE public.saved_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, message_id)
);
ALTER TABLE public.saved_responses ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_saved_user ON public.saved_responses(user_id);

-- Trigger: enforce free user max 10 saved responses
CREATE OR REPLACE FUNCTION public.enforce_saved_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan public.user_plan;
  v_count INT;
BEGIN
  SELECT plan INTO v_plan FROM public.profiles WHERE id = NEW.user_id;
  IF v_plan = 'free' THEN
    SELECT COUNT(*) INTO v_count FROM public.saved_responses WHERE user_id = NEW.user_id;
    IF v_count >= 10 THEN
      RAISE EXCEPTION 'Free plan allows max 10 saved responses. Upgrade for more.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_enforce_saved_limit
  BEFORE INSERT ON public.saved_responses
  FOR EACH ROW EXECUTE FUNCTION public.enforce_saved_limit();

-- ============================================
-- SUBSCRIPTION PLANS (catalog)
-- ============================================
CREATE TABLE public.subscription_plans (
  id TEXT PRIMARY KEY, -- 'free' | 'basic' | 'pro'
  name TEXT NOT NULL,
  price_pkr INT NOT NULL DEFAULT 0,
  monthly_credits INT NOT NULL DEFAULT 0,
  max_projects INT, -- NULL = unlimited
  max_custom_assistants INT,
  max_saved_responses INT,
  features JSONB NOT NULL DEFAULT '[]',
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREDIT PACKS (catalog)
-- ============================================
CREATE TABLE public.credit_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INT NOT NULL CHECK (credits > 0),
  price_pkr INT NOT NULL CHECK (price_pkr > 0),
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PAYMENT REQUESTS
-- ============================================
CREATE TABLE public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.payment_kind NOT NULL,
  plan_id TEXT REFERENCES public.subscription_plans(id),
  pack_id UUID REFERENCES public.credit_packs(id),
  amount_pkr INT NOT NULL CHECK (amount_pkr > 0),
  method public.payment_method NOT NULL,
  sender_name TEXT,
  sender_phone TEXT,
  reference_no TEXT,
  proof_url TEXT,
  notes TEXT,
  status public.payment_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((kind = 'subscription' AND plan_id IS NOT NULL) OR (kind = 'credit_pack' AND pack_id IS NOT NULL))
);
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_payments_user ON public.payment_requests(user_id);
CREATE INDEX idx_payments_status ON public.payment_requests(status);

-- ============================================
-- CREDIT TRANSACTIONS (audit log)
-- ============================================
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INT NOT NULL, -- positive = credit, negative = debit
  kind public.transaction_kind NOT NULL,
  balance_after INT NOT NULL,
  reference_id UUID, -- payment_request.id or message.id
  model_id TEXT REFERENCES public.ai_models(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tx_user ON public.credit_transactions(user_id, created_at DESC);

-- ============================================
-- AUTO-CREATE PROFILE + ROLE + 20 BONUS CREDITS ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, credits, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    20,
    'free'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  INSERT INTO public.credit_transactions (user_id, amount, kind, balance_after, notes)
  VALUES (NEW.id, 20, 'signup_bonus', 20, 'Welcome bonus');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- DEDUCT CREDITS FUNCTION (atomic, used by edge function)
-- ============================================
CREATE OR REPLACE FUNCTION public.deduct_credits(
  _user_id UUID,
  _model_id TEXT,
  _conversation_id UUID,
  _message_id UUID
)
RETURNS INT -- returns credits used
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost INT;
  v_balance INT;
  v_new_balance INT;
BEGIN
  SELECT credits_cost INTO v_cost FROM public.ai_models WHERE id = _model_id AND is_active = true;
  IF v_cost IS NULL THEN
    RAISE EXCEPTION 'Model % not available', _model_id;
  END IF;
  SELECT credits INTO v_balance FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF v_balance < v_cost THEN
    RAISE EXCEPTION 'Insufficient credits. Need %, have %.', v_cost, v_balance;
  END IF;
  v_new_balance := v_balance - v_cost;
  UPDATE public.profiles SET credits = v_new_balance, updated_at = now() WHERE id = _user_id;
  INSERT INTO public.credit_transactions (user_id, amount, kind, balance_after, reference_id, model_id)
  VALUES (_user_id, -v_cost, 'message_deduct', v_new_balance, _message_id, _model_id);
  RETURN v_cost;
END;
$$;

-- ============================================
-- APPROVE PAYMENT FUNCTION (admin grants credits/plan)
-- ============================================
CREATE OR REPLACE FUNCTION public.approve_payment(_payment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment RECORD;
  v_credits_to_add INT := 0;
  v_new_plan public.user_plan;
  v_new_balance INT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve payments';
  END IF;

  SELECT * INTO v_payment FROM public.payment_requests WHERE id = _payment_id FOR UPDATE;
  IF v_payment IS NULL OR v_payment.status != 'pending' THEN
    RAISE EXCEPTION 'Payment not found or already processed';
  END IF;

  IF v_payment.kind = 'subscription' THEN
    SELECT monthly_credits INTO v_credits_to_add FROM public.subscription_plans WHERE id = v_payment.plan_id;
    v_new_plan := v_payment.plan_id::public.user_plan;
    UPDATE public.profiles
      SET plan = v_new_plan,
          credits = credits + v_credits_to_add,
          plan_renews_at = now() + INTERVAL '30 days',
          updated_at = now()
      WHERE id = v_payment.user_id
      RETURNING credits INTO v_new_balance;
    INSERT INTO public.credit_transactions (user_id, amount, kind, balance_after, reference_id, notes)
    VALUES (v_payment.user_id, v_credits_to_add, 'subscription_grant', v_new_balance, _payment_id, 'Plan: ' || v_payment.plan_id);
  ELSE
    SELECT credits INTO v_credits_to_add FROM public.credit_packs WHERE id = v_payment.pack_id;
    UPDATE public.profiles
      SET credits = credits + v_credits_to_add, updated_at = now()
      WHERE id = v_payment.user_id
      RETURNING credits INTO v_new_balance;
    INSERT INTO public.credit_transactions (user_id, amount, kind, balance_after, reference_id, notes)
    VALUES (v_payment.user_id, v_credits_to_add, 'pack_purchase', v_new_balance, _payment_id, 'Credit pack');
  END IF;

  UPDATE public.payment_requests
    SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
    WHERE id = _payment_id;
END;
$$;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER t_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_assistants_updated BEFORE UPDATE ON public.assistants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_conversations_updated BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_models_updated BEFORE UPDATE ON public.ai_models FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_plans_updated BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- RLS POLICIES
-- ============================================

-- profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins update any profile" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ai_models — everyone authenticated can read active; admins manage
CREATE POLICY "Anyone reads active models" ON public.ai_models FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage models" ON public.ai_models FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- assistants — prebuilt readable by all; custom only by owner
CREATE POLICY "Read prebuilt or own assistants" ON public.assistants FOR SELECT TO authenticated USING (is_prebuilt = true OR owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own custom" ON public.assistants FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND is_prebuilt = false);
CREATE POLICY "Admins create prebuilt" ON public.assistants FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own custom" ON public.assistants FOR UPDATE TO authenticated USING (owner_id = auth.uid() AND is_prebuilt = false);
CREATE POLICY "Admins update any" ON public.assistants FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users delete own custom" ON public.assistants FOR DELETE TO authenticated USING (owner_id = auth.uid() AND is_prebuilt = false);
CREATE POLICY "Admins delete any" ON public.assistants FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- user_active_assistants
CREATE POLICY "Users manage own active" ON public.user_active_assistants FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins view all active" ON public.user_active_assistants FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- projects
CREATE POLICY "Users manage own projects" ON public.projects FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins view all projects" ON public.projects FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- conversations
CREATE POLICY "Users manage own conversations" ON public.conversations FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins view all conversations" ON public.conversations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- messages
CREATE POLICY "Users manage own messages" ON public.messages FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins view all messages" ON public.messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- saved_responses
CREATE POLICY "Users manage own saved" ON public.saved_responses FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins view all saved" ON public.saved_responses FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- subscription_plans + credit_packs
CREATE POLICY "Anyone reads active plans" ON public.subscription_plans FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage plans" ON public.subscription_plans FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone reads active packs" ON public.credit_packs FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage packs" ON public.credit_packs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- payment_requests
CREATE POLICY "Users view own payments" ON public.payment_requests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users create own payments" ON public.payment_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "Admins view all payments" ON public.payment_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update payments" ON public.payment_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- credit_transactions (read-only for users)
CREATE POLICY "Users view own transactions" ON public.credit_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins view all transactions" ON public.credit_transactions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false) ON CONFLICT DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own proof" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users view own proof" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins view all proofs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));
