
-- Create post_tips table for micro-payments
CREATE TABLE public.post_tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tipper_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  creator_earning NUMERIC NOT NULL DEFAULT 0,
  platform_fee NUMERIC NOT NULL DEFAULT 0,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add tipping_enabled toggle on posts (default true)
ALTER TABLE public.posts ADD COLUMN tipping_enabled BOOLEAN DEFAULT true;

-- Enable RLS
ALTER TABLE public.post_tips ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view tips on their posts" ON public.post_tips
  FOR SELECT USING (auth.uid() = creator_id OR auth.uid() = tipper_id);

CREATE POLICY "Authenticated users can tip" ON public.post_tips
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = tipper_id);

-- Trigger to process tip earnings (80/20 split)
CREATE OR REPLACE FUNCTION public.process_post_tip()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  NEW.platform_fee := NEW.amount * 0.20;
  NEW.creator_earning := NEW.amount * 0.80;

  -- Update creator finances
  INSERT INTO public.user_finances (user_id, balance, total_earnings)
  VALUES (NEW.creator_id, NEW.creator_earning, NEW.creator_earning)
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = user_finances.balance + NEW.creator_earning,
    total_earnings = user_finances.total_earnings + NEW.creator_earning,
    updated_at = now();

  -- Transaction record
  INSERT INTO public.transactions (user_id, admin_id, amount, type, status, notes)
  VALUES (NEW.creator_id, NEW.tipper_id, NEW.creator_earning, 'earning', 'completed',
    'إكرامية على منشور - المبلغ: ' || NEW.amount || ' (بعد خصم 20%)');

  -- Notification
  INSERT INTO public.notifications (user_id, actor_id, type, post_id, content)
  VALUES (NEW.creator_id, NEW.tipper_id, 'tip', NEW.post_id,
    'أرسل لك إكرامية بقيمة ' || NEW.amount);

  RETURN NEW;
END;
$$;

CREATE TRIGGER process_post_tip_trigger
  BEFORE INSERT ON public.post_tips
  FOR EACH ROW EXECUTE FUNCTION public.process_post_tip();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_tips;
