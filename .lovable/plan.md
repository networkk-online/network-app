## Intelligence & Monitoring Center — G3142-AF26-0x99

Build a Cyber-Command intelligence suite inside the Owner Vault with 4 modules. All UI in Pure Black + Neon Green (#39FF14) glassmorphism, Cairo font for admin.

### 1. Database (migration)

New tables (all RLS-locked to `has_role(auth.uid(),'admin')`):
- **`activity_intel`** — `event_type` (signup_apple/signup_google/gem_transfer_high/live_start/login), `user_id`, `ip`, `country`, `city`, `device`, `os`, `metadata jsonb`, `severity`, `created_at`
- **`threat_flags`** — `user_id`, `flag_type` (extortion_keyword/bot_behavior/rapid_login/scam), `evidence jsonb`, `status` (pending/reviewed/dismissed), `auto_action` (shadow_ban/freeze/none), `created_at`
- **`account_restrictions`** — `user_id unique`, `shadow_banned bool`, `verification_frozen bool`, `reason`, `imposed_by`, `expires_at`
- **`financial_alerts`** — `user_id`, `alert_type` (rapid_gifts/unusual_volume), `amount`, `window_minutes`, `status`, `created_at`
- Extend `app_settings` with `maintenance_mode bool`, `extortion_keywords text[]`

Triggers:
- On `gift_ledger` insert ≥ threshold (e.g. 100k IQD in 10 min) → insert into `financial_alerts`
- On `live_streams` start → insert into `activity_intel`

### 2. Edge Functions

- **`intel-log-event`** — client-callable; captures IP (from headers), parses UA → device/os, geo via free `ipapi.co` lookup, writes to `activity_intel`. Called from auth callbacks, gift transfers, live start.
- **`threat-scanner`** — scans message/profile text against keyword list (Arabic + English: ابتزاز، تهديد، صور، blackmail, sextortion, scam…); writes `threat_flags`; if score ≥ threshold auto-inserts `account_restrictions` (shadow_ban or freeze).
- **`admin-remote-command`** — admin-only (verifies role); supports actions: `kill_live` (calls existing kill-stream), `revoke_sessions` (admin.signOut user), `set_maintenance` (toggle app_setting), `lift_restriction`.
- Hook **`process-gift`** to call rapid-gift detection.

### 3. Frontend — Vault Intelligence Hub

New route inside Vault: `VaultIntelligence.tsx` with tabbed Cyber-Command UI:

```text
┌─ INTEL ─┬─ THREATS ─┬─ FINANCE ─┬─ COMMAND ─┐
│ Live activity feed (realtime)                │
│ Threat queue + auto-actions                  │
│ Revenue/commission chart + flagged wallets   │
│ Kill switch grid + maintenance toggle        │
└──────────────────────────────────────────────┘
```

Components (all in `src/components/vault/intel/`):
- `GlobalActivityFeed.tsx` — realtime channel on `activity_intel`, neon green pulse rows, filter chips (signups/gifts/lives/logins), shows flag/country/device.
- `ThreatQueue.tsx` — pending `threat_flags` cards with evidence, "Confirm Ban / Freeze / Dismiss" buttons.
- `FinancialIntelPanel.tsx` — Recharts area chart of platform 20% commission (last 24h/7d/30d), top earners, flagged wallets list from `financial_alerts`.
- `RemoteCommandPanel.tsx` — kill any live (list active streams + button), revoke session by user search, master "MAINTENANCE MODE" toggle with confirmation modal.
- `IntelStatCards.tsx` — 4 KPI cards (active threats, today signups, gifts last hour, platform revenue today).

Visual: `bg-black`, panels `bg-white/[0.04] backdrop-blur-xl border border-[#39FF14]/20`, neon pulse animations, monospace numerics, Cairo headings, scanline overlay.

### 4. Integration hooks (light client edits)

- `useAuth` / login flow → call `intel-log-event` after successful Apple/Google signup
- `useAgoraRoom` start → log `live_start`
- `process-gift` → already server-side; add rapid-gift insert
- App root → if `maintenance_mode = true` and not admin, render glass lockout screen

### 5. Vault sidebar

Add "Intelligence" item to `VaultSidebar.tsx` linking to new tab.

---

**Out of scope** (can follow up): full ML bot detection, paid IP geo provider, encrypted-at-rest column wrapping. Current geo uses free ipapi; keywords are admin-editable list.

Proceed?
