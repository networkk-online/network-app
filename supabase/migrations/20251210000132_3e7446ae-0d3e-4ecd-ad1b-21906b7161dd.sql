-- Create storage bucket for cover images
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for covers bucket
CREATE POLICY "Avatar images are publicly accessible covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'covers');

CREATE POLICY "Users can upload their own cover"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'covers' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own cover"
ON storage.objects FOR UPDATE
USING (bucket_id = 'covers' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own cover"
ON storage.objects FOR DELETE
USING (bucket_id = 'covers' AND auth.role() = 'authenticated');

-- Also fix user_finances RLS to allow users to insert their own records
CREATE POLICY "Users can insert their own finances"
ON public.user_finances FOR INSERT
WITH CHECK (auth.uid() = user_id);