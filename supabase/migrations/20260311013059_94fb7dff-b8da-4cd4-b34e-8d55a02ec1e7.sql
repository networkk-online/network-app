
-- Create storage bucket for deposit receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('deposit-receipts', 'deposit-receipts', true);

-- Allow authenticated users to upload receipts
CREATE POLICY "Users can upload deposit receipts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'deposit-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to view receipts (admins need to see them)
CREATE POLICY "Anyone can view deposit receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'deposit-receipts');

-- Allow users to delete their own receipts
CREATE POLICY "Users can delete own receipts"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'deposit-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
