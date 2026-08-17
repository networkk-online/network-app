-- ============ NETWORKK MARKETPLACE V1 ============
CREATE TABLE IF NOT EXISTS public.marketplace_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.marketplace_settings TO authenticated, anon;
GRANT ALL ON public.marketplace_settings TO service_role;
ALTER TABLE public.marketplace_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_settings_read ON public.marketplace_settings;
CREATE POLICY mp_settings_read ON public.marketplace_settings FOR SELECT USING (true);

INSERT INTO public.marketplace_settings(key, value) VALUES
  ('commission', '{"default_rate": 2}'::jsonb),
  ('hold', '{"days": 7}'::jsonb),
  ('general', '{"enabled": true, "currency": "IQD"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.marketplace_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  company_id uuid,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  logo_url text,
  cover_url text,
  description text,
  category text,
  location text,
  contact_phone text,
  contact_whatsapp text,
  contact_email text,
  status text NOT NULL DEFAULT 'pending',
  is_verified boolean NOT NULL DEFAULT false,
  commission_rate numeric,
  hold_days integer,
  rating numeric NOT NULL DEFAULT 0,
  reviews_count integer NOT NULL DEFAULT 0,
  orders_count integer NOT NULL DEFAULT 0,
  followers_count integer NOT NULL DEFAULT 0,
  admin_notes text,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mp_store_status_chk CHECK (status IN ('pending','approved','rejected','suspended','disabled'))
);
CREATE INDEX IF NOT EXISTS idx_mp_stores_owner ON public.marketplace_stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_mp_stores_status ON public.marketplace_stores(status);
GRANT SELECT ON public.marketplace_stores TO anon, authenticated;
GRANT INSERT, UPDATE ON public.marketplace_stores TO authenticated;
GRANT ALL ON public.marketplace_stores TO service_role;
ALTER TABLE public.marketplace_stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_stores_public_read ON public.marketplace_stores;
CREATE POLICY mp_stores_public_read ON public.marketplace_stores FOR SELECT
  USING (status = 'approved' OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
DROP POLICY IF EXISTS mp_stores_owner_insert ON public.marketplace_stores;
CREATE POLICY mp_stores_owner_insert ON public.marketplace_stores FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND status = 'pending' AND commission_rate IS NULL AND is_verified = false);
DROP POLICY IF EXISTS mp_stores_owner_update ON public.marketplace_stores;
CREATE POLICY mp_stores_owner_update ON public.marketplace_stores FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.mp_guard_store_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') THEN
    RETURN NEW;
  END IF;
  NEW.status := OLD.status;
  NEW.is_verified := OLD.is_verified;
  NEW.commission_rate := OLD.commission_rate;
  NEW.hold_days := OLD.hold_days;
  NEW.rating := OLD.rating;
  NEW.reviews_count := OLD.reviews_count;
  NEW.orders_count := OLD.orders_count;
  NEW.admin_notes := OLD.admin_notes;
  NEW.owner_id := OLD.owner_id;
  NEW.updated_at := now();
  RETURN NEW;
END $fn$;
DROP TRIGGER IF EXISTS trg_mp_guard_store_update ON public.marketplace_stores;
CREATE TRIGGER trg_mp_guard_store_update BEFORE UPDATE ON public.marketplace_stores
  FOR EACH ROW EXECUTE FUNCTION public.mp_guard_store_update();

CREATE OR REPLACE FUNCTION public.mp_owns_store(_store_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (SELECT 1 FROM public.marketplace_stores s WHERE s.id = _store_id AND s.owner_id = auth.uid());
$fn$;
REVOKE EXECUTE ON FUNCTION public.mp_owns_store(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_owns_store(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.mp_is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin');
$fn$;
REVOKE EXECUTE ON FUNCTION public.mp_is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_is_admin() TO authenticated;

CREATE TABLE IF NOT EXISTS public.marketplace_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.marketplace_stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  image_url text,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  video_url text,
  category text,
  price numeric NOT NULL DEFAULT 0 CHECK (price >= 0),
  discount_price numeric CHECK (discount_price IS NULL OR discount_price >= 0),
  currency text NOT NULL DEFAULT 'IQD',
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku text,
  weight numeric,
  shipping_info text,
  shipping_fee numeric NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  status text NOT NULL DEFAULT 'draft',
  is_featured boolean NOT NULL DEFAULT false,
  views_count integer NOT NULL DEFAULT 0,
  sales_count integer NOT NULL DEFAULT 0,
  rating numeric NOT NULL DEFAULT 0,
  reviews_count integer NOT NULL DEFAULT 0,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mp_product_status_chk CHECK (status IN ('draft','pending','published','rejected','out_of_stock','suspended'))
);
CREATE INDEX IF NOT EXISTS idx_mp_products_store ON public.marketplace_products(store_id);
CREATE INDEX IF NOT EXISTS idx_mp_products_status ON public.marketplace_products(status);
CREATE INDEX IF NOT EXISTS idx_mp_products_category ON public.marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_mp_products_created ON public.marketplace_products(created_at DESC);
GRANT SELECT ON public.marketplace_products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.marketplace_products TO authenticated;
GRANT ALL ON public.marketplace_products TO service_role;
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_products_read ON public.marketplace_products;
CREATE POLICY mp_products_read ON public.marketplace_products FOR SELECT
  USING (
    (status = 'published' AND EXISTS (SELECT 1 FROM public.marketplace_stores s WHERE s.id = store_id AND s.status = 'approved'))
    OR public.mp_owns_store(store_id) OR public.mp_is_admin()
  );
DROP POLICY IF EXISTS mp_products_owner_write ON public.marketplace_products;
CREATE POLICY mp_products_owner_write ON public.marketplace_products FOR INSERT TO authenticated
  WITH CHECK (public.mp_owns_store(store_id));
DROP POLICY IF EXISTS mp_products_owner_update ON public.marketplace_products;
CREATE POLICY mp_products_owner_update ON public.marketplace_products FOR UPDATE TO authenticated
  USING (public.mp_owns_store(store_id) OR public.mp_is_admin())
  WITH CHECK (public.mp_owns_store(store_id) OR public.mp_is_admin());
DROP POLICY IF EXISTS mp_products_owner_delete ON public.marketplace_products;
CREATE POLICY mp_products_owner_delete ON public.marketplace_products FOR DELETE TO authenticated
  USING (public.mp_owns_store(store_id) OR public.mp_is_admin());

CREATE TABLE IF NOT EXISTS public.marketplace_product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  label text NOT NULL,
  size text,
  color text,
  price_delta numeric NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mp_variants_product ON public.marketplace_product_variants(product_id);
GRANT SELECT ON public.marketplace_product_variants TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.marketplace_product_variants TO authenticated;
GRANT ALL ON public.marketplace_product_variants TO service_role;
ALTER TABLE public.marketplace_product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_variants_read ON public.marketplace_product_variants;
CREATE POLICY mp_variants_read ON public.marketplace_product_variants FOR SELECT USING (true);
DROP POLICY IF EXISTS mp_variants_write ON public.marketplace_product_variants;
CREATE POLICY mp_variants_write ON public.marketplace_product_variants FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.marketplace_products p WHERE p.id = product_id AND (public.mp_owns_store(p.store_id) OR public.mp_is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.marketplace_products p WHERE p.id = product_id AND (public.mp_owns_store(p.store_id) OR public.mp_is_admin())));

CREATE TABLE IF NOT EXISTS public.marketplace_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.marketplace_product_variants(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 999),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mp_cart_unique ON public.marketplace_carts(user_id, product_id, COALESCE(variant_id,'00000000-0000-0000-0000-000000000000'::uuid));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_carts TO authenticated;
GRANT ALL ON public.marketplace_carts TO service_role;
ALTER TABLE public.marketplace_carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_cart_own ON public.marketplace_carts;
CREATE POLICY mp_cart_own ON public.marketplace_carts FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.marketplace_saved_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.marketplace_saved_products TO authenticated;
GRANT ALL ON public.marketplace_saved_products TO service_role;
ALTER TABLE public.marketplace_saved_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_saved_own ON public.marketplace_saved_products;
CREATE POLICY mp_saved_own ON public.marketplace_saved_products FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.marketplace_commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('default','store','category')),
  store_id uuid REFERENCES public.marketplace_stores(id) ON DELETE CASCADE,
  category text,
  rate numeric NOT NULL CHECK (rate >= 0 AND rate <= 100),
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mp_commission_scope ON public.marketplace_commission_rules(scope, is_active);
GRANT SELECT ON public.marketplace_commission_rules TO authenticated;
GRANT ALL ON public.marketplace_commission_rules TO service_role;
ALTER TABLE public.marketplace_commission_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_commission_read ON public.marketplace_commission_rules;
CREATE POLICY mp_commission_read ON public.marketplace_commission_rules FOR SELECT TO authenticated
  USING (public.mp_is_admin() OR (store_id IS NOT NULL AND public.mp_owns_store(store_id)));

CREATE SEQUENCE IF NOT EXISTS public.mp_order_seq START 100000;
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT ('NK-' || nextval('public.mp_order_seq')::text),
  buyer_id uuid NOT NULL,
  store_id uuid NOT NULL REFERENCES public.marketplace_stores(id) ON DELETE RESTRICT,
  subtotal numeric NOT NULL DEFAULT 0,
  shipping_amount numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL DEFAULT 2,
  commission_amount numeric NOT NULL DEFAULT 0,
  processor_fee numeric NOT NULL DEFAULT 0,
  merchant_net numeric NOT NULL DEFAULT 0,
  refunded_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'IQD',
  status text NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'pending',
  shipping_status text NOT NULL DEFAULT 'not_shipped',
  refund_status text NOT NULL DEFAULT 'none',
  dispute_status text NOT NULL DEFAULT 'none',
  payment_method text NOT NULL DEFAULT 'cod',
  payment_provider text,
  payment_reference text,
  buyer_name text,
  buyer_phone text,
  address text,
  city text,
  note text,
  tracking_number text,
  settle_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mp_order_status_chk CHECK (status IN ('pending','payment_pending','paid','confirmed','preparing','shipped','delivered','completed','cancelled','refunded','disputed'))
);
CREATE INDEX IF NOT EXISTS idx_mp_orders_buyer ON public.marketplace_orders(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mp_orders_store ON public.marketplace_orders(store_id, created_at DESC);
GRANT SELECT ON public.marketplace_orders TO authenticated;
GRANT ALL ON public.marketplace_orders TO service_role;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_orders_read ON public.marketplace_orders;
CREATE POLICY mp_orders_read ON public.marketplace_orders FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR public.mp_owns_store(store_id) OR public.mp_is_admin());

CREATE TABLE IF NOT EXISTS public.marketplace_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.marketplace_products(id) ON DELETE SET NULL,
  variant_id uuid,
  product_name text NOT NULL,
  product_image text,
  variant_label text,
  unit_price numeric NOT NULL,
  quantity integer NOT NULL,
  line_total numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mp_items_order ON public.marketplace_order_items(order_id);
GRANT SELECT ON public.marketplace_order_items TO authenticated;
GRANT ALL ON public.marketplace_order_items TO service_role;
ALTER TABLE public.marketplace_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_items_read ON public.marketplace_order_items;
CREATE POLICY mp_items_read ON public.marketplace_order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.marketplace_orders o WHERE o.id = order_id
    AND (o.buyer_id = auth.uid() OR public.mp_owns_store(o.store_id) OR public.mp_is_admin())));

CREATE TABLE IF NOT EXISTS public.marketplace_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.marketplace_stores(id) ON DELETE RESTRICT,
  order_id uuid REFERENCES public.marketplace_orders(id) ON DELETE SET NULL,
  payout_id uuid,
  entry_type text NOT NULL CHECK (entry_type IN ('sale_gross','commission','processor_fee','shipping','tax','discount','refund','partial_refund','chargeback','adjustment','payout')),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'IQD',
  affects_balance boolean NOT NULL DEFAULT true,
  available_at timestamptz NOT NULL DEFAULT now(),
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mp_ledger_store ON public.marketplace_ledger(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mp_ledger_order ON public.marketplace_ledger(order_id);
GRANT SELECT ON public.marketplace_ledger TO authenticated;
GRANT ALL ON public.marketplace_ledger TO service_role;
ALTER TABLE public.marketplace_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_ledger_read ON public.marketplace_ledger;
CREATE POLICY mp_ledger_read ON public.marketplace_ledger FOR SELECT TO authenticated
  USING (public.mp_owns_store(store_id) OR public.mp_is_admin());
DROP TRIGGER IF EXISTS trg_mp_ledger_immutable ON public.marketplace_ledger;
CREATE TRIGGER trg_mp_ledger_immutable BEFORE UPDATE OR DELETE ON public.marketplace_ledger
  FOR EACH ROW EXECUTE FUNCTION public.block_mutation();

CREATE TABLE IF NOT EXISTS public.marketplace_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.marketplace_stores(id) ON DELETE RESTRICT,
  requested_by uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'IQD',
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','under_review','approved','processing','paid','rejected','cancelled')),
  method text,
  destination text,
  idempotency_key text NOT NULL UNIQUE,
  payment_reference text,
  admin_note text,
  merchant_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mp_payouts_store ON public.marketplace_payouts(store_id, created_at DESC);
GRANT SELECT ON public.marketplace_payouts TO authenticated;
GRANT ALL ON public.marketplace_payouts TO service_role;
ALTER TABLE public.marketplace_payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_payouts_read ON public.marketplace_payouts;
CREATE POLICY mp_payouts_read ON public.marketplace_payouts FOR SELECT TO authenticated
  USING (public.mp_owns_store(store_id) OR public.mp_is_admin());

CREATE TABLE IF NOT EXISTS public.marketplace_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.marketplace_stores(id) ON DELETE RESTRICT,
  amount numeric NOT NULL CHECK (amount > 0),
  refund_type text NOT NULL CHECK (refund_type IN ('full','partial')),
  reason text,
  status text NOT NULL DEFAULT 'processed',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.marketplace_refunds TO authenticated;
GRANT ALL ON public.marketplace_refunds TO service_role;
ALTER TABLE public.marketplace_refunds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_refunds_read ON public.marketplace_refunds;
CREATE POLICY mp_refunds_read ON public.marketplace_refunds FOR SELECT TO authenticated
  USING (public.mp_owns_store(store_id) OR public.mp_is_admin()
    OR EXISTS (SELECT 1 FROM public.marketplace_orders o WHERE o.id = order_id AND o.buyer_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.marketplace_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  store_id uuid NOT NULL REFERENCES public.marketplace_stores(id) ON DELETE RESTRICT,
  reason text NOT NULL,
  details text,
  merchant_response text,
  resolution_note text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','merchant_response','under_review','resolved_buyer','resolved_merchant','closed')),
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.marketplace_disputes TO authenticated;
GRANT ALL ON public.marketplace_disputes TO service_role;
ALTER TABLE public.marketplace_disputes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_disputes_read ON public.marketplace_disputes;
CREATE POLICY mp_disputes_read ON public.marketplace_disputes FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR public.mp_owns_store(store_id) OR public.mp_is_admin());

CREATE TABLE IF NOT EXISTS public.marketplace_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.marketplace_stores(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, product_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_mp_reviews_product ON public.marketplace_reviews(product_id);
GRANT SELECT ON public.marketplace_reviews TO anon, authenticated;
GRANT ALL ON public.marketplace_reviews TO service_role;
ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_reviews_read ON public.marketplace_reviews;
CREATE POLICY mp_reviews_read ON public.marketplace_reviews FOR SELECT USING (is_hidden = false OR user_id = auth.uid() OR public.mp_is_admin());

CREATE TABLE IF NOT EXISTS public.marketplace_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('product','store','review')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','resolved','dismissed')),
  handled_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.marketplace_reports TO authenticated;
GRANT ALL ON public.marketplace_reports TO service_role;
ALTER TABLE public.marketplace_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_reports_insert ON public.marketplace_reports;
CREATE POLICY mp_reports_insert ON public.marketplace_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
DROP POLICY IF EXISTS mp_reports_read ON public.marketplace_reports;
CREATE POLICY mp_reports_read ON public.marketplace_reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.mp_is_admin());

CREATE TABLE IF NOT EXISTS public.marketplace_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  target_type text,
  target_id text,
  old_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mp_audit_created ON public.marketplace_audit_logs(created_at DESC);
GRANT SELECT ON public.marketplace_audit_logs TO authenticated;
GRANT ALL ON public.marketplace_audit_logs TO service_role;
ALTER TABLE public.marketplace_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_audit_read ON public.marketplace_audit_logs;
CREATE POLICY mp_audit_read ON public.marketplace_audit_logs FOR SELECT TO authenticated USING (public.mp_is_admin());
DROP TRIGGER IF EXISTS trg_mp_audit_immutable ON public.marketplace_audit_logs;
CREATE TRIGGER trg_mp_audit_immutable BEFORE UPDATE OR DELETE ON public.marketplace_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.block_mutation();

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type = ANY (ARRAY[
  'like','comment','follow','reply','transaction','tip','donation','system','broadcast','admin',
  'deposit_request','deposit','deposit_pending','deposit_approved','withdrawal','withdrawal_request',
  'topup','earning','cinema_new','affiliation_invite','affiliation_response','payment',
  'order','order_update','order_new','refund','payout','dispute','review','store','marketplace'
]));