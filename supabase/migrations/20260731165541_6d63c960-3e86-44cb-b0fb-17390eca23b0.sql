-- 1. Plans catalog
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  name_ar text NOT NULL,
  tagline text,
  tagline_ar text,
  price_usd numeric NOT NULL DEFAULT 0,
  price_yearly_usd numeric,
  icon text NOT NULL DEFAULT 'sparkles',
  gradient text NOT NULL DEFAULT 'from-emerald-400 to-green-600',
  accent text NOT NULL DEFAULT '#08A045',
  badge_color text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_public_read" ON public.subscription_plans FOR SELECT USING (is_active);
CREATE POLICY "plans_admin_all" ON public.subscription_plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Feature catalog
CREATE TABLE IF NOT EXISTS public.plan_features (
  key text PRIMARY KEY,
  name text NOT NULL,
  name_ar text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plan_features TO anon, authenticated;
GRANT ALL ON public.plan_features TO service_role;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "features_public_read" ON public.plan_features FOR SELECT USING (true);
CREATE POLICY "features_admin_all" ON public.plan_features FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 3. Entitlements mapping
CREATE TABLE IF NOT EXISTS public.plan_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id text NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  feature_key text NOT NULL REFERENCES public.plan_features(key) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  limit_value integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, feature_key)
);
GRANT SELECT ON public.plan_entitlements TO anon, authenticated;
GRANT ALL ON public.plan_entitlements TO service_role;
ALTER TABLE public.plan_entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entitlements_public_read" ON public.plan_entitlements FOR SELECT USING (true);
CREATE POLICY "entitlements_admin_all" ON public.plan_entitlements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 4. Extend user_subscriptions with dynamic plan reference + expiry
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS plan_id text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS started_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS activated_by uuid,
  ADD COLUMN IF NOT EXISTS payment_ref text;

-- 5. Seed plans
INSERT INTO public.subscription_plans (id,name,name_ar,tagline,tagline_ar,price_usd,price_yearly_usd,icon,gradient,accent,badge_color,sort_order,is_public)
VALUES
 ('free','Free','مجاني','Basics for everyone','الأساسيات للجميع',0,0,'sparkles','from-zinc-500 to-zinc-700','#71717a',NULL,0,false),
 ('personal','Personal','شخصي','For personal users','للمستخدمين الأفراد',5,50,'sparkles','from-emerald-400 via-emerald-500 to-green-600','#08A045','#08A045',1,true),
 ('business','Business','أعمال','For companies and brands','للشركات والعلامات التجارية',30,300,'building','from-fuchsia-400 via-purple-500 to-violet-600','#a855f7','#FFD700',2,true),
 ('government','Government','حكومي','For official institutions','للمؤسسات الرسمية',0,0,'landmark','from-amber-300 via-yellow-500 to-amber-600','#FFD700','#9CA3AF',3,true)
ON CONFLICT (id) DO NOTHING;

-- 6. Seed features
INSERT INTO public.plan_features (key,name,name_ar,category,sort_order) VALUES
 ('verification_badge','Verification Badge','شارة التوثيق','identity',1),
 ('analytics','Analytics','الإحصائيات','insights',2),
 ('business_dashboard','Business Dashboard','لوحة الأعمال','business',3),
 ('government_features','Government Features','الميزات الحكومية','government',4),
 ('priority_support','Priority Support','الدعم ذو الأولوية','support',5),
 ('advanced_privacy','Advanced Privacy','الخصوصية المتقدمة','privacy',6),
 ('promotion_tools','Promotion Tools','أدوات الترويج','business',7),
 ('extended_uploads','Extended Upload Limits','حدود رفع موسعة','media',8),
 ('ad_free','Ad Free','بدون إعلانات','media',9),
 ('team_members','Team Members','أعضاء الفريق','business',10)
ON CONFLICT (key) DO NOTHING;

-- 7. Seed entitlements
INSERT INTO public.plan_entitlements (plan_id, feature_key, enabled, limit_value) VALUES
 ('personal','verification_badge',true,NULL),
 ('personal','advanced_privacy',true,NULL),
 ('personal','ad_free',true,NULL),
 ('personal','extended_uploads',true,1024),
 ('personal','analytics',true,NULL),
 ('business','verification_badge',true,NULL),
 ('business','analytics',true,NULL),
 ('business','business_dashboard',true,NULL),
 ('business','promotion_tools',true,NULL),
 ('business','priority_support',true,NULL),
 ('business','advanced_privacy',true,NULL),
 ('business','ad_free',true,NULL),
 ('business','team_members',true,10),
 ('business','extended_uploads',true,4096),
 ('government','verification_badge',true,NULL),
 ('government','analytics',true,NULL),
 ('government','business_dashboard',true,NULL),
 ('government','government_features',true,NULL),
 ('government','promotion_tools',true,NULL),
 ('government','priority_support',true,NULL),
 ('government','advanced_privacy',true,NULL),
 ('government','ad_free',true,NULL),
 ('government','team_members',true,50),
 ('government','extended_uploads',true,10240)
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- 8. Server-side resolution of the effective plan (auto-expiry)
CREATE OR REPLACE FUNCTION public.get_effective_plan(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((
    SELECT s.plan_id FROM public.user_subscriptions s
    JOIN public.subscription_plans p ON p.id = s.plan_id AND p.is_active
    WHERE s.user_id = _user_id
      AND s.status = 'active'
      AND (s.expires_at IS NULL OR s.expires_at > now())
    LIMIT 1
  ), 'free');
$$;
REVOKE EXECUTE ON FUNCTION public.get_effective_plan(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_effective_plan(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.my_entitlements()
RETURNS TABLE(plan_id text, plan_name text, plan_name_ar text, accent text, badge_color text, status text, expires_at timestamptz, feature_key text, limit_value integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH eff AS (SELECT public.get_effective_plan(auth.uid()) AS pid)
  SELECT p.id, p.name, p.name_ar, p.accent, p.badge_color,
         COALESCE((SELECT s.status::text FROM public.user_subscriptions s WHERE s.user_id = auth.uid()), 'active'),
         (SELECT s.expires_at FROM public.user_subscriptions s WHERE s.user_id = auth.uid()),
         e.feature_key, e.limit_value
  FROM eff
  JOIN public.subscription_plans p ON p.id = eff.pid
  LEFT JOIN public.plan_entitlements e ON e.plan_id = p.id AND e.enabled;
$$;
REVOKE EXECUTE ON FUNCTION public.my_entitlements() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_entitlements() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.has_feature(_user_id uuid, _feature_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.plan_entitlements e
    WHERE e.plan_id = public.get_effective_plan(_user_id)
      AND e.feature_key = _feature_key AND e.enabled
  );
$$;
REVOKE EXECUTE ON FUNCTION public.has_feature(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_feature(uuid, text) TO authenticated, service_role;

-- 9. Admin activation / cancellation
CREATE OR REPLACE FUNCTION public.admin_set_subscription(_user_id uuid, _plan_id text, _billing_cycle text DEFAULT 'monthly', _months integer DEFAULT 1, _payment_ref text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_exp timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authorized');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE id = _plan_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'plan_not_found');
  END IF;

  v_exp := CASE WHEN _plan_id = 'free' THEN NULL
                ELSE now() + (GREATEST(COALESCE(_months,1),1) || ' months')::interval END;

  INSERT INTO public.user_subscriptions (user_id, plan_id, billing_cycle, status, started_at, expires_at, renews_at, activated_by, payment_ref)
  VALUES (_user_id, _plan_id, COALESCE(_billing_cycle,'monthly'), 'active', now(), v_exp, v_exp, auth.uid(), _payment_ref)
  ON CONFLICT (user_id) DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    billing_cycle = EXCLUDED.billing_cycle,
    status = 'active',
    started_at = now(),
    expires_at = EXCLUDED.expires_at,
    renews_at = EXCLUDED.renews_at,
    canceled_at = NULL,
    activated_by = auth.uid(),
    payment_ref = EXCLUDED.payment_ref,
    updated_at = now();

  INSERT INTO public.notifications (user_id, actor_id, type, content)
  VALUES (_user_id, auth.uid(), 'subscription',
    CASE WHEN _plan_id = 'free' THEN 'تم إرجاع حسابك إلى الخطة المجانية'
         ELSE 'تم تفعيل اشتراكك بنجاح' END);

  RETURN jsonb_build_object('success', true, 'plan_id', _plan_id, 'expires_at', v_exp);
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_set_subscription(uuid, text, text, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_subscription(uuid, text, text, integer, text) TO authenticated, service_role;

-- 10. Expire lapsed subscriptions (idempotent sweeper)
CREATE OR REPLACE FUNCTION public.expire_subscriptions()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer;
BEGIN
  UPDATE public.user_subscriptions
    SET plan_id = 'free', status = 'expired', canceled_at = now(), updated_at = now()
    WHERE plan_id <> 'free' AND expires_at IS NOT NULL AND expires_at <= now() AND status = 'active';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END; $$;
REVOKE EXECUTE ON FUNCTION public.expire_subscriptions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.expire_subscriptions() TO authenticated, service_role;