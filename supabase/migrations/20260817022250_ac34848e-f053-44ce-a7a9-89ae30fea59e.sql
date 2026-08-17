-- ============ NETWORKK MARKETPLACE — REAL PAYMENT & SETTLEMENT LAYER ============

INSERT INTO public.marketplace_settings(key, value) VALUES
  ('payments', '{"environment":"test","provider":"none","min_payout":25000,"large_txn_alert":1000000}'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.marketplace_stores
  ADD COLUMN IF NOT EXISTS payout_state text NOT NULL DEFAULT 'verification_pending',
  ADD COLUMN IF NOT EXISTS payouts_enabled boolean NOT NULL DEFAULT false;

DO $$ BEGIN
  ALTER TABLE public.marketplace_stores
    ADD CONSTRAINT mp_store_payout_state_chk
    CHECK (payout_state IN ('verification_pending','verified','payout_enabled','payout_suspended'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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
  NEW.payout_state := OLD.payout_state;
  NEW.payouts_enabled := OLD.payouts_enabled;
  NEW.updated_at := now();
  RETURN NEW;
END $fn$;

CREATE TABLE IF NOT EXISTS public.marketplace_payment_providers (
  code text PRIMARY KEY,
  label text NOT NULL,
  label_ar text,
  environment text NOT NULL DEFAULT 'test' CHECK (environment IN ('test','live')),
  is_active boolean NOT NULL DEFAULT false,
  supports_refund boolean NOT NULL DEFAULT true,
  supports_payout boolean NOT NULL DEFAULT false,
  logo_url text,
  public_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  credentials_configured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.marketplace_payment_providers TO authenticated;
GRANT ALL ON public.marketplace_payment_providers TO service_role;
ALTER TABLE public.marketplace_payment_providers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_providers_read ON public.marketplace_payment_providers;
CREATE POLICY mp_providers_read ON public.marketplace_payment_providers FOR SELECT TO authenticated
  USING (is_active OR public.mp_is_admin());

INSERT INTO public.marketplace_payment_providers(code,label,label_ar,environment,is_active,supports_refund,supports_payout)
VALUES ('manual','Manual / Cash on Delivery','دفع يدوي / عند الاستلام','test',true,true,false)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.marketplace_payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  store_id uuid NOT NULL REFERENCES public.marketplace_stores(id) ON DELETE RESTRICT,
  provider text NOT NULL,
  environment text NOT NULL CHECK (environment IN ('test','live')),
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency text NOT NULL DEFAULT 'IQD',
  status text NOT NULL DEFAULT 'created'
    CHECK (status IN ('created','pending','succeeded','failed','cancelled','expired')),
  idempotency_key text NOT NULL UNIQUE,
  provider_ref text,
  checkout_url text,
  error_code text,
  error_message text,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '2 hours',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mp_attempts_order ON public.marketplace_payment_attempts(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mp_attempts_status ON public.marketplace_payment_attempts(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mp_attempts_provider_ref
  ON public.marketplace_payment_attempts(provider, provider_ref) WHERE provider_ref IS NOT NULL;
GRANT SELECT ON public.marketplace_payment_attempts TO authenticated;
GRANT ALL ON public.marketplace_payment_attempts TO service_role;
ALTER TABLE public.marketplace_payment_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_attempts_read ON public.marketplace_payment_attempts;
CREATE POLICY mp_attempts_read ON public.marketplace_payment_attempts FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR public.mp_owns_store(store_id) OR public.mp_is_admin());

CREATE TABLE IF NOT EXISTS public.marketplace_payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES public.marketplace_payment_attempts(id) ON DELETE SET NULL,
  order_id uuid NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE RESTRICT,
  store_id uuid NOT NULL REFERENCES public.marketplace_stores(id) ON DELETE RESTRICT,
  buyer_id uuid NOT NULL,
  provider text NOT NULL,
  environment text NOT NULL CHECK (environment IN ('test','live')),
  provider_txn_id text NOT NULL,
  kind text NOT NULL DEFAULT 'payment' CHECK (kind IN ('payment','refund','chargeback')),
  gross_amount_minor bigint NOT NULL,
  commission_minor bigint NOT NULL DEFAULT 0,
  processor_fee_minor bigint NOT NULL DEFAULT 0,
  merchant_net_minor bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'IQD',
  status text NOT NULL DEFAULT 'succeeded' CHECK (status IN ('succeeded','failed','reversed')),
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_txn_id, kind)
);
CREATE INDEX IF NOT EXISTS idx_mp_txn_order ON public.marketplace_payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_mp_txn_store ON public.marketplace_payment_transactions(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mp_txn_created ON public.marketplace_payment_transactions(created_at DESC);
GRANT SELECT ON public.marketplace_payment_transactions TO authenticated;
GRANT ALL ON public.marketplace_payment_transactions TO service_role;
ALTER TABLE public.marketplace_payment_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_txn_read ON public.marketplace_payment_transactions;
CREATE POLICY mp_txn_read ON public.marketplace_payment_transactions FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR public.mp_owns_store(store_id) OR public.mp_is_admin());
DROP TRIGGER IF EXISTS trg_mp_txn_immutable ON public.marketplace_payment_transactions;
CREATE TRIGGER trg_mp_txn_immutable BEFORE UPDATE OR DELETE ON public.marketplace_payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.block_mutation();

CREATE TABLE IF NOT EXISTS public.marketplace_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text NOT NULL,
  event_type text,
  signature_valid boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','processed','rejected','duplicate','error')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE (provider, event_id)
);
CREATE INDEX IF NOT EXISTS idx_mp_webhooks_received ON public.marketplace_webhook_events(received_at DESC);
GRANT SELECT ON public.marketplace_webhook_events TO authenticated;
GRANT ALL ON public.marketplace_webhook_events TO service_role;
ALTER TABLE public.marketplace_webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_webhooks_read ON public.marketplace_webhook_events;
CREATE POLICY mp_webhooks_read ON public.marketplace_webhook_events FOR SELECT TO authenticated
  USING (public.mp_is_admin());

CREATE TABLE IF NOT EXISTS public.marketplace_payout_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.marketplace_stores(id) ON DELETE CASCADE,
  method_type text NOT NULL CHECK (method_type IN ('bank','provider_account','other')),
  label text NOT NULL,
  account_name text,
  account_reference text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mp_payout_methods_store ON public.marketplace_payout_methods(store_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_payout_methods TO authenticated;
GRANT ALL ON public.marketplace_payout_methods TO service_role;
ALTER TABLE public.marketplace_payout_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_payout_methods_own ON public.marketplace_payout_methods;
CREATE POLICY mp_payout_methods_own ON public.marketplace_payout_methods FOR ALL TO authenticated
  USING (public.mp_owns_store(store_id) OR public.mp_is_admin())
  WITH CHECK (public.mp_owns_store(store_id));

CREATE TABLE IF NOT EXISTS public.marketplace_reconciliation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('missing_local_payment','pending_local_paid_provider','amount_mismatch','currency_mismatch','duplicate_reference','refund_mismatch','payout_mismatch','stale_attempt')),
  order_id uuid,
  attempt_id uuid,
  transaction_id uuid,
  payout_id uuid,
  provider text,
  provider_ref text,
  expected_minor bigint,
  actual_minor bigint,
  currency text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','ignored')),
  note text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mp_recon_status ON public.marketplace_reconciliation_items(status, created_at DESC);
GRANT SELECT ON public.marketplace_reconciliation_items TO authenticated;
GRANT ALL ON public.marketplace_reconciliation_items TO service_role;
ALTER TABLE public.marketplace_reconciliation_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_recon_read ON public.marketplace_reconciliation_items;
CREATE POLICY mp_recon_read ON public.marketplace_reconciliation_items FOR SELECT TO authenticated
  USING (public.mp_is_admin());

CREATE OR REPLACE FUNCTION public.mp_minor_factor(_currency text)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path = public AS $fn$
  SELECT CASE WHEN upper(coalesce(_currency,'IQD')) IN ('IQD','JPY','KRW') THEN 1 ELSE 100 END;
$fn$;

CREATE OR REPLACE FUNCTION public.mp_payment_config()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT jsonb_build_object(
    'environment', COALESCE(value->>'environment','test'),
    'provider', COALESCE(value->>'provider','none'),
    'min_payout', COALESCE((value->>'min_payout')::numeric, 0),
    'provider_ready', EXISTS (
      SELECT 1 FROM public.marketplace_payment_providers p
       WHERE p.code = COALESCE(value->>'provider','none')
         AND p.is_active AND p.credentials_configured
         AND p.environment = COALESCE(value->>'environment','test')
    )
  )
  FROM public.marketplace_settings WHERE key = 'payments';
$fn$;
REVOKE EXECUTE ON FUNCTION public.mp_payment_config() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_payment_config() TO authenticated;

CREATE OR REPLACE FUNCTION public.mp_settle_order_paid(_order_id uuid, _reference text, _processor_fee numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE o record; _avail timestamptz; _comm numeric;
BEGIN
  SELECT * INTO o FROM public.marketplace_orders WHERE id=_order_id FOR UPDATE;
  IF o.id IS NULL THEN RAISE EXCEPTION 'order not found'; END IF;
  IF o.payment_status = 'paid' THEN RETURN jsonb_build_object('success', true, 'already', true); END IF;

  _avail := now() + (public.mp_hold_days(o.store_id) || ' days')::interval;
  _comm := ROUND(o.subtotal * o.commission_rate / 100.0, 2);

  UPDATE public.marketplace_orders SET payment_status='paid', status='paid',
    payment_reference = COALESCE(_reference, payment_reference),
    processor_fee = COALESCE(_processor_fee, 0),
    commission_amount = _comm,
    merchant_net = (o.subtotal - _comm) + o.shipping_amount - COALESCE(_processor_fee,0),
    settle_at = _avail, updated_at = now()
  WHERE id = _order_id;

  INSERT INTO public.marketplace_ledger(store_id, order_id, entry_type, amount, affects_balance, available_at, description)
  VALUES
    (o.store_id, o.id, 'sale_gross', o.subtotal, true, _avail, 'Gross sale ' || o.order_number),
    (o.store_id, o.id, 'commission', -_comm, true, _avail, 'Networkk commission ' || o.commission_rate || '%');
  IF o.shipping_amount > 0 THEN
    INSERT INTO public.marketplace_ledger(store_id, order_id, entry_type, amount, affects_balance, available_at, description)
    VALUES (o.store_id, o.id, 'shipping', o.shipping_amount, true, _avail, 'Shipping');
  END IF;
  IF COALESCE(_processor_fee,0) > 0 THEN
    INSERT INTO public.marketplace_ledger(store_id, order_id, entry_type, amount, affects_balance, available_at, description)
    VALUES (o.store_id, o.id, 'processor_fee', -_processor_fee, true, _avail, 'Payment processor fee');
  END IF;

  UPDATE public.marketplace_stores SET orders_count = orders_count + 1 WHERE id = o.store_id;

  INSERT INTO public.notifications(user_id, type, title, message, data)
  VALUES (o.buyer_id, 'payment', 'تم تأكيد الدفع', 'تم تأكيد دفع طلبك ' || o.order_number, jsonb_build_object('order_id', o.id));

  INSERT INTO public.notifications(user_id, type, title, message, data)
  SELECT s.owner_id, 'order_new', 'طلب مدفوع جديد',
         'تم دفع الطلب ' || o.order_number || ' — المبلغ قيد التعليق حتى انتهاء فترة التسوية',
         jsonb_build_object('order_id', o.id)
  FROM public.marketplace_stores s WHERE s.id = o.store_id;

  RETURN jsonb_build_object('success', true, 'settle_at', _avail, 'commission', _comm);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_settle_order_paid(uuid,text,numeric) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.mp_create_payment_attempt(_order_id uuid, _idempotency_key text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE o record; cfg jsonb; _existing record; _id uuid; _key text; _minor bigint;
BEGIN
  SELECT * INTO o FROM public.marketplace_orders WHERE id=_order_id;
  IF o.id IS NULL OR o.buyer_id <> auth.uid() THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF o.payment_status = 'paid' THEN RAISE EXCEPTION 'order already paid'; END IF;
  IF o.status IN ('cancelled','refunded') THEN RAISE EXCEPTION 'order is closed'; END IF;

  cfg := public.mp_payment_config();

  SELECT * INTO _existing FROM public.marketplace_payment_attempts
   WHERE order_id=_order_id AND status IN ('created','pending') AND expires_at > now()
   ORDER BY created_at DESC LIMIT 1;
  IF _existing.id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'reused', true, 'attempt_id', _existing.id,
      'provider', _existing.provider, 'environment', _existing.environment,
      'checkout_url', _existing.checkout_url, 'amount_minor', _existing.amount_minor,
      'currency', _existing.currency, 'provider_ready', cfg->'provider_ready');
  END IF;

  _minor := ROUND(o.total_amount * public.mp_minor_factor(o.currency))::bigint;
  IF _minor <= 0 THEN RAISE EXCEPTION 'invalid order amount'; END IF;

  _id := gen_random_uuid();
  _key := COALESCE(NULLIF(_idempotency_key,''), 'PA-' || replace(_id::text,'-',''));

  INSERT INTO public.marketplace_payment_attempts(
    id, order_id, buyer_id, store_id, provider, environment, amount_minor, currency, status, idempotency_key)
  VALUES (_id, o.id, o.buyer_id, o.store_id,
          COALESCE(cfg->>'provider','none'), COALESCE(cfg->>'environment','test'),
          _minor, o.currency, 'created', _key);

  UPDATE public.marketplace_orders
     SET payment_status='pending', status='payment_pending',
         payment_provider = COALESCE(cfg->>'provider','none'), updated_at=now()
   WHERE id=_order_id;

  RETURN jsonb_build_object('success', true, 'attempt_id', _id, 'idempotency_key', _key,
    'provider', cfg->>'provider', 'environment', cfg->>'environment',
    'amount_minor', _minor, 'currency', o.currency, 'provider_ready', cfg->'provider_ready');
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_create_payment_attempt(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_create_payment_attempt(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.mp_confirm_payment(
  _provider text, _provider_txn_id text, _attempt_id uuid, _amount_minor bigint,
  _currency text, _processor_fee_minor bigint DEFAULT 0, _raw jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE a record; o record; _factor int; _fee numeric; _settle jsonb; _existing uuid; _comm numeric;
BEGIN
  IF coalesce(_provider,'') = '' OR coalesce(_provider_txn_id,'') = '' THEN
    RAISE EXCEPTION 'provider and transaction id required';
  END IF;

  SELECT id INTO _existing FROM public.marketplace_payment_transactions
   WHERE provider=_provider AND provider_txn_id=_provider_txn_id AND kind='payment';
  IF _existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true, 'transaction_id', _existing);
  END IF;

  SELECT * INTO a FROM public.marketplace_payment_attempts WHERE id=_attempt_id FOR UPDATE;
  IF a.id IS NULL THEN RAISE EXCEPTION 'payment attempt not found'; END IF;
  IF a.provider <> _provider THEN RAISE EXCEPTION 'provider mismatch'; END IF;
  IF upper(a.currency) <> upper(COALESCE(_currency, a.currency)) THEN RAISE EXCEPTION 'currency mismatch'; END IF;
  IF _amount_minor IS NULL OR _amount_minor <> a.amount_minor THEN RAISE EXCEPTION 'amount mismatch'; END IF;

  SELECT * INTO o FROM public.marketplace_orders WHERE id=a.order_id FOR UPDATE;
  IF o.id IS NULL THEN RAISE EXCEPTION 'order not found'; END IF;

  _factor := public.mp_minor_factor(a.currency);
  _fee := COALESCE(_processor_fee_minor,0)::numeric / _factor;

  IF o.payment_status <> 'paid' THEN
    _settle := public.mp_settle_order_paid(o.id, _provider_txn_id, _fee);
  ELSE
    _settle := jsonb_build_object('already', true);
  END IF;

  SELECT commission_amount INTO _comm FROM public.marketplace_orders WHERE id=o.id;

  UPDATE public.marketplace_payment_attempts
     SET status='succeeded', provider_ref=_provider_txn_id, updated_at=now()
   WHERE id=a.id;

  INSERT INTO public.marketplace_payment_transactions(
    attempt_id, order_id, store_id, buyer_id, provider, environment, provider_txn_id, kind,
    gross_amount_minor, commission_minor, processor_fee_minor, merchant_net_minor, currency, status, raw)
  VALUES (a.id, o.id, o.store_id, o.buyer_id, _provider, a.environment, _provider_txn_id, 'payment',
    _amount_minor,
    ROUND(COALESCE(_comm,0) * _factor)::bigint,
    COALESCE(_processor_fee_minor,0),
    _amount_minor - ROUND(COALESCE(_comm,0) * _factor)::bigint - COALESCE(_processor_fee_minor,0),
    a.currency, 'succeeded', COALESCE(_raw,'{}'::jsonb))
  ON CONFLICT (provider, provider_txn_id, kind) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'order_id', o.id, 'settlement', _settle);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_confirm_payment(text,text,uuid,bigint,text,bigint,jsonb) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.mp_fail_payment(
  _attempt_id uuid, _status text, _error_code text DEFAULT NULL, _error_message text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE a record;
BEGIN
  IF _status NOT IN ('failed','cancelled','expired') THEN RAISE EXCEPTION 'invalid status'; END IF;
  SELECT * INTO a FROM public.marketplace_payment_attempts WHERE id=_attempt_id FOR UPDATE;
  IF a.id IS NULL THEN RAISE EXCEPTION 'attempt not found'; END IF;
  IF a.status = 'succeeded' THEN RETURN jsonb_build_object('success', false, 'reason', 'already succeeded'); END IF;

  UPDATE public.marketplace_payment_attempts
     SET status=_status, error_code=_error_code, error_message=_error_message, updated_at=now()
   WHERE id=_attempt_id;

  UPDATE public.marketplace_orders
     SET payment_status = CASE WHEN _status='cancelled' THEN 'cancelled' ELSE 'failed' END,
         status = 'payment_pending', updated_at = now()
   WHERE id = a.order_id AND payment_status <> 'paid';

  INSERT INTO public.notifications(user_id, type, title, message, data)
  SELECT a.buyer_id, 'payment', 'فشل الدفع', 'لم تكتمل عملية الدفع، يمكنك إعادة المحاولة بأمان',
         jsonb_build_object('order_id', a.order_id);

  RETURN jsonb_build_object('success', true);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_fail_payment(uuid,text,text,text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.mp_cancel_payment_attempt(_attempt_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE a record;
BEGIN
  SELECT * INTO a FROM public.marketplace_payment_attempts WHERE id=_attempt_id;
  IF a.id IS NULL OR a.buyer_id <> auth.uid() THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF a.status = 'succeeded' THEN RAISE EXCEPTION 'payment already completed'; END IF;
  UPDATE public.marketplace_payment_attempts SET status='cancelled', updated_at=now() WHERE id=_attempt_id;
  RETURN jsonb_build_object('success', true);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_cancel_payment_attempt(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_cancel_payment_attempt(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.mp_mark_order_paid(_order_id uuid, _reference text DEFAULT NULL, _processor_fee numeric DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE o record; r jsonb; _factor int; _ref text; _comm numeric;
BEGIN
  IF NOT public.mp_is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT * INTO o FROM public.marketplace_orders WHERE id=_order_id;
  IF o.id IS NULL THEN RAISE EXCEPTION 'order not found'; END IF;
  IF o.payment_status = 'paid' THEN RETURN jsonb_build_object('success', true, 'already', true); END IF;

  _ref := COALESCE(NULLIF(_reference,''), 'MANUAL-' || o.order_number);
  r := public.mp_settle_order_paid(_order_id, _ref, COALESCE(_processor_fee,0));

  _factor := public.mp_minor_factor(o.currency);
  SELECT commission_amount INTO _comm FROM public.marketplace_orders WHERE id=o.id;

  INSERT INTO public.marketplace_payment_transactions(
    order_id, store_id, buyer_id, provider, environment, provider_txn_id, kind,
    gross_amount_minor, commission_minor, processor_fee_minor, merchant_net_minor, currency, status, raw)
  VALUES (o.id, o.store_id, o.buyer_id, 'manual',
    COALESCE((public.mp_payment_config())->>'environment','test'), _ref, 'payment',
    ROUND(o.total_amount * _factor)::bigint,
    ROUND(COALESCE(_comm,0) * _factor)::bigint,
    ROUND(COALESCE(_processor_fee,0) * _factor)::bigint,
    ROUND((o.total_amount - COALESCE(_comm,0) - COALESCE(_processor_fee,0)) * _factor)::bigint,
    o.currency, 'succeeded', jsonb_build_object('manual', true, 'actor', auth.uid()))
  ON CONFLICT (provider, provider_txn_id, kind) DO NOTHING;

  PERFORM public.mp_audit('order_marked_paid_manual','order',_order_id::text, NULL,
    jsonb_build_object('reference',_ref,'processor_fee',_processor_fee), NULL);
  RETURN jsonb_build_object('success', true, 'settlement', r);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_mark_order_paid(uuid,text,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_mark_order_paid(uuid,text,numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.mp_request_payout(_store_id uuid, _amount numeric, _method text DEFAULT NULL, _destination text DEFAULT NULL, _note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE b jsonb; s record; _avail numeric; _locked numeric; _id uuid; _min numeric;
BEGIN
  IF NOT public.mp_owns_store(_store_id) THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT * INTO s FROM public.marketplace_stores WHERE id=_store_id;
  IF s.status <> 'approved' THEN RAISE EXCEPTION 'store not approved'; END IF;
  IF NOT s.payouts_enabled OR s.payout_state = 'payout_suspended' THEN
    RAISE EXCEPTION 'payouts not enabled for this store yet';
  END IF;

  _min := COALESCE(((public.mp_payment_config())->>'min_payout')::numeric, 0);
  b := public.mp_store_balances(_store_id);
  _avail := COALESCE((b->>'available')::numeric, 0);
  SELECT COALESCE(SUM(amount),0) INTO _locked FROM public.marketplace_payouts
   WHERE store_id=_store_id AND status IN ('requested','under_review','approved','processing');

  IF _amount IS NULL OR _amount <= 0 OR _amount > (_avail - _locked) THEN
    RAISE EXCEPTION 'insufficient available balance';
  END IF;
  IF _amount < _min THEN RAISE EXCEPTION 'amount below minimum payout'; END IF;

  _id := gen_random_uuid();
  INSERT INTO public.marketplace_payouts(id, store_id, requested_by, amount, method, destination, merchant_note, idempotency_key, currency)
  VALUES (_id, _store_id, auth.uid(), _amount, _method, _destination, _note, 'PO-' || replace(_id::text,'-',''), 'IQD');

  PERFORM public.mp_audit('payout_requested','payout',_id::text, NULL, jsonb_build_object('amount',_amount), NULL);

  INSERT INTO public.notifications(user_id, type, title, message, data)
  SELECT ur.user_id, 'payout', 'طلب سحب جديد', 'طلب سحب جديد من متجر ' || s.name,
         jsonb_build_object('payout_id', _id, 'store_id', _store_id)
  FROM public.user_roles ur WHERE ur.role IN ('admin','super_admin');

  RETURN jsonb_build_object('success', true, 'payout_id', _id);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_request_payout(uuid,numeric,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_request_payout(uuid,numeric,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.mp_admin_set_payout_state(_store_id uuid, _state text, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE s record;
BEGIN
  IF NOT public.mp_is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF _state NOT IN ('verification_pending','verified','payout_enabled','payout_suspended') THEN
    RAISE EXCEPTION 'invalid payout state';
  END IF;
  SELECT * INTO s FROM public.marketplace_stores WHERE id=_store_id;
  IF s.id IS NULL THEN RAISE EXCEPTION 'store not found'; END IF;

  UPDATE public.marketplace_stores
     SET payout_state=_state, payouts_enabled = (_state = 'payout_enabled'), updated_at=now()
   WHERE id=_store_id;

  PERFORM public.mp_audit('payout_state_changed','store',_store_id::text,
    jsonb_build_object('state', s.payout_state), jsonb_build_object('state', _state), _reason);
  RETURN jsonb_build_object('success', true);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_admin_set_payout_state(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_admin_set_payout_state(uuid,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.mp_admin_finance_overview()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE r jsonb;
BEGIN
  IF NOT public.mp_is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT jsonb_build_object(
    'environment', COALESCE((public.mp_payment_config())->>'environment','test'),
    'provider', COALESCE((public.mp_payment_config())->>'provider','none'),
    'provider_ready', (public.mp_payment_config())->'provider_ready',
    'gross_volume', (SELECT COALESCE(SUM(amount),0) FROM public.marketplace_ledger WHERE entry_type='sale_gross'),
    'commission_revenue', (SELECT COALESCE(-SUM(amount),0) FROM public.marketplace_ledger WHERE entry_type='commission'),
    'processor_fees', (SELECT COALESCE(-SUM(amount),0) FROM public.marketplace_ledger WHERE entry_type='processor_fee'),
    'merchant_pending', (SELECT COALESCE(SUM(amount),0) FROM public.marketplace_ledger WHERE affects_balance AND available_at > now()),
    'merchant_available', (SELECT COALESCE(SUM(amount),0) FROM public.marketplace_ledger WHERE affects_balance AND available_at <= now()),
    'settlements_paid', (SELECT COALESCE(-SUM(amount),0) FROM public.marketplace_ledger WHERE entry_type='payout'),
    'refunds', (SELECT COALESCE(SUM(amount),0) FROM public.marketplace_refunds),
    'open_disputes', (SELECT COUNT(*) FROM public.marketplace_disputes WHERE status NOT IN ('resolved_buyer','resolved_merchant','closed')),
    'payments_succeeded', (SELECT COUNT(*) FROM public.marketplace_payment_transactions WHERE kind='payment' AND status='succeeded'),
    'payments_failed', (SELECT COUNT(*) FROM public.marketplace_payment_attempts WHERE status IN ('failed','expired')),
    'payments_pending', (SELECT COUNT(*) FROM public.marketplace_payment_attempts WHERE status IN ('created','pending')),
    'payouts_pending', (SELECT COUNT(*) FROM public.marketplace_payouts WHERE status IN ('requested','under_review','approved','processing')),
    'open_reconciliation', (SELECT COUNT(*) FROM public.marketplace_reconciliation_items WHERE status IN ('open','investigating')),
    'webhooks_rejected', (SELECT COUNT(*) FROM public.marketplace_webhook_events WHERE status IN ('rejected','error'))
  ) INTO r;
  RETURN r;
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_admin_finance_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_admin_finance_overview() TO authenticated;

CREATE OR REPLACE FUNCTION public.mp_admin_set_payment_env(_environment text, _provider text, _min_payout numeric DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE _old jsonb; _new jsonb;
BEGIN
  IF NOT public.mp_is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF _environment NOT IN ('test','live') THEN RAISE EXCEPTION 'invalid environment'; END IF;
  SELECT value INTO _old FROM public.marketplace_settings WHERE key='payments';
  _new := COALESCE(_old,'{}'::jsonb)
          || jsonb_build_object('environment', _environment, 'provider', COALESCE(_provider,'none'))
          || CASE WHEN _min_payout IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('min_payout', _min_payout) END;
  INSERT INTO public.marketplace_settings(key, value, updated_by) VALUES ('payments', _new, auth.uid())
  ON CONFLICT (key) DO UPDATE SET value=_new, updated_at=now(), updated_by=auth.uid();
  PERFORM public.mp_audit('payment_env_changed','settings','payments', _old, _new, NULL);
  RETURN jsonb_build_object('success', true, 'config', _new);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_admin_set_payment_env(text,text,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_admin_set_payment_env(text,text,numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.mp_admin_reconcile_scan()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF NOT public.mp_is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;

  INSERT INTO public.marketplace_reconciliation_items(kind, order_id, attempt_id, provider, provider_ref, expected_minor, currency, note)
  SELECT 'stale_attempt', a.order_id, a.id, a.provider, a.provider_ref, a.amount_minor, a.currency,
         'Attempt still pending after expiry'
    FROM public.marketplace_payment_attempts a
   WHERE a.status IN ('created','pending') AND a.expires_at < now()
     AND NOT EXISTS (SELECT 1 FROM public.marketplace_reconciliation_items r
                      WHERE r.attempt_id = a.id AND r.kind='stale_attempt' AND r.status IN ('open','investigating'));

  INSERT INTO public.marketplace_reconciliation_items(kind, order_id, transaction_id, provider, provider_ref, expected_minor, actual_minor, currency, note)
  SELECT 'pending_local_paid_provider', t.order_id, t.id, t.provider, t.provider_txn_id, t.gross_amount_minor, t.gross_amount_minor, t.currency,
         'Provider transaction exists but order is not marked paid'
    FROM public.marketplace_payment_transactions t
    JOIN public.marketplace_orders o ON o.id = t.order_id
   WHERE t.kind='payment' AND t.status='succeeded' AND o.payment_status <> 'paid'
     AND NOT EXISTS (SELECT 1 FROM public.marketplace_reconciliation_items r
                      WHERE r.transaction_id = t.id AND r.status IN ('open','investigating'));

  INSERT INTO public.marketplace_reconciliation_items(kind, order_id, transaction_id, provider, provider_ref, expected_minor, actual_minor, currency, note)
  SELECT 'amount_mismatch', t.order_id, t.id, t.provider, t.provider_txn_id,
         ROUND(o.total_amount * public.mp_minor_factor(o.currency))::bigint, t.gross_amount_minor, t.currency,
         'Confirmed amount differs from order total'
    FROM public.marketplace_payment_transactions t
    JOIN public.marketplace_orders o ON o.id = t.order_id
   WHERE t.kind='payment' AND t.status='succeeded'
     AND t.gross_amount_minor <> ROUND(o.total_amount * public.mp_minor_factor(o.currency))::bigint
     AND NOT EXISTS (SELECT 1 FROM public.marketplace_reconciliation_items r
                      WHERE r.transaction_id = t.id AND r.kind='amount_mismatch' AND r.status IN ('open','investigating'));

  PERFORM public.mp_audit('reconciliation_scan','settings','payments', NULL, NULL, NULL);
  RETURN jsonb_build_object('success', true,
    'open', (SELECT COUNT(*) FROM public.marketplace_reconciliation_items WHERE status IN ('open','investigating')));
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_admin_reconcile_scan() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_admin_reconcile_scan() TO authenticated;

CREATE OR REPLACE FUNCTION public.mp_admin_reconcile_resolve(_item_id uuid, _status text, _note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF NOT public.mp_is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF _status NOT IN ('open','investigating','resolved','ignored') THEN RAISE EXCEPTION 'invalid status'; END IF;
  UPDATE public.marketplace_reconciliation_items
     SET status=_status, note=COALESCE(_note, note),
         resolved_by = CASE WHEN _status IN ('resolved','ignored') THEN auth.uid() ELSE resolved_by END,
         resolved_at = CASE WHEN _status IN ('resolved','ignored') THEN now() ELSE resolved_at END
   WHERE id=_item_id;
  PERFORM public.mp_audit('reconciliation_updated','reconciliation',_item_id::text, NULL, jsonb_build_object('status',_status), _note);
  RETURN jsonb_build_object('success', true);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_admin_reconcile_resolve(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_admin_reconcile_resolve(uuid,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.mp_admin_refund(_order_id uuid, _amount numeric, _reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE o record; _comm numeric; _type text; _factor int; _ref text; _avail numeric;
BEGIN
  IF NOT public.mp_is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT * INTO o FROM public.marketplace_orders WHERE id=_order_id FOR UPDATE;
  IF o.id IS NULL THEN RAISE EXCEPTION 'order not found'; END IF;
  IF o.payment_status <> 'paid' THEN RAISE EXCEPTION 'order is not paid'; END IF;
  IF _amount IS NULL OR _amount <= 0 OR _amount > (o.subtotal - o.refunded_amount) THEN
    RAISE EXCEPTION 'invalid refund amount';
  END IF;

  _type := CASE WHEN _amount >= (o.subtotal - o.refunded_amount) THEN 'full' ELSE 'partial' END;
  _comm := ROUND(_amount * o.commission_rate / 100.0, 2);
  _factor := public.mp_minor_factor(o.currency);
  _ref := 'RF-' || o.order_number || '-' || to_char(now(),'YYYYMMDDHH24MISS');

  INSERT INTO public.marketplace_ledger(store_id, order_id, entry_type, amount, affects_balance, available_at, description, metadata)
  VALUES (o.store_id, o.id, CASE WHEN _type='full' THEN 'refund' ELSE 'partial_refund' END, -_amount, true, now(),
          'Refund ' || o.order_number, jsonb_build_object('reference', _ref)),
         (o.store_id, o.id, 'adjustment', _comm, true, now(), 'Commission reversal on refund',
          jsonb_build_object('reference', _ref));

  SELECT COALESCE(SUM(amount),0) INTO _avail FROM public.marketplace_ledger
   WHERE store_id=o.store_id AND affects_balance;
  IF _avail < 0 THEN
    INSERT INTO public.marketplace_ledger(store_id, order_id, entry_type, amount, affects_balance, available_at, description, metadata)
    VALUES (o.store_id, o.id, 'adjustment', 0, false, now(),
            'Merchant liability recorded: balance negative after refund',
            jsonb_build_object('liability', -_avail, 'reference', _ref));
  END IF;

  INSERT INTO public.marketplace_refunds(order_id, store_id, amount, refund_type, reason, created_by)
  VALUES (o.id, o.store_id, _amount, _type, _reason, auth.uid());

  INSERT INTO public.marketplace_payment_transactions(
    order_id, store_id, buyer_id, provider, environment, provider_txn_id, kind,
    gross_amount_minor, commission_minor, processor_fee_minor, merchant_net_minor, currency, status, raw)
  VALUES (o.id, o.store_id, o.buyer_id, COALESCE(o.payment_provider,'manual'),
    COALESCE((public.mp_payment_config())->>'environment','test'), _ref, 'refund',
    -ROUND(_amount * _factor)::bigint, -ROUND(_comm * _factor)::bigint, 0,
    -ROUND((_amount - _comm) * _factor)::bigint, o.currency, 'succeeded',
    jsonb_build_object('reason', _reason, 'actor', auth.uid()))
  ON CONFLICT (provider, provider_txn_id, kind) DO NOTHING;

  UPDATE public.marketplace_orders SET
    refunded_amount = refunded_amount + _amount,
    refund_status = CASE WHEN _type='full' THEN 'refunded' ELSE 'partial' END,
    status = CASE WHEN _type='full' THEN 'refunded' ELSE status END,
    commission_amount = GREATEST(commission_amount - _comm, 0),
    merchant_net = GREATEST(merchant_net - (_amount - _comm), 0),
    updated_at = now()
  WHERE id=_order_id;

  INSERT INTO public.notifications(user_id, type, title, message, data)
  VALUES (o.buyer_id, 'refund', 'تم استرداد مبلغ', 'تمت معالجة استرداد للطلب ' || o.order_number, jsonb_build_object('order_id', o.id));
  INSERT INTO public.notifications(user_id, type, title, message, data)
  SELECT s.owner_id, 'refund', 'استرداد على طلب', 'تم تسجيل استرداد للطلب ' || o.order_number, jsonb_build_object('order_id', o.id)
    FROM public.marketplace_stores s WHERE s.id=o.store_id;

  PERFORM public.mp_audit('refund_processed','order',_order_id::text, NULL,
    jsonb_build_object('amount',_amount,'type',_type,'reference',_ref), _reason);
  RETURN jsonb_build_object('success', true, 'type', _type, 'reference', _ref);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_admin_refund(uuid,numeric,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_admin_refund(uuid,numeric,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.mp_quote_checkout(_items jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE _it jsonb; _p record; _v record; _qty int; _unit numeric;
        _stores jsonb := '{}'::jsonb; _sid text; _cur jsonb; _rate numeric;
        _out jsonb := '[]'::jsonb; _grand numeric := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN RAISE EXCEPTION 'empty cart'; END IF;

  FOR _it IN SELECT e FROM jsonb_array_elements(_items) e LOOP
    SELECT * INTO _p FROM public.marketplace_products
     WHERE id=(_it->>'product_id')::uuid AND status='published';
    CONTINUE WHEN _p.id IS NULL;
    _qty := GREATEST(1, LEAST(COALESCE((_it->>'quantity')::int,1), 999));
    _unit := COALESCE(NULLIF(_p.discount_price,0), _p.price);
    IF (_it->>'variant_id') IS NOT NULL AND (_it->>'variant_id') <> '' THEN
      SELECT * INTO _v FROM public.marketplace_product_variants WHERE id=(_it->>'variant_id')::uuid AND product_id=_p.id;
      IF _v.id IS NOT NULL THEN _unit := _unit + COALESCE(_v.price_delta,0); END IF;
    END IF;
    _sid := _p.store_id::text;
    _cur := COALESCE(_stores->_sid, jsonb_build_object('subtotal',0,'shipping',0,'currency',_p.currency));
    _stores := _stores || jsonb_build_object(_sid, jsonb_build_object(
      'subtotal', (_cur->>'subtotal')::numeric + (_unit * _qty),
      'shipping', GREATEST((_cur->>'shipping')::numeric, COALESCE(_p.shipping_fee,0)),
      'currency', _p.currency));
  END LOOP;

  FOR _sid, _cur IN SELECT * FROM jsonb_each(_stores) LOOP
    _rate := public.mp_effective_commission(_sid::uuid, NULL);
    _out := _out || jsonb_build_object(
      'store_id', _sid,
      'subtotal', (_cur->>'subtotal')::numeric,
      'shipping', (_cur->>'shipping')::numeric,
      'total', (_cur->>'subtotal')::numeric + (_cur->>'shipping')::numeric,
      'commission_rate', _rate,
      'commission_amount', ROUND((_cur->>'subtotal')::numeric * _rate / 100.0, 2),
      'merchant_entitlement', ROUND((_cur->>'subtotal')::numeric * (100 - _rate) / 100.0, 2) + (_cur->>'shipping')::numeric,
      'currency', _cur->>'currency');
    _grand := _grand + (_cur->>'subtotal')::numeric + (_cur->>'shipping')::numeric;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'stores', _out, 'grand_total', _grand, 'currency', 'IQD');
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_quote_checkout(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_quote_checkout(jsonb) TO authenticated;