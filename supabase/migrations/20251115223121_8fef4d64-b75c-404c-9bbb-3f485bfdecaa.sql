-- Create function to notify creator of new donation
CREATE OR REPLACE FUNCTION public.notify_creator_donation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  donor_username TEXT;
BEGIN
  -- Get donor username
  SELECT username INTO donor_username
  FROM public.profiles
  WHERE id = NEW.donor_user_id;
  
  -- Create notification for the creator
  INSERT INTO public.notifications (
    user_id,
    actor_id,
    type,
    content,
    is_read
  ) VALUES (
    NEW.creator_user_id,
    NEW.donor_user_id,
    'donation',
    jsonb_build_object(
      'donation_id', NEW.id,
      'amount', NEW.amount,
      'creator_earning', NEW.creator_earning,
      'message', NEW.message,
      'donor_username', COALESCE(donor_username, 'Anonymous'),
      'broadcast_id', NEW.broadcast_id
    )::text,
    false
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for donation notifications
DROP TRIGGER IF EXISTS on_donation_notify_creator ON public.broadcast_donations;
CREATE TRIGGER on_donation_notify_creator
  AFTER INSERT ON public.broadcast_donations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_creator_donation();

-- Create table for donation replies (thank you messages)
CREATE TABLE IF NOT EXISTS public.donation_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES public.broadcast_donations(id) ON DELETE CASCADE,
  creator_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  donor_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reply_message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.donation_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for donation replies
CREATE POLICY "Creators can send replies to their donations"
  ON public.donation_replies
  FOR INSERT
  WITH CHECK (auth.uid() = creator_user_id);

CREATE POLICY "Donors can view replies to their donations"
  ON public.donation_replies
  FOR SELECT
  USING (auth.uid() = donor_user_id OR auth.uid() = creator_user_id);

-- Add index for performance
CREATE INDEX idx_donation_replies_donation ON public.donation_replies(donation_id);
CREATE INDEX idx_donation_replies_donor ON public.donation_replies(donor_user_id);