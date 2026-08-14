-- Reward fabrication vector: arbitrary _user_id, callable by anon/authenticated
REVOKE ALL ON FUNCTION public.live_increment_mission(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.live_increment_mission(uuid, text, integer) TO service_role;

-- Maintenance routine, must not be user-invocable
REVOKE ALL ON FUNCTION public.expire_subscriptions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_subscriptions() TO service_role;

-- Used inside RLS policies (needs authenticated EXECUTE) — force self-scope
CREATE OR REPLACE FUNCTION public.get_user_conversation_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT conversation_id
  FROM public.conversation_participants
  WHERE user_id = COALESCE(auth.uid(), p_user_id)
    AND (auth.uid() IS NULL OR p_user_id = auth.uid());
$$;
