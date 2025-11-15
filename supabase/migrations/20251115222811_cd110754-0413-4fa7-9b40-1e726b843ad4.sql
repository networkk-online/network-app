-- Create broadcast donations table
CREATE TABLE IF NOT EXISTS public.broadcast_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id TEXT NOT NULL,
  donor_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  platform_fee NUMERIC NOT NULL DEFAULT 0,
  creator_earning NUMERIC NOT NULL DEFAULT 0,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.broadcast_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view donations"
  ON public.broadcast_donations
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can send donations"
  ON public.broadcast_donations
  FOR INSERT
  WITH CHECK (auth.uid() = donor_user_id);

-- Create function to process donation and update finances
CREATE OR REPLACE FUNCTION public.process_broadcast_donation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  platform_commission NUMERIC;
  creator_amount NUMERIC;
BEGIN
  -- Calculate platform fee (20%) and creator earning (80%)
  platform_commission := NEW.amount * 0.20;
  creator_amount := NEW.amount * 0.80;
  
  -- Update the donation record with calculated amounts
  NEW.platform_fee := platform_commission;
  NEW.creator_earning := creator_amount;
  
  -- Update creator's finances
  INSERT INTO public.user_finances (user_id, balance, total_earnings)
  VALUES (NEW.creator_user_id, creator_amount, creator_amount)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = user_finances.balance + creator_amount,
    total_earnings = user_finances.total_earnings + creator_amount,
    updated_at = now();
  
  -- Create transaction record for creator
  INSERT INTO public.transactions (
    user_id,
    admin_id,
    amount,
    type,
    status,
    notes
  ) VALUES (
    NEW.creator_user_id,
    NEW.donor_user_id,
    creator_amount,
    'earning',
    'completed',
    'دعم من بث مباشر - المبلغ الأصلي: ' || NEW.amount || ' (بعد خصم 20%)'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_broadcast_donation
  BEFORE INSERT ON public.broadcast_donations
  FOR EACH ROW
  EXECUTE FUNCTION public.process_broadcast_donation();

-- Add index for performance
CREATE INDEX idx_broadcast_donations_creator ON public.broadcast_donations(creator_user_id);
CREATE INDEX idx_broadcast_donations_donor ON public.broadcast_donations(donor_user_id);
CREATE INDEX idx_broadcast_donations_created_at ON public.broadcast_donations(created_at DESC);