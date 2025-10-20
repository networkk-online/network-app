-- Create user_finances table for managing user earnings and withdrawals
CREATE TABLE IF NOT EXISTS public.user_finances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0.00,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  total_withdrawn DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create transactions table for deposits and withdrawals
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_finances
CREATE POLICY "Users can view their own finances"
  ON public.user_finances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all finances"
  ON public.user_finances FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Admins can insert finances"
  ON public.user_finances FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update finances"
  ON public.user_finances FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Admins can create transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add followers_count to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;

-- Create trigger for updated_at
CREATE TRIGGER update_user_finances_updated_at
  BEFORE UPDATE ON public.user_finances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();