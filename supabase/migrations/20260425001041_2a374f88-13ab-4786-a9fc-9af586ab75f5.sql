-- Insert bot auth user (with random password, no real login)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000b07',
  'authenticated',
  'authenticated',
  'bot@networkk.system',
  crypt(gen_random_uuid()::text, gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"system","providers":["system"]}'::jsonb,
  '{"username":"networkk_assistant","full_name":"NETWORKK Assistant"}'::jsonb,
  false
) ON CONFLICT (id) DO NOTHING;

-- Profile (the handle_new_user trigger may or may not fire; do upsert)
INSERT INTO public.profiles (id, username, full_name, bio, is_verified, verification_type)
VALUES (
  '00000000-0000-0000-0000-000000000b07'::uuid,
  'networkk_assistant',
  'NETWORKK Assistant',
  '🤖 المساعد الذكي الرسمي لمنصة NETWORKK | Official AI Assistant • Encrypted Transactions • 24/7 Support',
  true,
  'government'
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  bio = EXCLUDED.bio,
  is_verified = true,
  verification_type = 'government',
  updated_at = now();

-- Bot config
INSERT INTO public.bot_config (key, value) VALUES 
  ('bot_user_id', '"00000000-0000-0000-0000-000000000b07"'::jsonb),
  ('ceo_user_id', '"00000000-0000-0000-0000-000000000b07"'::jsonb),
  ('ai_model', '"google/gemini-3-flash-preview"'::jsonb),
  ('high_value_threshold_usd', '500'::jsonb)
ON CONFLICT (key) DO NOTHING;