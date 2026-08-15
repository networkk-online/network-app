-- 1) Payment gateways: public sees only ACTIVE gateways (display-only columns exist; no secrets stored)
DROP POLICY IF EXISTS "Anyone can view active gateways" ON public.payment_gateways;
CREATE POLICY "Public can view active gateways"
ON public.payment_gateways FOR SELECT
TO anon, authenticated
USING (is_active = true);

REVOKE ALL ON public.payment_gateways FROM anon, authenticated;
GRANT SELECT (id, key, name_en, name_ar, icon, is_active, min_amount, max_amount, bonus_percent, instructions_ar, instructions_en, sort_order, barcode_image_url, created_at, updated_at) ON public.payment_gateways TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.payment_gateways TO authenticated;
GRANT ALL ON public.payment_gateways TO service_role;

-- 2) Fix mutable search_path
ALTER FUNCTION public._compute_vip_tier(numeric) SET search_path = public;

-- 3) Revoke anon EXECUTE on SECURITY DEFINER functions that require an authenticated caller
DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.guard_short_username()',
    'public.guard_profile_privileged_updates()',
    'public.audit_wallet_change()',
    'public.has_role(uuid, public.app_role)',
    'public.send_live_gift(uuid, text, integer)',
    'public.live_tap_like(uuid, integer)',
    'public.live_ban_user(uuid, uuid, text)',
    'public.live_unban_user(uuid, uuid)',
    'public.live_grant_moderator(uuid, uuid)',
    'public.live_revoke_moderator(uuid, uuid)',
    'public.live_request_guest_seat(uuid)',
    'public.live_toggle_mute_guest(uuid, integer)',
    'public.live_approve_guest(uuid, integer)',
    'public.live_kick_guest(uuid, integer)',
    'public.owner_list_affiliates(uuid)',
    'public.owner_set_affiliate(text, uuid, boolean)',
    'public.owner_invite_affiliate(text, uuid)',
    'public.owner_list_pending_invites(uuid)',
    'public.owner_cancel_invite(uuid)',
    'public.user_list_my_invites()',
    'public.user_respond_affiliation(uuid, boolean)'
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', f);
  END LOOP;
END $$;

-- keep read-only supporter list available to logged-out viewers of public streams
GRANT EXECUTE ON FUNCTION public.live_top_supporters(uuid, integer) TO anon;

NOTIFY pgrst, 'reload schema';