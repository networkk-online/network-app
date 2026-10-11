-- Networkk wallet hardening: atomic R Coin transfers.
-- This migration does not alter or reset existing balances.
CREATE OR REPLACE FUNCTION public.transfer_gems_atomic(
  _recipient_id uuid,
  _amount integer,
  _note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_sender uuid := auth.uid();
  v_sender_balance integer;
  v_recipient_balance integer;
  v_new_sender_balance integer;
  v_fee integer;
  v_total integer;
  v_note text := left(trim(COALESCE(_note, '')), 200);
BEGIN
  IF v_sender IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthenticated');
  END IF;

  IF _recipient_id IS NULL OR _recipient_id = v_sender
     OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _recipient_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_recipient');
  END IF;

  IF _amount IS NULL OR _amount <= 0 OR _amount > 1000000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  -- Ensure a zero-balance row exists for a new recipient; this does not change
  -- any existing balance or grant currency.
  INSERT INTO public.user_gems (user_id, balance, total_earned)
  VALUES (_recipient_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Lock both rows in a stable order to avoid races and reduce deadlocks.
  PERFORM user_id
    FROM public.user_gems
   WHERE user_id IN (v_sender, _recipient_id)
   ORDER BY user_id
   FOR UPDATE;

  SELECT balance INTO v_sender_balance
    FROM public.user_gems WHERE user_id = v_sender;
  SELECT balance INTO v_recipient_balance
    FROM public.user_gems WHERE user_id = _recipient_id;

  v_fee := GREATEST(CEIL(_amount * 0.02)::integer, 1);
  v_total := _amount + v_fee;

  IF v_sender_balance IS NULL OR v_sender_balance < v_total THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_balance',
      'balance', COALESCE(v_sender_balance, 0),
      'required', v_total
    );
  END IF;

  UPDATE public.user_gems
     SET balance = balance - v_total, updated_at = now()
   WHERE user_id = v_sender
   RETURNING balance INTO v_new_sender_balance;

  UPDATE public.user_gems
     SET balance = balance + _amount,
         total_earned = total_earned + _amount,
         updated_at = now()
   WHERE user_id = _recipient_id;

  -- All balance changes, audit records and transaction records commit or roll
  -- back together as one PostgreSQL transaction.
  INSERT INTO public.transactions (user_id, admin_id, amount, type, status, notes)
  VALUES
    (v_sender, _recipient_id, _amount, 'transfer_out', 'completed',
      'تحويل إلى مستخدم' || CASE WHEN v_note <> '' THEN ' - ' || v_note ELSE '' END ||
      ' (عمولة 2%: ' || v_fee || ' جوهرة)'),
    (_recipient_id, v_sender, _amount, 'transfer_in', 'completed',
      'تحويل مستلم' || CASE WHEN v_note <> '' THEN ' - ' || v_note ELSE '' END),
    (v_sender, v_sender, v_fee, 'transfer_fee', 'completed',
      'عمولة تحويل 2% من ' || _amount || ' جوهرة');

  PERFORM public.log_finance_event(
    v_sender, 'gem_transfer_out', 'user_gems', -v_total,
    v_sender_balance, v_new_sender_balance,
    jsonb_build_object('recipient_id', _recipient_id, 'amount', _amount, 'fee', v_fee)
  );

  PERFORM public.log_finance_event(
    _recipient_id, 'gem_transfer_in', 'user_gems', _amount,
    v_recipient_balance, v_recipient_balance + _amount,
    jsonb_build_object('sender_id', v_sender)
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_sender_balance,
    'amount', _amount,
    'fee', v_fee,
    'total_debited', v_total
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.transfer_gems_atomic(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transfer_gems_atomic(uuid, integer, text) TO authenticated;

-- Prevent authenticated clients from directly minting or changing their own
-- R Coins. Admin policies remain available; normal wallet mutations go through
-- audited SECURITY DEFINER functions.
DROP POLICY IF EXISTS "Users can update their own gems" ON public.user_gems;
DROP POLICY IF EXISTS "Users can insert their own gems" ON public.user_gems;

