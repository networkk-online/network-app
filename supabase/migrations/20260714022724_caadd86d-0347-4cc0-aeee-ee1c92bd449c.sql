REVOKE ALL ON FUNCTION public.refresh_profile_live_status(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_profile_live_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_profile_live_room_status() FROM PUBLIC, anon, authenticated;