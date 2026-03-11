
-- Companies table
CREATE TABLE public.companies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  logo_url text,
  owner_id uuid NOT NULL,
  description text,
  website text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Anyone can view companies
CREATE POLICY "Anyone can view companies" ON public.companies
  FOR SELECT USING (true);

-- Admins can manage companies
CREATE POLICY "Admins can manage companies" ON public.companies
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can create companies
CREATE POLICY "Users can create companies" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Add affiliated_company_id to profiles
ALTER TABLE public.profiles ADD COLUMN affiliated_company_id uuid REFERENCES public.companies(id);

-- Company affiliation requests
CREATE TABLE public.company_affiliation_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  UNIQUE(user_id, company_id)
);

ALTER TABLE public.company_affiliation_requests ENABLE ROW LEVEL SECURITY;

-- Users can create requests
CREATE POLICY "Users can create affiliation requests" ON public.company_affiliation_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view own requests" ON public.company_affiliation_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Company owners can view requests for their companies
CREATE POLICY "Company owners can view requests" ON public.company_affiliation_requests
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid()));

-- Company owners can update requests
CREATE POLICY "Company owners can update requests" ON public.company_affiliation_requests
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid()));

-- Admins can manage all requests
CREATE POLICY "Admins can manage requests" ON public.company_affiliation_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
