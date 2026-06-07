
CREATE OR REPLACE FUNCTION public.send_tip(
  sender_id uuid,
  receiver_id uuid,
  tip_amount numeric,
  tip_message text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_balance numeric;
  new_sender_balance numeric;
BEGIN
  -- Authn: only the sender (auth.uid()) can send their own tip
  IF auth.uid() IS NULL OR auth.uid() <> sender_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  IF tip_amount IS NULL OR tip_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  IF sender_id = receiver_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_tip_self');
  END IF;

  -- Lock sender row
  SELECT balance INTO sender_balance
  FROM public.user_finances
  WHERE user_id = sender_id
  FOR UPDATE;

  IF sender_balance IS NULL OR sender_balance < tip_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_balance');
  END IF;

  -- Deduct from sender
  UPDATE public.user_finances
  SET balance = balance - tip_amount,
      updated_at = now()
  WHERE user_id = sender_id
  RETURNING balance INTO new_sender_balance;

  -- Credit receiver (create row if missing)
  INSERT INTO public.user_finances (user_id, balance, total_earnings)
  VALUES (receiver_id, tip_amount, tip_amount)
  ON CONFLICT (user_id) DO UPDATE
    SET balance = public.user_finances.balance + tip_amount,
        total_earnings = public.user_finances.total_earnings + tip_amount,
        updated_at = now();

  -- Log transactions
  INSERT INTO public.transactions (user_id, admin_id, amount, type, status, notes)
  VALUES
    (sender_id, receiver_id, tip_amount, 'tip_sent', 'completed', COALESCE(tip_message, 'إكرامية مرسلة')),
    (receiver_id, sender_id, tip_amount, 'earning', 'completed', COALESCE(tip_message, 'إكرامية مستلمة'));

  -- Notify receiver
  INSERT INTO public.notifications (user_id, actor_id, type, content)
  VALUES (receiver_id, sender_id, 'tip',
    'أرسل لك إكرامية بقيمة ' || tip_amount || ' IQD' ||
    CASE WHEN tip_message IS NOT NULL AND length(trim(tip_message))>0 THEN ' - ' || tip_message ELSE '' END);

  RETURN jsonb_build_object('success', true, 'new_balance', new_sender_balance);
END;
$$;

REVOKE ALL ON FUNCTION public.send_tip(uuid, uuid, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_tip(uuid, uuid, numeric, text) TO authenticated;

-- Ensure user_finances has unique index on user_id for ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS user_finances_user_id_unique_idx
  ON public.user_finances(user_id);
