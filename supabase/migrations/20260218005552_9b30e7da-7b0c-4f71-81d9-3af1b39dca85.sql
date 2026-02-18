
-- User gems/points balance
CREATE TABLE public.user_gems (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 0,
  total_earned integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_gems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own gems" ON public.user_gems FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own gems" ON public.user_gems FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own gems" ON public.user_gems FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all gems" ON public.user_gems FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update all gems" ON public.user_gems FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Wheel spin history
CREATE TABLE public.wheel_spins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  points_won integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.wheel_spins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own spins" ON public.wheel_spins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own spins" ON public.wheel_spins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all spins" ON public.wheel_spins FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Wheel settings (admin-controlled)
CREATE TABLE public.wheel_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guaranteed_win boolean NOT NULL DEFAULT true,
  default_prize integer NOT NULL DEFAULT 10,
  spins_per_day integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.wheel_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view wheel settings" ON public.wheel_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update wheel settings" ON public.wheel_settings FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert wheel settings" ON public.wheel_settings FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.wheel_settings (guaranteed_win, default_prize, spins_per_day, is_active) VALUES (true, 10, 1, true);

-- Trigger to update gems on spin
CREATE OR REPLACE FUNCTION public.process_wheel_spin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_gems (user_id, balance, total_earned)
  VALUES (NEW.user_id, NEW.points_won, NEW.points_won)
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = user_gems.balance + NEW.points_won,
    total_earned = user_gems.total_earned + NEW.points_won,
    updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_wheel_spin
  AFTER INSERT ON public.wheel_spins
  FOR EACH ROW
  EXECUTE FUNCTION public.process_wheel_spin();
