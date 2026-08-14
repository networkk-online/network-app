-- 1) super_admin role option (enum value only; not referenced in this migration)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- 2) Append-only admin audit log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  target_user_id uuid,
  reason text,
  ip_address text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can read audit log"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- no INSERT/UPDATE/DELETE policies: writes only through SECURITY DEFINER functions

CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON public.admin_audit_log (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target ON public.admin_audit_log (target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON public.reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON public.reports (reported_user_id, created_at DESC);

-- 3) Audit writer
CREATE OR REPLACE FUNCTION public.admin_log_action(
  _action text,
  _resource_type text DEFAULT NULL,
  _resource_id text DEFAULT NULL,
  _target_user_id uuid DEFAULT NULL,
  _reason text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  INSERT INTO public.admin_audit_log (admin_id, action, resource_type, resource_id, target_user_id, reason, metadata)
  VALUES (auth.uid(), _action, _resource_type, _resource_id, _target_user_id, _reason, COALESCE(_metadata, '{}'::jsonb))
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_log_action(text, text, text, uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_log_action(text, text, text, uuid, text, jsonb) TO authenticated;

-- 4) User status actions (suspend/ban/verify) with mandatory reason + audit
CREATE OR REPLACE FUNCTION public.admin_user_action(
  _user_id uuid,
  _action text,
  _reason text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _before jsonb; _after jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _reason IS NULL OR length(btrim(_reason)) < 3 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot_target_self';
  END IF;

  SELECT to_jsonb(p) - 'phone_number' - 'email' INTO _before FROM public.profiles p WHERE p.id = _user_id;
  IF _before IS NULL THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  IF _action = 'suspend' THEN
    UPDATE public.profiles SET is_suspended = true WHERE id = _user_id;
  ELSIF _action = 'unsuspend' THEN
    UPDATE public.profiles SET is_suspended = false WHERE id = _user_id;
  ELSIF _action = 'ban' THEN
    UPDATE public.profiles SET is_banned = true WHERE id = _user_id;
  ELSIF _action = 'unban' THEN
    UPDATE public.profiles SET is_banned = false WHERE id = _user_id;
  ELSIF _action = 'verify' THEN
    UPDATE public.profiles SET is_verified = true WHERE id = _user_id;
  ELSIF _action = 'unverify' THEN
    UPDATE public.profiles SET is_verified = false WHERE id = _user_id;
  ELSE
    RAISE EXCEPTION 'unknown_action';
  END IF;

  SELECT to_jsonb(p) - 'phone_number' - 'email' INTO _after FROM public.profiles p WHERE p.id = _user_id;

  INSERT INTO public.admin_audit_log (admin_id, action, resource_type, resource_id, target_user_id, reason, metadata)
  VALUES (auth.uid(), 'user.' || _action, 'user', _user_id::text, _user_id, _reason,
    jsonb_build_object(
      'before', jsonb_build_object('is_banned', _before->'is_banned', 'is_suspended', _before->'is_suspended', 'is_verified', _before->'is_verified'),
      'after',  jsonb_build_object('is_banned', _after->'is_banned',  'is_suspended', _after->'is_suspended',  'is_verified', _after->'is_verified')
    ));

  RETURN jsonb_build_object('ok', true, 'action', _action, 'user_id', _user_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_user_action(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_user_action(uuid, text, text) TO authenticated;

-- 5) Content moderation with mandatory reason + audit
CREATE OR REPLACE FUNCTION public.admin_moderate_content(
  _resource_type text,
  _resource_id uuid,
  _action text,
  _reason text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _owner uuid; _snapshot jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _reason IS NULL OR length(btrim(_reason)) < 3 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;
  IF _action <> 'delete' THEN
    RAISE EXCEPTION 'unknown_action';
  END IF;

  IF _resource_type = 'post' THEN
    SELECT user_id, to_jsonb(p) INTO _owner, _snapshot FROM public.posts p WHERE p.id = _resource_id;
    DELETE FROM public.posts WHERE id = _resource_id;
  ELSIF _resource_type = 'reel' THEN
    SELECT user_id, to_jsonb(r) INTO _owner, _snapshot FROM public.reels r WHERE r.id = _resource_id;
    DELETE FROM public.reels WHERE id = _resource_id;
  ELSIF _resource_type = 'story' THEN
    SELECT user_id, to_jsonb(s) INTO _owner, _snapshot FROM public.stories s WHERE s.id = _resource_id;
    DELETE FROM public.stories WHERE id = _resource_id;
  ELSIF _resource_type = 'comment' THEN
    SELECT user_id, to_jsonb(c) INTO _owner, _snapshot FROM public.comments c WHERE c.id = _resource_id;
    DELETE FROM public.comments WHERE id = _resource_id;
  ELSE
    RAISE EXCEPTION 'unknown_resource';
  END IF;

  IF _snapshot IS NULL THEN
    RAISE EXCEPTION 'resource_not_found';
  END IF;

  INSERT INTO public.admin_audit_log (admin_id, action, resource_type, resource_id, target_user_id, reason, metadata)
  VALUES (auth.uid(), 'content.' || _action, _resource_type, _resource_id::text, _owner, _reason,
          jsonb_build_object('before', _snapshot));

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_moderate_content(text, uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_moderate_content(text, uuid, text, text) TO authenticated;

-- 6) Report resolution with audit
CREATE OR REPLACE FUNCTION public.admin_resolve_report(
  _report_id uuid,
  _status text,
  _reason text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _target uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _status NOT IN ('reviewed', 'resolved', 'dismissed', 'escalated') THEN
    RAISE EXCEPTION 'unknown_status';
  END IF;

  UPDATE public.reports
     SET status = _status, reviewed_by = auth.uid(), reviewed_at = now()
   WHERE id = _report_id
   RETURNING reported_user_id INTO _target;

  IF _target IS NULL AND NOT FOUND THEN
    RAISE EXCEPTION 'report_not_found';
  END IF;

  INSERT INTO public.admin_audit_log (admin_id, action, resource_type, resource_id, target_user_id, reason, metadata)
  VALUES (auth.uid(), 'report.' || _status, 'report', _report_id::text, _target, _reason, '{}'::jsonb);

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_resolve_report(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_resolve_report(uuid, text, text) TO authenticated;