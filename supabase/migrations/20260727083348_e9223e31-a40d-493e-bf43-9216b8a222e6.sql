
-- ═══════════════════════════════════════════════════════════════════════
-- VIP tier recompute helper
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public._compute_vip_tier(_spend numeric)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN _spend >= 1000000 THEN 'legend'
    WHEN _spend >= 500000  THEN 'royal'
    WHEN _spend >= 200000  THEN 'diamond'
    WHEN _spend >= 75000   THEN 'platinum'
    WHEN _spend >= 25000   THEN 'gold'
    WHEN _spend >= 7500    THEN 'silver'
    WHEN _spend >= 1500    THEN 'bronze'
    ELSE 'none'
  END;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- Mission progress helper (uses INSERT ... ON CONFLICT for upsert)
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.live_increment_mission(
  _user_id uuid, _requirement_type text, _amount integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT id, requirement_target FROM public.live_missions
    WHERE is_active AND requirement_type = _requirement_type
  LOOP
    INSERT INTO public.live_mission_progress (user_id, mission_id, progress)
    VALUES (_user_id, r.id, _amount)
    ON CONFLICT (user_id, mission_id) DO UPDATE
      SET progress = LEAST(public.live_mission_progress.progress + _amount, r.requirement_target),
          completed_at = CASE
            WHEN public.live_mission_progress.progress + _amount >= r.requirement_target
              AND public.live_mission_progress.completed_at IS NULL
            THEN now() ELSE public.live_mission_progress.completed_at END,
          updated_at = now();
  END LOOP;
END;
$$;
GRANT EXECUTE ON FUNCTION public.live_increment_mission(uuid, text, integer) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- Atomic gift send — the beating heart of the live economy
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.send_live_gift(
  _stream_id uuid,
  _gift_id text,
  _quantity integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_sender uuid := auth.uid();
  v_host uuid;
  v_channel text;
  v_gift record;
  v_total numeric;
  v_balance numeric;
  v_new_balance numeric;
  v_new_spend numeric;
  v_new_tier text;
BEGIN
  IF v_sender IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthenticated');
  END IF;
  IF _quantity IS NULL OR _quantity <= 0 OR _quantity > 999 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_quantity');
  END IF;

  SELECT host_id, channel_name INTO v_host, v_channel
    FROM public.live_streams WHERE id = _stream_id AND status = 'live';
  IF v_host IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'stream_not_live');
  END IF;
  IF v_host = v_sender THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_gift_self');
  END IF;

  -- Refuse if sender is banned from this stream
  IF EXISTS (SELECT 1 FROM public.live_bans WHERE stream_id = _stream_id AND user_id = v_sender) THEN
    RETURN jsonb_build_object('success', false, 'error', 'banned');
  END IF;

  SELECT id, name, name_ar, emoji, price_coins, tier
    INTO v_gift FROM public.live_gift_catalog
    WHERE id = _gift_id AND is_active = true;
  IF v_gift.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'gift_not_found');
  END IF;

  v_total := v_gift.price_coins::numeric * _quantity;

  -- Lock and check sender gem balance
  SELECT balance INTO v_balance FROM public.user_gems WHERE user_id = v_sender FOR UPDATE;
  IF v_balance IS NULL OR v_balance < v_total THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_coins',
      'balance', COALESCE(v_balance, 0), 'required', v_total);
  END IF;

  UPDATE public.user_gems
    SET balance = balance - v_total, updated_at = now()
    WHERE user_id = v_sender
    RETURNING balance INTO v_new_balance;

  -- Ledger insert (existing trigger process_gift_credit will credit host's IQD earnings)
  INSERT INTO public.gift_ledger (
    sender_id, creator_id, channel_name, stream_id,
    gift_id, gift_name, quantity, unit_price, total_price, status
  ) VALUES (
    v_sender, v_host, v_channel, _stream_id,
    v_gift.id, COALESCE(v_gift.name_ar, v_gift.name),
    _quantity, v_gift.price_coins, v_total, 'confirmed'
  );

  -- Super gift log for animation feed (tier is premium/super/legendary)
  IF v_gift.tier IN ('super','legendary') THEN
    INSERT INTO public.live_super_gift_events (stream_id, host_id, sender_id, gift_id, quantity, vip_level)
    VALUES (_stream_id, v_host, v_sender, v_gift.id, _quantity, NULL);
  END IF;

  -- Live goals: bump matching goals
  UPDATE public.live_goals
    SET current_count = LEAST(current_count + _quantity, target_count),
        is_completed = (current_count + _quantity) >= target_count,
        updated_at = now()
    WHERE stream_id = _stream_id
      AND (target_gift_id IS NULL OR target_gift_id = v_gift.id)
      AND NOT is_completed;

  -- Missions
  PERFORM public.live_increment_mission(v_sender, 'send_gift', _quantity);
  PERFORM public.live_increment_mission(v_sender, 'spend_coins', v_total::integer);
  PERFORM public.live_increment_mission(v_host, 'receive_gift', _quantity);

  -- VIP tier recompute for sender
  INSERT INTO public.live_vip_levels (user_id, lifetime_spend, tier)
  VALUES (v_sender, v_total, public._compute_vip_tier(v_total))
  ON CONFLICT (user_id) DO UPDATE
    SET lifetime_spend = public.live_vip_levels.lifetime_spend + v_total,
        tier = public._compute_vip_tier(public.live_vip_levels.lifetime_spend + v_total),
        updated_at = now()
  RETURNING lifetime_spend, tier INTO v_new_spend, v_new_tier;

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'total_cost', v_total,
    'gift_id', v_gift.id,
    'gift_name', COALESCE(v_gift.name_ar, v_gift.name),
    'tier', v_gift.tier,
    'emoji', v_gift.emoji,
    'vip_tier', v_new_tier,
    'lifetime_spend', v_new_spend
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.send_live_gift(uuid, text, integer) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- Host tap-a-like counter → also feeds missions
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.live_tap_like(_stream_id uuid, _amount integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_host uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  IF _amount IS NULL OR _amount <= 0 OR _amount > 50 THEN RETURN; END IF;
  SELECT host_id INTO v_host FROM public.live_streams WHERE id = _stream_id AND status = 'live';
  IF v_host IS NULL THEN RETURN; END IF;
  PERFORM public.live_increment_mission(auth.uid(), 'send_like', _amount);
  PERFORM public.live_increment_mission(v_host, 'receive_like', _amount);
END;
$$;
GRANT EXECUTE ON FUNCTION public.live_tap_like(uuid, integer) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- Moderation: ban / unban / grant / revoke
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.live_ban_user(_stream_id uuid, _user_id uuid, _reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_host uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'unauthenticated'); END IF;
  SELECT host_id INTO v_host FROM public.live_streams WHERE id = _stream_id;
  IF v_host IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'stream_not_found'); END IF;
  IF v_host <> auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.live_moderators WHERE stream_id = _stream_id AND user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authorized');
  END IF;
  INSERT INTO public.live_bans (stream_id, host_id, user_id, banned_by, reason)
    VALUES (_stream_id, v_host, _user_id, auth.uid(), _reason)
    ON CONFLICT (stream_id, user_id) DO NOTHING;
  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.live_ban_user(uuid, uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.live_unban_user(_stream_id uuid, _user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_host uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'unauthenticated'); END IF;
  SELECT host_id INTO v_host FROM public.live_streams WHERE id = _stream_id;
  IF v_host IS NULL OR (v_host <> auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.live_moderators WHERE stream_id = _stream_id AND user_id = auth.uid()
  )) THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authorized');
  END IF;
  DELETE FROM public.live_bans WHERE stream_id = _stream_id AND user_id = _user_id;
  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.live_unban_user(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.live_grant_moderator(_stream_id uuid, _user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_host uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'unauthenticated'); END IF;
  SELECT host_id INTO v_host FROM public.live_streams WHERE id = _stream_id;
  IF v_host IS NULL OR v_host <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authorized');
  END IF;
  INSERT INTO public.live_moderators (stream_id, host_id, user_id, granted_by)
    VALUES (_stream_id, v_host, _user_id, auth.uid())
    ON CONFLICT (stream_id, user_id) DO NOTHING;
  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.live_grant_moderator(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.live_revoke_moderator(_stream_id uuid, _user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_host uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'unauthenticated'); END IF;
  SELECT host_id INTO v_host FROM public.live_streams WHERE id = _stream_id;
  IF v_host IS NULL OR v_host <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authorized');
  END IF;
  DELETE FROM public.live_moderators WHERE stream_id = _stream_id AND user_id = _user_id;
  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.live_revoke_moderator(uuid, uuid) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- Guest seats: request, approve, kick, mute
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.live_request_guest_seat(_stream_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_host uuid; v_slot integer;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'unauthenticated'); END IF;
  IF EXISTS (SELECT 1 FROM public.live_bans WHERE stream_id = _stream_id AND user_id = auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'banned');
  END IF;
  SELECT host_id INTO v_host FROM public.live_streams WHERE id = _stream_id AND status = 'live';
  IF v_host IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'stream_not_live'); END IF;

  -- Find first free slot 1..8 (0 is host)
  SELECT slot_index INTO v_slot FROM public.live_guest_slots
    WHERE stream_id = _stream_id AND status = 'empty' AND slot_index BETWEEN 1 AND 8
    ORDER BY slot_index LIMIT 1;
  IF v_slot IS NULL THEN
    -- Create a new slot if none exists yet
    SELECT COALESCE(MAX(slot_index),0)+1 INTO v_slot FROM public.live_guest_slots WHERE stream_id = _stream_id;
    IF v_slot > 8 THEN RETURN jsonb_build_object('success', false, 'error', 'no_slots'); END IF;
    INSERT INTO public.live_guest_slots (stream_id, host_id, slot_index, guest_user_id, status, requested_at)
      VALUES (_stream_id, v_host, v_slot, auth.uid(), 'requested', now());
  ELSE
    UPDATE public.live_guest_slots SET guest_user_id = auth.uid(), status = 'requested', requested_at = now(), updated_at = now()
      WHERE stream_id = _stream_id AND slot_index = v_slot;
  END IF;
  RETURN jsonb_build_object('success', true, 'slot_index', v_slot);
END;
$$;
GRANT EXECUTE ON FUNCTION public.live_request_guest_seat(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.live_approve_guest(_stream_id uuid, _slot_index integer)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_host uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'unauthenticated'); END IF;
  SELECT host_id INTO v_host FROM public.live_streams WHERE id = _stream_id;
  IF v_host IS NULL OR v_host <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authorized');
  END IF;
  UPDATE public.live_guest_slots
    SET status = 'accepted', joined_at = now(), updated_at = now()
    WHERE stream_id = _stream_id AND slot_index = _slot_index AND status = 'requested';
  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.live_approve_guest(uuid, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.live_kick_guest(_stream_id uuid, _slot_index integer)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_host uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'unauthenticated'); END IF;
  SELECT host_id INTO v_host FROM public.live_streams WHERE id = _stream_id;
  IF v_host IS NULL OR v_host <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authorized');
  END IF;
  UPDATE public.live_guest_slots
    SET status = 'empty', guest_user_id = NULL, requested_at = NULL, joined_at = NULL, updated_at = now()
    WHERE stream_id = _stream_id AND slot_index = _slot_index;
  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.live_kick_guest(uuid, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.live_toggle_mute_guest(_stream_id uuid, _slot_index integer)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_host uuid; v_cur text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'unauthenticated'); END IF;
  SELECT host_id INTO v_host FROM public.live_streams WHERE id = _stream_id;
  IF v_host IS NULL OR v_host <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authorized');
  END IF;
  SELECT status INTO v_cur FROM public.live_guest_slots WHERE stream_id = _stream_id AND slot_index = _slot_index;
  UPDATE public.live_guest_slots
    SET status = CASE WHEN v_cur = 'muted' THEN 'accepted' ELSE 'muted' END, updated_at = now()
    WHERE stream_id = _stream_id AND slot_index = _slot_index;
  RETURN jsonb_build_object('success', true, 'status', CASE WHEN v_cur = 'muted' THEN 'accepted' ELSE 'muted' END);
END;
$$;
GRANT EXECUTE ON FUNCTION public.live_toggle_mute_guest(uuid, integer) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- Top supporters (real-time query used by leaderboard sheet)
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.live_top_supporters(_stream_id uuid, _limit integer DEFAULT 10)
RETURNS TABLE(user_id uuid, username text, avatar_url text, total_coins numeric, gifts_count integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT gl.sender_id, p.username, p.avatar_url,
         SUM(gl.total_price)::numeric AS total_coins,
         SUM(gl.quantity)::integer   AS gifts_count
    FROM public.gift_ledger gl
    JOIN public.profiles p ON p.id = gl.sender_id
    WHERE gl.stream_id = _stream_id AND gl.status = 'confirmed'
    GROUP BY gl.sender_id, p.username, p.avatar_url
    ORDER BY total_coins DESC
    LIMIT _limit;
$$;
GRANT EXECUTE ON FUNCTION public.live_top_supporters(uuid, integer) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- Lock down execute on privileged helpers
-- ═══════════════════════════════════════════════════════════════════════
REVOKE EXECUTE ON FUNCTION public._compute_vip_tier(numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.live_increment_mission(uuid, text, integer) FROM PUBLIC;
