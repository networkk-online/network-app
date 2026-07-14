
-- RPC: business owner sets or clears a user's affiliation to their own company
CREATE OR REPLACE FUNCTION public.owner_set_affiliate(_username text, _company_id uuid, _attach boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_target uuid;
  v_current uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthenticated');
  END IF;

  SELECT owner_id INTO v_owner FROM public.companies WHERE id = _company_id;
  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'company_not_found');
  END IF;
  IF v_owner <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_company_owner');
  END IF;

  SELECT id, affiliated_company_id INTO v_target, v_current
    FROM public.profiles
    WHERE lower(username) = lower(trim(_username))
    LIMIT 1;

  IF v_target IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;

  IF _attach THEN
    UPDATE public.profiles SET affiliated_company_id = _company_id WHERE id = v_target;
    RETURN jsonb_build_object('success', true, 'user_id', v_target, 'attached', true);
  ELSE
    -- only clear if currently attached to this company
    IF v_current IS DISTINCT FROM _company_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'not_affiliated_with_this_company');
    END IF;
    UPDATE public.profiles SET affiliated_company_id = NULL WHERE id = v_target;
    RETURN jsonb_build_object('success', true, 'user_id', v_target, 'attached', false);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.owner_set_affiliate(text, uuid, boolean) TO authenticated;

-- RPC: list affiliates of a company (owner only)
CREATE OR REPLACE FUNCTION public.owner_list_affiliates(_company_id uuid)
RETURNS TABLE(id uuid, username text, full_name text, avatar_url text, is_verified boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.id = _company_id AND c.owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'not_company_owner';
  END IF;

  RETURN QUERY
    SELECT p.id, p.username, p.full_name, p.avatar_url, p.is_verified
    FROM public.profiles p
    WHERE p.affiliated_company_id = _company_id
    ORDER BY p.username NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.owner_list_affiliates(uuid) TO authenticated;
