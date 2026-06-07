CREATE OR REPLACE FUNCTION public.send_tip_v2(
  sender_id uuid,
  receiver_id uuid,
  tip_amount numeric,
  currency_type text DEFAULT 'gems',
  tip_message text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  sender_balance numeric;
  new_sender_balance numeric;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> sender_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  IF tip_amount IS NULL OR tip_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  IF sender_id = receiver_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_tip_self');
  END IF;

  IF currency_type NOT IN ('gems', 'cash') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_currency');
  END IF;

  IF currency_type = 'gems' THEN
    SELECT balance INTO sender_balance FROM public.user_gems WHERE user_id = sender_id FOR UPDATE;

    IF sender_balance IS NULL OR sender_balance < tip_amount THEN
      RETURN jsonb_build_object('success', false, 'error', 'insufficient_gems');
    END IF;

    UPDATE public.user_gems
      SET balance = balance - tip_amount, updated_at = now()
      WHERE user_id = sender_id
      RETURNING balance INTO new_sender_balance;

    INSERT INTO public.user_gems (user_id, balance, total_earned)
      VALUES (receiver_id, tip_amount, tip_amount)
      ON CONFLICT (user_id) DO UPDATE
        SET balance = public.user_gems.balance + tip_amount,
            total_earned = public.user_gems.total_earned + tip_amount,
            updated_at = now();

    INSERT INTO public.notifications (user_id, actor_id, type, content)
    VALUES (receiver_id, sender_id, 'tip',
      'أرسل لك إكرامية بقيمة ' || tip_amount || ' 💎' ||
      CASE WHEN tip_message IS NOT NULL AND length(trim(tip_message))>0 THEN ' - ' || tip_message ELSE '' END);

    RETURN jsonb_build_object('success', true, 'new_balance', new_sender_balance, 'currency', 'gems');
  ELSE
    SELECT balance INTO sender_balance FROM public.user_finances WHERE user_id = sender_id FOR UPDATE;

    IF sender_balance IS NULL OR sender_balance < tip_amount THEN
      RETURN jsonb_build_object('success', false, 'error', 'insufficient_cash');
    END IF;

    UPDATE public.user_finances
      SET balance = balance - tip_amount, updated_at = now()
      WHERE user_id = sender_id
      RETURNING balance INTO new_sender_balance;

    INSERT INTO public.user_finances (user_id, balance, total_earnings)
      VALUES (receiver_id, tip_amount, tip_amount)
      ON CONFLICT (user_id) DO UPDATE
        SET balance = public.user_finances.balance + tip_amount,
            total_earnings = public.user_finances.total_earnings + tip_amount,
            updated_at = now();

    INSERT INTO public.transactions (user_id, admin_id, amount, type, status, notes)
    VALUES
      (sender_id, receiver_id, tip_amount, 'tip_sent', 'completed', COALESCE(tip_message, 'إكرامية مرسلة')),
      (receiver_id, sender_id, tip_amount, 'earning', 'completed', COALESCE(tip_message, 'إكرامية مستلمة'));

    INSERT INTO public.notifications (user_id, actor_id, type, content)
    VALUES (receiver_id, sender_id, 'tip',
      'أرسل لك إكرامية بقيمة ' || tip_amount || ' IQD' ||
      CASE WHEN tip_message IS NOT NULL AND length(trim(tip_message))>0 THEN ' - ' || tip_message ELSE '' END);

    RETURN jsonb_build_object('success', true, 'new_balance', new_sender_balance, 'currency', 'cash');
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.send_tip_v2(uuid, uuid, numeric, text, text) TO authenticated;