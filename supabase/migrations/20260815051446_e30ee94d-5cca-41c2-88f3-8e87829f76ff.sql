REVOKE EXECUTE ON FUNCTION public.admin_set_follower_count_override(uuid, bigint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_follower_count_override(uuid, bigint, text) TO authenticated, service_role;
NOTIFY pgrst, 'reload schema';