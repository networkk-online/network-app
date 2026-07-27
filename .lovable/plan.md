# Live Streaming v3.0 — Full Rebuild

Complete replacement of the Live experience with a premium Emerald+Gold VIP theme. Existing backend tables (`live_streams`, `live_gift_catalog`, `live_super_gift_events`, `live_entrance_events`, `live_vip_levels`, `live_quests`, `live_quest_progress`, `live_goals`, `live_rounds`, `live_summary`) stay intact — we add what's missing and rebuild the UI on top.

## Scope confirmed

- **Only Live Streaming** rebuilt this round (Auth, Home, Profile, Settings, Wallet stay as-is).
- **Direct replacement** — old `LiveBroadcast.tsx` + `TikTokLiveOverlay.tsx` removed.
- **Backend + UI** for new features.
- **Emerald (#08A045) + Gold (#FFD700 VIP)** on pure black glass.

## Backend additions (one migration)

New tables + GRANTs + RLS + Realtime:

- `live_missions` (catalog: daily/weekly/monthly, requirement, reward_coins)
- `live_mission_progress` (user_id, mission_id, progress, completed_at)
- `live_leaderboard_snapshots` (period: daily/weekly/monthly/all, kind: gifter/supporter/viewer, rank, user_id, score)
- `live_pk_battles` (host_id, opponent_id, host_score, opponent_score, winner_id, status, started_at, ended_at)
- `live_treasure_box` (stream_id, tier, opened_by, reward_coins, opened_at)
- `live_pinned_messages` (stream_id, message, pinned_by, pinned_at)
- `live_moderators` (stream_id, user_id, granted_by) — for kick/mute/ban permissions
- `live_bans` (stream_id, user_id, banned_by, reason)
- `live_guest_slots` (stream_id, slot_index 0..8, guest_user_id, status) — supports 1/2/4/9 guest layouts

Seed `live_missions` with daily/weekly starter set. Seed `live_gift_catalog` with the new gift roster (Rose, Heart, Coffee, Cake, Teddy, Car, Motorcycle, Yacht, Jet, Lion, Dragon, Castle, Crown, Galaxy, Phoenix) organized by category (Popular/VIP/Luxury/Legendary/Funny/Seasonal).

## New UI architecture

Replaces `LiveBroadcast.tsx` (811 lines) and `TikTokLiveOverlay.tsx` (324 lines) with a modular structure under `src/components/live/v3/`:

```text
LiveScreen (root, full-screen video, routes host vs viewer)
├── VideoStage (Agora grid / guest slots 1/2/4/9 via GuestSlots)
├── overlays/
│   ├── TopBar         (LIVE badge · host · verified · VIP · duration · viewers · quality · share · close)
│   ├── LeftRail       (Missions · Rounds · PK · TreasureBox · Leaderboard · Goals)
│   ├── RightRail      (Like · Gift · Join · Viewers · Share · Settings · Moderation)
│   ├── BottomChat     (premium chat: emoji/gif/voice/mention/reply · pinned · typing)
│   └── HostControl    (mute/ban/kick/pin/invite/filters/cam/mic/beauty/analytics/end)
├── panels/
│   ├── PremiumGiftDrawer  (categories tabs · particles · sound · combos · fullscreen anims)
│   ├── MissionsSheet
│   ├── LeaderboardSheet   (top fans/supporters/gifters/viewers · daily/weekly/monthly/all)
│   ├── ViewersSheet
│   ├── ModerationSheet
│   ├── PKBattlePanel      (countdown · rounds · scores · winner anim · history)
│   ├── TreasureBoxSheet
│   └── GoalsSheet
└── effects/
    ├── CinematicGiftLayer (fullscreen 3D for legendary/luxury)
    ├── VIPEntranceLayer
    ├── FlyingHeartsLayer
    ├── ComboBanner
    └── LevelUpBurst
```

Old components in `src/components/live/` (Agora grid, Daily grid, sync helpers, WatchTogether) are kept and imported by the new stage. Old overlay files (`HostTopBar`, `LiveComments`, `TopGiftersBar`, `GiftPanel`, `GiftAnimation`, `GrandGiftAnimation`, `PKBattle`, `TikTokLiveOverlay`) are removed.

## Route wiring

`src/pages/Broadcast.tsx` mounts `<LiveScreen mode="host|viewer" joinRoomId={...} />`. Existing `is_live` heartbeat, kill-switch subscription, and `live_streams` registry logic port straight into the new root — no route or DB contract changes.

## Design system (Emerald + Gold VIP)

Extend `src/index.css` / `tailwind.config.ts` with:

- `--live-emerald: 144 90% 33%` (existing primary)
- `--vip-gold: 45 100% 50%`
- `--vip-gold-glow: 45 100% 65%`
- gradient tokens: `--gradient-vip`, `--gradient-legendary`
- glass tokens: `--glass-live-panel` (bg-white/[0.04] + blur-2xl + gold rim for VIP)

All new components consume tokens — no hardcoded colors. Framer Motion for every enter/exit, combo scale-bump, cinematic gift entry.

## Delivery order (this turn)

1. Migration: new tables, GRANTs, RLS, Realtime, catalog seeds.
2. Design tokens (index.css + tailwind config).
3. `LiveScreen` root + `TopBar` + `LeftRail` + `RightRail` + `BottomChat` + `HostControl`.
4. `PremiumGiftDrawer` (categorized) + `CinematicGiftLayer` + `ComboBanner`.
5. `MissionsSheet` + `LeaderboardSheet` + `ViewersSheet` + `ModerationSheet` + `PKBattlePanel` + `GoalsSheet` + `TreasureBoxSheet`.
6. `GuestSlots` (1/2/4/9 layouts).
7. Remove old `LiveBroadcast.tsx`, `TikTokLiveOverlay.tsx`, and dead overlay files. Point `pages/Broadcast.tsx` at the new root.
8. Verify: typecheck + Playwright screenshot of `/broadcast` host preview + viewer join.

## What stays untouched

Auth, Home, Profile, Messages, Stories, Reels, Wallet, Subscriptions, Settings, Admin panel, and all other Supabase functions/tables. Nothing outside `src/components/live/**`, `src/components/LiveBroadcast.tsx`, `src/components/TikTokLiveOverlay.tsx`, `src/pages/Broadcast.tsx`, plus the one migration and token additions.

## Risks

- Guest slots (1/2/4/9) need Agora multi-publisher tokens — UI ships this turn, token role plumbing may need a follow-up if Agora token function only issues host tokens today.
- Cinematic gifts for the full 15-item roster: base engine ships this turn; individual per-gift 3D scenes for Dragon/Phoenix/Galaxy/Castle are stubbed with premium particle bursts and can be upgraded in a follow-up without touching the wiring.
- Existing sessions currently open will need a page refresh after deploy — Realtime channels are re-keyed.

Reply "approve" and I ship the migration first, then the UI in one continuous pass.
