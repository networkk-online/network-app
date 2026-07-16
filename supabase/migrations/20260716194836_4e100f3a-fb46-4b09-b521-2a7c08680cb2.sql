-- Allow system-computed profile fields (fame_score, followers_count, following_count)
-- to be updated by triggers even when the calling user is not an admin.
-- The follow/unfollow flow triggers fame_score recomputation on the OTHER user's profile,
-- which was being blocked by the privilege guard, breaking all follow actions.

CREATE OR REPLACE FUNCTION public.guard_profile_privileged_updates()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Note: fame_score, followers_count, following_count are intentionally NOT guarded
  -- because they are maintained by SECURITY DEFINER triggers on follow/like/post events.
  IF NEW.is_verified        IS DISTINCT FROM OLD.is_verified
  OR NEW.verification_type  IS DISTINCT FROM OLD.verification_type
  OR NEW.is_banned          IS DISTINCT FROM OLD.is_banned
  OR NEW.is_suspended       IS DISTINCT FROM OLD.is_suspended
  OR NEW.account_type       IS DISTINCT FROM OLD.account_type
  OR NEW.affiliated_company_id IS DISTINCT FROM OLD.affiliated_company_id
  THEN
    RAISE EXCEPTION 'Not authorized to modify privileged profile fields';
  END IF;

  RETURN NEW;
END;
$function$;