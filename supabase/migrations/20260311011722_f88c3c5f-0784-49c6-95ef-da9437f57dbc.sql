
-- Create deposits table for manual deposit requests
CREATE TABLE public.deposits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  receipt_url text,
  status text NOT NULL DEFAULT 'pending',
  reject_reason text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- Users can create their own deposits
CREATE POLICY "Users can create deposits" ON public.deposits
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own deposits
CREATE POLICY "Users can view own deposits" ON public.deposits
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all deposits
CREATE POLICY "Admins can view all deposits" ON public.deposits
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update deposits (approve/reject)
CREATE POLICY "Admins can update deposits" ON public.deposits
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for financial notifications on transactions
CREATE OR REPLACE FUNCTION public.notify_financial_transaction()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  tx_title text;
  tx_message text;
BEGIN
  -- Build notification message based on type
  CASE NEW.type
    WHEN 'earning' THEN
      tx_title := 'إيداع جديد';
      tx_message := 'تم إضافة ' || NEW.amount || ' إلى رصيدك';
    WHEN 'topup' THEN
      tx_title := 'شحن رصيد';
      tx_message := 'تم شحن ' || NEW.amount || ' إلى محفظتك';
    WHEN 'withdrawal' THEN
      tx_title := 'سحب أرباح';
      tx_message := 'تم سحب ' || NEW.amount || ' من رصيدك';
    ELSE
      tx_title := 'عملية مالية';
      tx_message := 'تم تنفيذ عملية بقيمة ' || NEW.amount;
  END CASE;

  INSERT INTO public.notifications (user_id, actor_id, type, content)
  VALUES (NEW.user_id, NEW.user_id, 'transaction', tx_message);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_transaction_notify
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_financial_transaction();

-- Enable realtime for deposits
ALTER PUBLICATION supabase_realtime ADD TABLE public.deposits;
