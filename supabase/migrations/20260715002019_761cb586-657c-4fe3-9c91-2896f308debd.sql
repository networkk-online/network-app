
-- 1) Prevent privilege escalation: block non-admins from editing sensitive columns
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.is_verified        IS DISTINCT FROM OLD.is_verified
  OR NEW.verification_type  IS DISTINCT FROM OLD.verification_type
  OR NEW.is_banned          IS DISTINCT FROM OLD.is_banned
  OR NEW.is_suspended       IS DISTINCT FROM OLD.is_suspended
  OR NEW.account_type       IS DISTINCT FROM OLD.account_type
  OR NEW.fame_score         IS DISTINCT FROM OLD.fame_score
  OR NEW.affiliated_company_id IS DISTINCT FROM OLD.affiliated_company_id
  THEN
    RAISE EXCEPTION 'Not authorized to modify privileged profile fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_privileged_updates ON public.profiles;
CREATE TRIGGER trg_guard_profile_privileged_updates
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_updates();

-- 2) Admin-only RPC to list users with email + role for the Vault Users Directory
CREATE OR REPLACE FUNCTION public.admin_list_users(
  _search text DEFAULT NULL,
  _limit int DEFAULT 20,
  _offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  username text,
  full_name text,
  avatar_url text,
  phone_number text,
  email text,
  account_type text,
  is_verified boolean,
  verification_type text,
  is_banned boolean,
  is_suspended boolean,
  role text,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
  WITH filtered AS (
    SELECT p.*, u.email::text AS user_email
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE _search IS NULL OR _search = '' OR (
      p.username ILIKE '%' || _search || '%'
      OR p.full_name ILIKE '%' || _search || '%'
      OR p.phone_number ILIKE '%' || _search || '%'
      OR u.email ILIKE '%' || _search || '%'
    )
  ), counted AS (
    SELECT count(*) AS c FROM filtered
  )
  SELECT
    f.id, f.username, f.full_name, f.avatar_url, f.phone_number,
    f.user_email,
    f.account_type::text,
    f.is_verified, f.verification_type::text,
    f.is_banned, f.is_suspended,
    (SELECT r.role::text FROM public.user_roles r
       WHERE r.user_id = f.id
       ORDER BY CASE r.role WHEN 'admin' THEN 1 WHEN 'moderator' THEN 2 ELSE 3 END
       LIMIT 1) AS role,
    f.created_at,
    (SELECT c FROM counted) AS total_count
  FROM filtered f
  ORDER BY f.created_at DESC
  LIMIT _limit OFFSET _offset;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users(text, int, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users(text, int, int) TO authenticated;
