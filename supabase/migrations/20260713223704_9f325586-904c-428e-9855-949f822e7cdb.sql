
-- 1) Verification request columns
ALTER TABLE public.verification_requests
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS id_document_url text,
  ADD COLUMN IF NOT EXISTS business_document_url text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'personal';

-- 2) Storage: verification-documents (private)
--   users upload to their own folder <uid>/...
CREATE POLICY "verif_docs_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "verif_docs_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'verification-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "verif_docs_admin_all" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'verification-documents' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'verification-documents' AND public.has_role(auth.uid(), 'admin'));

-- 3) Storage: allow admins full manage on covers/payment-gateways/*
CREATE POLICY "covers_admin_payment_gateways_all" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = 'payment-gateways' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'covers' AND (storage.foldername(name))[1] = 'payment-gateways' AND public.has_role(auth.uid(), 'admin'));
