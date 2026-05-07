DROP VIEW IF EXISTS public.broadcast_donations_public;
CREATE VIEW public.broadcast_donations_public
WITH (security_invoker = true) AS
SELECT id, broadcast_id, donor_user_id, creator_user_id, amount, message, created_at
FROM public.broadcast_donations;
GRANT SELECT ON public.broadcast_donations_public TO anon, authenticated;