ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS follower_count_override bigint;

CREATE OR REPLACE FUNCTION public.admin_set_follower_count_override(
  target_user_id uuid,
  new_count bigint,
  reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor uuid := auth.uid();
  _old bigint;
  _real integer;
BEGIN
  IF _actor IS NULL OR NOT public.has_role(_actor, 'super_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF reason IS NULL OR length(trim(reason)) < 3 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;

  IF new_count IS NOT NULL AND new_count < 0 THEN
    RAISE EXCEPTION 'invalid_count';
  END IF;

  SELECT follower_count_override, followers_count INTO _old, _real
  FROM public.profiles WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;

  UPDATE public.profiles
     SET follower_count_override = new_count
   WHERE id = target_user_id;

  INSERT INTO public.admin_audit_log (admin_id, action, resource_type, resource_id, target_user_id, reason, metadata)
  VALUES (
    _actor,
    CASE WHEN new_count IS NULL THEN 'follower_override_cleared' ELSE 'follower_override_set' END,
    'profile',
    target_user_id::text,
    target_user_id,
    trim(reason),
    jsonb_build_object('old_override', _old, 'new_override', new_count, 'real_followers', _real)
  );

  RETURN jsonb_build_object('success', true, 'old_override', _old, 'new_override', new_count, 'real_followers', _real);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_follower_count_override(uuid, bigint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_follower_count_override(uuid, bigint, text) TO authenticated;