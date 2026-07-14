
-- Invitation flow for affiliations
CREATE OR REPLACE FUNCTION public.owner_invite_affiliate(_username text, _company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target uuid;
  v_current uuid;
  v_existing uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = _company_id AND owner_id = auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_company_owner');
  END IF;

  SELECT id, affiliated_company_id INTO v_target, v_current
  FROM public.profiles WHERE lower(username) = lower(trim(_username)) LIMIT 1;

  IF v_target IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;
  IF v_current = _company_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_affiliated');
  END IF;

  SELECT id INTO v_existing FROM public.company_affiliation_requests
    WHERE company_id = _company_id AND user_id = v_target AND status = 'pending' LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_invited');
  END IF;

  INSERT INTO public.company_affiliation_requests (user_id, company_id, status)
  VALUES (v_target, _company_id, 'pending');

  INSERT INTO public.notifications (user_id, actor_id, type, content)
  VALUES (v_target, auth.uid(), 'affiliation_invite',
    'دعاك للانضمام كحساب تابع لشركة');

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.owner_list_pending_invites(_company_id uuid)
RETURNS TABLE(request_id uuid, user_id uuid, username text, full_name text, avatar_url text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = _company_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'not_company_owner';
  END IF;
  RETURN QUERY
    SELECT r.id, p.id, p.username, p.full_name, p.avatar_url, r.created_at
    FROM public.company_affiliation_requests r
    JOIN public.profiles p ON p.id = r.user_id
    WHERE r.company_id = _company_id AND r.status = 'pending'
    ORDER BY r.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.owner_cancel_invite(_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'unauthenticated'); END IF;
  SELECT company_id INTO v_company FROM public.company_affiliation_requests WHERE id = _request_id AND status = 'pending';
  IF v_company IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_found'); END IF;
  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = v_company AND owner_id = auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_company_owner');
  END IF;
  DELETE FROM public.company_affiliation_requests WHERE id = _request_id;
  RETURN jsonb_build_object('success', true);
END; $$;

CREATE OR REPLACE FUNCTION public.user_list_my_invites()
RETURNS TABLE(request_id uuid, company_id uuid, company_name text, company_logo text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  RETURN QUERY
    SELECT r.id, c.id, c.name, c.logo_url, r.created_at
    FROM public.company_affiliation_requests r
    JOIN public.companies c ON c.id = r.company_id
    WHERE r.user_id = auth.uid() AND r.status = 'pending'
    ORDER BY r.created_at DESC;
END; $$;

CREATE OR REPLACE FUNCTION public.user_respond_affiliation(_request_id uuid, _accept boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company uuid; v_owner uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'unauthenticated'); END IF;
  SELECT company_id INTO v_company FROM public.company_affiliation_requests
    WHERE id = _request_id AND user_id = auth.uid() AND status = 'pending';
  IF v_company IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_found'); END IF;

  IF _accept THEN
    UPDATE public.profiles SET affiliated_company_id = v_company WHERE id = auth.uid();
    UPDATE public.company_affiliation_requests SET status = 'accepted', reviewed_at = now() WHERE id = _request_id;
  ELSE
    UPDATE public.company_affiliation_requests SET status = 'rejected', reviewed_at = now() WHERE id = _request_id;
  END IF;

  SELECT owner_id INTO v_owner FROM public.companies WHERE id = v_company;
  IF v_owner IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, actor_id, type, content)
    VALUES (v_owner, auth.uid(), 'affiliation_response',
      CASE WHEN _accept THEN 'قبل دعوة الانضمام كحساب تابع' ELSE 'رفض دعوة الانضمام كحساب تابع' END);
  END IF;

  RETURN jsonb_build_object('success', true, 'accepted', _accept);
END; $$;

GRANT EXECUTE ON FUNCTION public.owner_invite_affiliate(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_list_pending_invites(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_cancel_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_list_my_invites() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_respond_affiliation(uuid, boolean) TO authenticated;
