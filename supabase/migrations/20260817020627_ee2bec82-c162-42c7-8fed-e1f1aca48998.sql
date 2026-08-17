-- effective commission
CREATE OR REPLACE FUNCTION public.mp_effective_commission(_store_id uuid, _category text DEFAULT NULL)
RETURNS numeric LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE _rate numeric; _override numeric;
BEGIN
  SELECT commission_rate INTO _override FROM public.marketplace_stores WHERE id = _store_id;
  IF _override IS NOT NULL THEN RETURN _override; END IF;

  SELECT rate INTO _rate FROM public.marketplace_commission_rules
   WHERE is_active AND scope='store' AND store_id=_store_id
     AND effective_from <= now() AND (effective_to IS NULL OR effective_to > now())
   ORDER BY effective_from DESC LIMIT 1;
  IF _rate IS NOT NULL THEN RETURN _rate; END IF;

  IF _category IS NOT NULL THEN
    SELECT rate INTO _rate FROM public.marketplace_commission_rules
     WHERE is_active AND scope='category' AND category=_category
       AND effective_from <= now() AND (effective_to IS NULL OR effective_to > now())
     ORDER BY effective_from DESC LIMIT 1;
    IF _rate IS NOT NULL THEN RETURN _rate; END IF;
  END IF;

  SELECT rate INTO _rate FROM public.marketplace_commission_rules
   WHERE is_active AND scope='default'
     AND effective_from <= now() AND (effective_to IS NULL OR effective_to > now())
   ORDER BY effective_from DESC LIMIT 1;
  IF _rate IS NOT NULL THEN RETURN _rate; END IF;

  SELECT COALESCE((value->>'default_rate')::numeric, 2) INTO _rate FROM public.marketplace_settings WHERE key='commission';
  RETURN COALESCE(_rate, 2);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_effective_commission(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_effective_commission(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.mp_hold_days(_store_id uuid)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE _d integer;
BEGIN
  SELECT hold_days INTO _d FROM public.marketplace_stores WHERE id=_store_id;
  IF _d IS NOT NULL THEN RETURN _d; END IF;
  SELECT COALESCE((value->>'days')::int, 7) INTO _d FROM public.marketplace_settings WHERE key='hold';
  RETURN COALESCE(_d, 7);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_hold_days(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_hold_days(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.mp_audit(_action text, _target_type text, _target_id text, _old jsonb, _new jsonb, _reason text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
  INSERT INTO public.marketplace_audit_logs(actor_id, action, target_type, target_id, old_value, new_value, reason)
  VALUES (auth.uid(), _action, _target_type, _target_id, _old, _new, _reason);
$fn$;
REVOKE EXECUTE ON FUNCTION public.mp_audit(text,text,text,jsonb,jsonb,text) FROM PUBLIC, anon, authenticated;

-- balances derived from ledger
CREATE OR REPLACE FUNCTION public.mp_store_balances(_store_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE r jsonb;
BEGIN
  IF NOT (public.mp_owns_store(_store_id) OR public.mp_is_admin()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  SELECT jsonb_build_object(
    'pending', COALESCE(SUM(amount) FILTER (WHERE affects_balance AND available_at > now()),0),
    'available', COALESCE(SUM(amount) FILTER (WHERE affects_balance AND available_at <= now()),0),
    'paid', COALESCE(-SUM(amount) FILTER (WHERE entry_type='payout'),0),
    'gross_sales', COALESCE(SUM(amount) FILTER (WHERE entry_type='sale_gross'),0),
    'commission', COALESCE(-SUM(amount) FILTER (WHERE entry_type='commission'),0),
    'processor_fees', COALESCE(-SUM(amount) FILTER (WHERE entry_type='processor_fee'),0),
    'refunds', COALESCE(-SUM(amount) FILTER (WHERE entry_type IN ('refund','partial_refund','chargeback')),0),
    'lifetime_net', COALESCE(SUM(amount) FILTER (WHERE affects_balance AND entry_type <> 'payout'),0)
  ) INTO r FROM public.marketplace_ledger WHERE store_id=_store_id;
  RETURN COALESCE(r,'{}'::jsonb);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_store_balances(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_store_balances(uuid) TO authenticated;

-- CHECKOUT: server computes everything
CREATE OR REPLACE FUNCTION public.mp_place_order(
  _items jsonb, _buyer_name text, _buyer_phone text, _address text,
  _city text DEFAULT NULL, _note text DEFAULT NULL, _payment_method text DEFAULT 'cod'
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  _uid uuid := auth.uid();
  _store record; _it jsonb; _p record; _v record;
  _order_id uuid; _orders jsonb := '[]'::jsonb;
  _subtotal numeric; _ship numeric; _unit numeric; _qty int; _rate numeric; _total numeric;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN RAISE EXCEPTION 'empty cart'; END IF;
  IF coalesce(trim(_buyer_phone),'') = '' OR coalesce(trim(_address),'') = '' THEN
    RAISE EXCEPTION 'address and phone required';
  END IF;
  IF _payment_method NOT IN ('cod','wallet','gateway') THEN RAISE EXCEPTION 'invalid payment method'; END IF;

  FOR _store IN
    SELECT DISTINCT p.store_id AS sid
    FROM jsonb_array_elements(_items) e
    JOIN public.marketplace_products p ON p.id = (e->>'product_id')::uuid
  LOOP
    SELECT * INTO _p FROM public.marketplace_stores WHERE id=_store.sid;
    IF _p.status <> 'approved' THEN RAISE EXCEPTION 'store not available'; END IF;

    _subtotal := 0; _ship := 0;
    _order_id := gen_random_uuid();
    INSERT INTO public.marketplace_orders(id, buyer_id, store_id, buyer_name, buyer_phone, address, city, note, payment_method, status, payment_status, currency)
    VALUES (_order_id, _uid, _store.sid, _buyer_name, _buyer_phone, _address, _city, _note, _payment_method, 'payment_pending', 'pending', 'IQD');

    FOR _it IN SELECT e FROM jsonb_array_elements(_items) e LOOP
      SELECT * INTO _p FROM public.marketplace_products
       WHERE id = (_it->>'product_id')::uuid AND store_id = _store.sid AND status='published' FOR UPDATE;
      CONTINUE WHEN _p.id IS NULL;
      _qty := GREATEST(1, LEAST(COALESCE((_it->>'quantity')::int,1), 999));
      IF _p.stock < _qty THEN RAISE EXCEPTION 'insufficient stock for %', _p.name; END IF;
      _unit := COALESCE(NULLIF(_p.discount_price,0), _p.price);
      _v := NULL;
      IF (_it->>'variant_id') IS NOT NULL AND (_it->>'variant_id') <> '' THEN
        SELECT * INTO _v FROM public.marketplace_product_variants WHERE id=(_it->>'variant_id')::uuid AND product_id=_p.id;
        IF _v.id IS NOT NULL THEN _unit := _unit + COALESCE(_v.price_delta,0); END IF;
      END IF;

      INSERT INTO public.marketplace_order_items(order_id, product_id, variant_id, product_name, product_image, variant_label, unit_price, quantity, line_total)
      VALUES (_order_id, _p.id, _v.id, _p.name, _p.image_url, _v.label, _unit, _qty, _unit * _qty);

      UPDATE public.marketplace_products
         SET stock = stock - _qty, sales_count = sales_count + _qty, updated_at = now()
       WHERE id = _p.id;

      _subtotal := _subtotal + (_unit * _qty);
      _ship := GREATEST(_ship, COALESCE(_p.shipping_fee,0));
    END LOOP;

    IF _subtotal = 0 THEN
      DELETE FROM public.marketplace_orders WHERE id=_order_id;
      CONTINUE;
    END IF;

    SELECT category INTO _p FROM public.marketplace_products WHERE store_id=_store.sid LIMIT 1;
    _rate := public.mp_effective_commission(_store.sid, NULL);
    _total := _subtotal + _ship;

    UPDATE public.marketplace_orders SET
      subtotal = _subtotal, shipping_amount = _ship, total_amount = _total,
      commission_rate = _rate,
      commission_amount = ROUND(_subtotal * _rate / 100.0, 2),
      merchant_net = ROUND(_subtotal - (_subtotal * _rate / 100.0), 2) + _ship,
      updated_at = now()
    WHERE id = _order_id;

    INSERT INTO public.notifications(user_id, type, title, message, data)
    SELECT s.owner_id, 'order_new', 'طلب جديد', 'لديك طلب جديد في متجرك',
           jsonb_build_object('order_id', _order_id, 'store_id', _store.sid)
      FROM public.marketplace_stores s WHERE s.id=_store.sid;

    _orders := _orders || jsonb_build_object('order_id', _order_id, 'store_id', _store.sid, 'total', _total);
  END LOOP;

  DELETE FROM public.marketplace_carts c
   WHERE c.user_id = _uid
     AND c.product_id IN (SELECT (e->>'product_id')::uuid FROM jsonb_array_elements(_items) e);

  RETURN jsonb_build_object('success', true, 'orders', _orders);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_place_order(jsonb,text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_place_order(jsonb,text,text,text,text,text,text) TO authenticated;

-- mark order paid (admin or gateway webhook via service role)
CREATE OR REPLACE FUNCTION public.mp_mark_order_paid(_order_id uuid, _reference text DEFAULT NULL, _processor_fee numeric DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE o record; _avail timestamptz;
BEGIN
  IF NOT public.mp_is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT * INTO o FROM public.marketplace_orders WHERE id=_order_id FOR UPDATE;
  IF o.id IS NULL THEN RAISE EXCEPTION 'order not found'; END IF;
  IF o.payment_status = 'paid' THEN RETURN jsonb_build_object('success', true, 'already', true); END IF;

  _avail := now() + (public.mp_hold_days(o.store_id) || ' days')::interval;

  UPDATE public.marketplace_orders SET payment_status='paid', status='paid',
    payment_reference=_reference, processor_fee=COALESCE(_processor_fee,0), settle_at=_avail, updated_at=now()
  WHERE id=_order_id;

  INSERT INTO public.marketplace_ledger(store_id, order_id, entry_type, amount, affects_balance, available_at, description)
  VALUES
    (o.store_id, o.id, 'sale_gross', o.subtotal, true, _avail, 'Gross sale ' || o.order_number),
    (o.store_id, o.id, 'commission', -ROUND(o.subtotal * o.commission_rate / 100.0, 2), true, _avail,
      'Platform commission ' || o.commission_rate || '%');
  IF o.shipping_amount > 0 THEN
    INSERT INTO public.marketplace_ledger(store_id, order_id, entry_type, amount, affects_balance, available_at, description)
    VALUES (o.store_id, o.id, 'shipping', o.shipping_amount, true, _avail, 'Shipping');
  END IF;
  IF COALESCE(_processor_fee,0) > 0 THEN
    INSERT INTO public.marketplace_ledger(store_id, order_id, entry_type, amount, affects_balance, available_at, description)
    VALUES (o.store_id, o.id, 'processor_fee', -_processor_fee, true, _avail, 'Processor fee');
  END IF;

  UPDATE public.marketplace_stores SET orders_count = orders_count + 1 WHERE id = o.store_id;

  INSERT INTO public.notifications(user_id, type, title, message, data)
  VALUES (o.buyer_id, 'order_update', 'تم تأكيد الدفع', 'تم تأكيد دفع طلبك ' || o.order_number,
          jsonb_build_object('order_id', o.id));

  PERFORM public.mp_audit('order_marked_paid','order',_order_id::text, NULL, jsonb_build_object('reference',_reference), NULL);
  RETURN jsonb_build_object('success', true);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_mark_order_paid(uuid,text,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_mark_order_paid(uuid,text,numeric) TO authenticated;

-- merchant fulfilment status
CREATE OR REPLACE FUNCTION public.mp_set_fulfilment(_order_id uuid, _status text, _tracking text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE o record;
BEGIN
  SELECT * INTO o FROM public.marketplace_orders WHERE id=_order_id;
  IF o.id IS NULL THEN RAISE EXCEPTION 'order not found'; END IF;
  IF NOT (public.mp_owns_store(o.store_id) OR public.mp_is_admin()) THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF _status NOT IN ('confirmed','preparing','shipped','delivered','completed','cancelled') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;
  IF o.status IN ('refunded','cancelled') THEN RAISE EXCEPTION 'order is closed'; END IF;

  UPDATE public.marketplace_orders SET status=_status,
    shipping_status = CASE WHEN _status='shipped' THEN 'shipped'
                           WHEN _status IN ('delivered','completed') THEN 'delivered'
                           ELSE shipping_status END,
    tracking_number = COALESCE(_tracking, tracking_number), updated_at=now()
  WHERE id=_order_id;

  INSERT INTO public.notifications(user_id, type, title, message, data)
  VALUES (o.buyer_id, 'order_update', 'تحديث الطلب', 'حالة طلبك ' || o.order_number || ': ' || _status,
          jsonb_build_object('order_id', o.id));
  RETURN jsonb_build_object('success', true);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_set_fulfilment(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_set_fulfilment(uuid,text,text) TO authenticated;

-- buyer cancel
CREATE OR REPLACE FUNCTION public.mp_cancel_order(_order_id uuid, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE o record;
BEGIN
  SELECT * INTO o FROM public.marketplace_orders WHERE id=_order_id;
  IF o.id IS NULL OR o.buyer_id <> auth.uid() THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF o.status NOT IN ('pending','payment_pending','paid','confirmed') THEN RAISE EXCEPTION 'order can no longer be cancelled'; END IF;
  IF o.payment_status = 'paid' THEN RAISE EXCEPTION 'contact support to refund a paid order'; END IF;

  UPDATE public.marketplace_orders SET status='cancelled', updated_at=now() WHERE id=_order_id;
  UPDATE public.marketplace_products p SET stock = p.stock + i.quantity
    FROM public.marketplace_order_items i WHERE i.order_id=_order_id AND i.product_id=p.id;
  INSERT INTO public.notifications(user_id, type, title, message, data)
  SELECT s.owner_id, 'order_update', 'تم إلغاء طلب', 'تم إلغاء الطلب ' || o.order_number, jsonb_build_object('order_id', o.id)
  FROM public.marketplace_stores s WHERE s.id=o.store_id;
  RETURN jsonb_build_object('success', true);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_cancel_order(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_cancel_order(uuid,text) TO authenticated;

-- refunds
CREATE OR REPLACE FUNCTION public.mp_admin_refund(_order_id uuid, _amount numeric, _reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE o record; _comm numeric; _type text;
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

  INSERT INTO public.marketplace_ledger(store_id, order_id, entry_type, amount, affects_balance, available_at, description)
  VALUES (o.store_id, o.id, CASE WHEN _type='full' THEN 'refund' ELSE 'partial_refund' END, -_amount, true, now(), 'Refund ' || o.order_number),
         (o.store_id, o.id, 'adjustment', _comm, true, now(), 'Commission reversal on refund');

  INSERT INTO public.marketplace_refunds(order_id, store_id, amount, refund_type, reason, created_by)
  VALUES (o.id, o.store_id, _amount, _type, _reason, auth.uid());

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

  PERFORM public.mp_audit('refund_processed','order',_order_id::text, NULL, jsonb_build_object('amount',_amount,'type',_type), _reason);
  RETURN jsonb_build_object('success', true, 'type', _type);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_admin_refund(uuid,numeric,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_admin_refund(uuid,numeric,text) TO authenticated;

-- payouts
CREATE OR REPLACE FUNCTION public.mp_request_payout(_store_id uuid, _amount numeric, _method text DEFAULT NULL, _destination text DEFAULT NULL, _note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE b jsonb; _avail numeric; _locked numeric; _id uuid;
BEGIN
  IF NOT public.mp_owns_store(_store_id) THEN RAISE EXCEPTION 'not authorized'; END IF;
  b := public.mp_store_balances(_store_id);
  _avail := COALESCE((b->>'available')::numeric, 0);
  SELECT COALESCE(SUM(amount),0) INTO _locked FROM public.marketplace_payouts
   WHERE store_id=_store_id AND status IN ('requested','under_review','approved','processing');
  IF _amount IS NULL OR _amount <= 0 OR _amount > (_avail - _locked) THEN
    RAISE EXCEPTION 'insufficient available balance';
  END IF;
  _id := gen_random_uuid();
  INSERT INTO public.marketplace_payouts(id, store_id, requested_by, amount, method, destination, merchant_note, idempotency_key)
  VALUES (_id, _store_id, auth.uid(), _amount, _method, _destination, _note, 'PO-' || replace(_id::text,'-',''));
  PERFORM public.mp_audit('payout_requested','payout',_id::text, NULL, jsonb_build_object('amount',_amount), NULL);
  RETURN jsonb_build_object('success', true, 'payout_id', _id);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_request_payout(uuid,numeric,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_request_payout(uuid,numeric,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.mp_admin_payout_action(_payout_id uuid, _action text, _reference text DEFAULT NULL, _note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE p record; _new text;
BEGIN
  IF NOT public.mp_is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT * INTO p FROM public.marketplace_payouts WHERE id=_payout_id FOR UPDATE;
  IF p.id IS NULL THEN RAISE EXCEPTION 'payout not found'; END IF;
  IF p.status = 'paid' THEN RAISE EXCEPTION 'payout already paid'; END IF;

  _new := CASE _action
    WHEN 'review' THEN 'under_review' WHEN 'approve' THEN 'approved'
    WHEN 'processing' THEN 'processing' WHEN 'paid' THEN 'paid'
    WHEN 'reject' THEN 'rejected' WHEN 'cancel' THEN 'cancelled'
    ELSE NULL END;
  IF _new IS NULL THEN RAISE EXCEPTION 'invalid action'; END IF;

  UPDATE public.marketplace_payouts SET status=_new, admin_note=COALESCE(_note, admin_note),
    payment_reference=COALESCE(_reference, payment_reference), reviewed_by=auth.uid(), reviewed_at=now(),
    paid_at = CASE WHEN _new='paid' THEN now() ELSE paid_at END, updated_at=now()
  WHERE id=_payout_id;

  IF _new = 'paid' THEN
    INSERT INTO public.marketplace_ledger(store_id, payout_id, entry_type, amount, affects_balance, available_at, description, created_by)
    VALUES (p.store_id, p.id, 'payout', -p.amount, true, now(), 'Payout ' || p.idempotency_key, auth.uid());
  END IF;

  INSERT INTO public.notifications(user_id, type, title, message, data)
  SELECT s.owner_id, 'payout', 'تحديث طلب السحب', 'حالة طلب السحب: ' || _new, jsonb_build_object('payout_id', p.id)
  FROM public.marketplace_stores s WHERE s.id=p.store_id;

  PERFORM public.mp_audit('payout_' || _new,'payout',_payout_id::text, jsonb_build_object('status',p.status), jsonb_build_object('status',_new,'reference',_reference), _note);
  RETURN jsonb_build_object('success', true, 'status', _new);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_admin_payout_action(uuid,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_admin_payout_action(uuid,text,text,text) TO authenticated;

-- store moderation
CREATE OR REPLACE FUNCTION public.mp_admin_store_action(_store_id uuid, _action text, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE s record; _new text;
BEGIN
  IF NOT public.mp_is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT * INTO s FROM public.marketplace_stores WHERE id=_store_id;
  IF s.id IS NULL THEN RAISE EXCEPTION 'store not found'; END IF;

  IF _action IN ('verify','unverify') THEN
    UPDATE public.marketplace_stores SET is_verified = (_action='verify'), updated_at=now() WHERE id=_store_id;
  ELSIF _action = 'note' THEN
    UPDATE public.marketplace_stores SET admin_notes=_reason, updated_at=now() WHERE id=_store_id;
  ELSE
    _new := CASE _action WHEN 'approve' THEN 'approved' WHEN 'reject' THEN 'rejected'
                         WHEN 'suspend' THEN 'suspended' WHEN 'disable' THEN 'disabled'
                         WHEN 'restore' THEN 'approved' ELSE NULL END;
    IF _new IS NULL THEN RAISE EXCEPTION 'invalid action'; END IF;
    UPDATE public.marketplace_stores SET status=_new, rejection_reason = CASE WHEN _new='rejected' THEN _reason ELSE rejection_reason END, updated_at=now()
    WHERE id=_store_id;
    INSERT INTO public.notifications(user_id, type, title, message, data)
    VALUES (s.owner_id, 'store', 'تحديث حالة المتجر', 'حالة متجرك الآن: ' || _new, jsonb_build_object('store_id', s.id));
  END IF;

  PERFORM public.mp_audit('store_' || _action,'store',_store_id::text, jsonb_build_object('status',s.status,'verified',s.is_verified), jsonb_build_object('action',_action), _reason);
  RETURN jsonb_build_object('success', true);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_admin_store_action(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_admin_store_action(uuid,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.mp_admin_product_action(_product_id uuid, _action text, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE p record; _new text;
BEGIN
  IF NOT public.mp_is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT * INTO p FROM public.marketplace_products WHERE id=_product_id;
  IF p.id IS NULL THEN RAISE EXCEPTION 'product not found'; END IF;
  _new := CASE _action WHEN 'approve' THEN 'published' WHEN 'reject' THEN 'rejected'
                       WHEN 'suspend' THEN 'suspended' WHEN 'restore' THEN 'published'
                       WHEN 'draft' THEN 'draft' ELSE NULL END;
  IF _new IS NULL THEN RAISE EXCEPTION 'invalid action'; END IF;
  UPDATE public.marketplace_products SET status=_new,
    rejection_reason = CASE WHEN _new='rejected' THEN _reason ELSE rejection_reason END, updated_at=now()
  WHERE id=_product_id;
  PERFORM public.mp_audit('product_' || _action,'product',_product_id::text, jsonb_build_object('status',p.status), jsonb_build_object('status',_new), _reason);
  RETURN jsonb_build_object('success', true, 'status', _new);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_admin_product_action(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_admin_product_action(uuid,text,text) TO authenticated;

-- commission management
CREATE OR REPLACE FUNCTION public.mp_admin_set_commission(
  _scope text, _rate numeric, _store_id uuid DEFAULT NULL, _category text DEFAULT NULL,
  _effective_from timestamptz DEFAULT now(), _effective_to timestamptz DEFAULT NULL, _note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE _id uuid;
BEGIN
  IF NOT public.mp_is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF _scope NOT IN ('default','store','category') THEN RAISE EXCEPTION 'invalid scope'; END IF;
  IF _rate < 0 OR _rate > 100 THEN RAISE EXCEPTION 'invalid rate'; END IF;

  UPDATE public.marketplace_commission_rules SET is_active=false
   WHERE is_active AND scope=_scope
     AND ((_scope='store' AND store_id=_store_id) OR (_scope='category' AND category=_category) OR _scope='default');

  INSERT INTO public.marketplace_commission_rules(scope, store_id, category, rate, effective_from, effective_to, note, created_by)
  VALUES (_scope, _store_id, _category, _rate, COALESCE(_effective_from, now()), _effective_to, _note, auth.uid())
  RETURNING id INTO _id;

  IF _scope='default' THEN
    UPDATE public.marketplace_settings SET value = jsonb_build_object('default_rate', _rate), updated_at=now(), updated_by=auth.uid()
     WHERE key='commission';
  END IF;

  PERFORM public.mp_audit('commission_changed', _scope, COALESCE(_store_id::text, _category, 'default'), NULL,
    jsonb_build_object('rate',_rate,'from',_effective_from,'to',_effective_to), _note);
  RETURN jsonb_build_object('success', true, 'rule_id', _id);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_admin_set_commission(text,numeric,uuid,text,timestamptz,timestamptz,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_admin_set_commission(text,numeric,uuid,text,timestamptz,timestamptz,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.mp_admin_set_setting(_key text, _value jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF NOT public.mp_is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  INSERT INTO public.marketplace_settings(key, value, updated_at, updated_by)
  VALUES (_key, _value, now(), auth.uid())
  ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=now(), updated_by=auth.uid();
  PERFORM public.mp_audit('setting_changed','setting',_key, NULL, _value, NULL);
  RETURN jsonb_build_object('success', true);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_admin_set_setting(text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_admin_set_setting(text,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.mp_admin_set_store_commission(_store_id uuid, _rate numeric, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE s record;
BEGIN
  IF NOT public.mp_is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT * INTO s FROM public.marketplace_stores WHERE id=_store_id;
  IF s.id IS NULL THEN RAISE EXCEPTION 'store not found'; END IF;
  IF _rate IS NOT NULL AND (_rate < 0 OR _rate > 100) THEN RAISE EXCEPTION 'invalid rate'; END IF;
  UPDATE public.marketplace_stores SET commission_rate=_rate, updated_at=now() WHERE id=_store_id;
  PERFORM public.mp_audit('store_commission_changed','store',_store_id::text,
    jsonb_build_object('rate', s.commission_rate), jsonb_build_object('rate',_rate), _reason);
  RETURN jsonb_build_object('success', true);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_admin_set_store_commission(uuid,numeric,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_admin_set_store_commission(uuid,numeric,text) TO authenticated;

-- reviews
CREATE OR REPLACE FUNCTION public.mp_submit_review(_order_id uuid, _product_id uuid, _rating integer, _body text DEFAULT NULL, _images jsonb DEFAULT '[]'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE o record;
BEGIN
  SELECT * INTO o FROM public.marketplace_orders WHERE id=_order_id;
  IF o.id IS NULL OR o.buyer_id <> auth.uid() THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF o.status NOT IN ('delivered','completed') THEN RAISE EXCEPTION 'you can review after delivery'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.marketplace_order_items WHERE order_id=_order_id AND product_id=_product_id) THEN
    RAISE EXCEPTION 'product not in this order';
  END IF;
  IF _rating < 1 OR _rating > 5 THEN RAISE EXCEPTION 'invalid rating'; END IF;

  INSERT INTO public.marketplace_reviews(product_id, store_id, order_id, user_id, rating, body, images)
  VALUES (_product_id, o.store_id, _order_id, auth.uid(), _rating, _body, COALESCE(_images,'[]'::jsonb))
  ON CONFLICT (order_id, product_id, user_id) DO NOTHING;

  UPDATE public.marketplace_products p SET
    rating = sub.avg_rating, reviews_count = sub.cnt
  FROM (SELECT AVG(rating)::numeric(3,2) avg_rating, COUNT(*) cnt FROM public.marketplace_reviews WHERE product_id=_product_id AND NOT is_hidden) sub
  WHERE p.id=_product_id;

  UPDATE public.marketplace_stores s SET rating = sub.avg_rating, reviews_count = sub.cnt
  FROM (SELECT AVG(rating)::numeric(3,2) avg_rating, COUNT(*) cnt FROM public.marketplace_reviews WHERE store_id=o.store_id AND NOT is_hidden) sub
  WHERE s.id=o.store_id;

  INSERT INTO public.notifications(user_id, type, title, message, data)
  SELECT s.owner_id, 'review', 'تقييم جديد', 'حصل منتجك على تقييم جديد', jsonb_build_object('product_id', _product_id)
  FROM public.marketplace_stores s WHERE s.id=o.store_id;

  RETURN jsonb_build_object('success', true);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_submit_review(uuid,uuid,integer,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_submit_review(uuid,uuid,integer,text,jsonb) TO authenticated;

-- disputes
CREATE OR REPLACE FUNCTION public.mp_open_dispute(_order_id uuid, _reason text, _details text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE o record; _id uuid;
BEGIN
  SELECT * INTO o FROM public.marketplace_orders WHERE id=_order_id;
  IF o.id IS NULL OR o.buyer_id <> auth.uid() THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF EXISTS (SELECT 1 FROM public.marketplace_disputes WHERE order_id=_order_id AND status NOT IN ('closed','resolved_buyer','resolved_merchant')) THEN
    RAISE EXCEPTION 'dispute already open';
  END IF;
  INSERT INTO public.marketplace_disputes(order_id, buyer_id, store_id, reason, details, history)
  VALUES (_order_id, auth.uid(), o.store_id, _reason, _details,
    jsonb_build_array(jsonb_build_object('at', now(), 'by', auth.uid(), 'action','opened')))
  RETURNING id INTO _id;
  UPDATE public.marketplace_orders SET dispute_status='open', status='disputed', updated_at=now() WHERE id=_order_id;
  INSERT INTO public.notifications(user_id, type, title, message, data)
  SELECT s.owner_id, 'dispute', 'نزاع جديد', 'تم فتح نزاع على الطلب ' || o.order_number, jsonb_build_object('dispute_id', _id)
  FROM public.marketplace_stores s WHERE s.id=o.store_id;
  RETURN jsonb_build_object('success', true, 'dispute_id', _id);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_open_dispute(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_open_dispute(uuid,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.mp_dispute_action(_dispute_id uuid, _action text, _text text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE d record; _new text; _is_admin boolean := public.mp_is_admin();
BEGIN
  SELECT * INTO d FROM public.marketplace_disputes WHERE id=_dispute_id;
  IF d.id IS NULL THEN RAISE EXCEPTION 'dispute not found'; END IF;

  IF _action = 'respond' THEN
    IF NOT public.mp_owns_store(d.store_id) THEN RAISE EXCEPTION 'not authorized'; END IF;
    _new := 'merchant_response';
    UPDATE public.marketplace_disputes SET merchant_response=_text, status=_new,
      history = history || jsonb_build_object('at', now(), 'by', auth.uid(), 'action','merchant_response'), updated_at=now()
    WHERE id=_dispute_id;
  ELSE
    IF NOT _is_admin THEN RAISE EXCEPTION 'not authorized'; END IF;
    _new := CASE _action WHEN 'review' THEN 'under_review' WHEN 'resolve_buyer' THEN 'resolved_buyer'
                         WHEN 'resolve_merchant' THEN 'resolved_merchant' WHEN 'close' THEN 'closed' ELSE NULL END;
    IF _new IS NULL THEN RAISE EXCEPTION 'invalid action'; END IF;
    UPDATE public.marketplace_disputes SET status=_new, resolution_note=COALESCE(_text, resolution_note),
      history = history || jsonb_build_object('at', now(), 'by', auth.uid(), 'action', _new), updated_at=now()
    WHERE id=_dispute_id;
    UPDATE public.marketplace_orders SET dispute_status=_new, updated_at=now() WHERE id=d.order_id;
    PERFORM public.mp_audit('dispute_' || _new,'dispute',_dispute_id::text, jsonb_build_object('status',d.status), jsonb_build_object('status',_new), _text);
  END IF;

  INSERT INTO public.notifications(user_id, type, title, message, data)
  VALUES (d.buyer_id, 'dispute', 'تحديث النزاع', 'حالة النزاع: ' || _new, jsonb_build_object('dispute_id', d.id));
  RETURN jsonb_build_object('success', true, 'status', _new);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_dispute_action(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_dispute_action(uuid,text,text) TO authenticated;

-- admin overview
CREATE OR REPLACE FUNCTION public.mp_admin_overview()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE r jsonb;
BEGIN
  IF NOT public.mp_is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT jsonb_build_object(
    'total_sales', (SELECT COALESCE(SUM(total_amount),0) FROM public.marketplace_orders WHERE payment_status='paid'),
    'commission_revenue', (SELECT COALESCE(-SUM(amount),0) FROM public.marketplace_ledger WHERE entry_type='commission'),
    'pending_balances', (SELECT COALESCE(SUM(amount),0) FROM public.marketplace_ledger WHERE affects_balance AND available_at > now()),
    'available_balances', (SELECT COALESCE(SUM(amount),0) FROM public.marketplace_ledger WHERE affects_balance AND available_at <= now()),
    'total_payouts', (SELECT COALESCE(SUM(amount),0) FROM public.marketplace_payouts WHERE status='paid'),
    'pending_payouts', (SELECT COUNT(*) FROM public.marketplace_payouts WHERE status IN ('requested','under_review','approved','processing')),
    'refunds', (SELECT COALESCE(SUM(amount),0) FROM public.marketplace_refunds),
    'active_stores', (SELECT COUNT(*) FROM public.marketplace_stores WHERE status='approved'),
    'pending_stores', (SELECT COUNT(*) FROM public.marketplace_stores WHERE status='pending'),
    'total_products', (SELECT COUNT(*) FROM public.marketplace_products),
    'pending_products', (SELECT COUNT(*) FROM public.marketplace_products WHERE status='pending'),
    'total_orders', (SELECT COUNT(*) FROM public.marketplace_orders),
    'completed_orders', (SELECT COUNT(*) FROM public.marketplace_orders WHERE status='completed'),
    'cancelled_orders', (SELECT COUNT(*) FROM public.marketplace_orders WHERE status='cancelled'),
    'disputes', (SELECT COUNT(*) FROM public.marketplace_disputes WHERE status NOT IN ('closed','resolved_buyer','resolved_merchant')),
    'reports', (SELECT COUNT(*) FROM public.marketplace_reports WHERE status='pending')
  ) INTO r;
  RETURN r;
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_admin_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_admin_overview() TO authenticated;

CREATE OR REPLACE FUNCTION public.mp_admin_report_action(_report_id uuid, _status text, _note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF NOT public.mp_is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF _status NOT IN ('pending','reviewing','resolved','dismissed') THEN RAISE EXCEPTION 'invalid status'; END IF;
  UPDATE public.marketplace_reports SET status=_status, handled_by=auth.uid() WHERE id=_report_id;
  PERFORM public.mp_audit('report_' || _status,'report',_report_id::text, NULL, NULL, _note);
  RETURN jsonb_build_object('success', true);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.mp_admin_report_action(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_admin_report_action(uuid,text,text) TO authenticated;