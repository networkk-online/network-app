# Networkk.online — Independent Deployment Guide

This project runs **fully independently of the Lovable workspace**. GitHub is the
source of truth, Supabase hosts all backend logic, and the frontend is a plain
React + Vite SPA that can be built and hosted anywhere.

---

## 1. Service dependency audit

### Works with no Lovable workspace (100% independent)

| Feature | Backing service |
|---|---|
| Login / registration / OTP | Supabase Auth + Edge Functions (`lookup-username`, `send-login-otp`, `verify-login-otp`) |
| Profiles, posts, reels, stories | Supabase Postgres + Storage (RLS enforced) |
| Messages | Supabase Postgres + Realtime (+ DynamoDB sync via AWS keys) |
| Live streaming | Agora (`AGORA_APP_ID` / `AGORA_APP_CERTIFICATE`) + Supabase Realtime |
| Gifts, R Coins, wallet | Supabase RPCs (`send_live_gift`, ledger tables) |
| Subscriptions & entitlements | Supabase tables + `get_effective_plan` / `my_entitlements` RPCs |
| Supabase Realtime channels | Supabase |
| Android APK / AAB | Capacitor local `dist/` bundle — no remote URL |
| Frontend hosting | Vercel / Netlify / any static host |

### Previously Lovable-dependent (now isolated / optional)

| Item | Status |
|---|---|
| Lovable preview URL `network-app.lovable.app` in share links & auth emails | **Replaced** with `https://networkk.online` |
| `lovable-tagger` Vite plugin | Now loaded **optionally** in dev only; production builds never require it |
| Lovable `og:image` / `twitter:site` metadata | Replaced with self-hosted `https://networkk.online/icon-512.png` |
| Service-worker preview host checks in `src/main.tsx` | Harmless — only affects `localhost` / preview hosts |
| `ai-smart-reply` Edge Function (Lovable AI Gateway) | **Optional.** Degrades to built-in static Arabic suggestions when `LOVABLE_API_KEY` is unavailable. Chat still works. |
| `networkk-bot` Edge Function (Lovable AI Gateway) | **Optional.** `/balance` and `/help` slash commands work without AI; free-text replies show a graceful notice. |
| `auth-email-hook` (Lovable branded auth emails) | **Optional.** If Lovable Email is paused, disable the Auth email hook in the backend so Supabase sends its default auth emails instead. Login/registration are otherwise unaffected. |

No data, tables, functions, users, or integrations were removed.

---

## 2. Environment variables

Frontend (public — safe to expose, protected by RLS). Set these in Vercel/Netlify:

```
VITE_SUPABASE_URL=https://ykjnpcrseiyltsazbnci.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon / publishable key>
VITE_SUPABASE_PROJECT_ID=ykjnpcrseiyltsazbnci
```

See `.env.example`. Never add server secrets to `VITE_*` variables.

Server-side secrets stay in Supabase Edge Function secrets (already configured):
`SUPABASE_SERVICE_ROLE_KEY`, `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`,
`DAILY_API_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`,
`AWS_DYNAMODB_TABLE_NAME`, and the optional `LOVABLE_API_KEY`.

---

## 3. Deploy to Vercel

1. Import the GitHub repo at <https://vercel.com/new>.
2. Framework preset: **Vite**. Build command `npm run build`, output `dist`.
3. Add the three `VITE_*` env vars (Production + Preview).
4. Deploy, then add the domain `networkk.online` (and `www`) under
   Project → Settings → Domains, and point DNS at Vercel.

`vercel.json` already sets the SPA rewrite and asset caching.

## 4. Deploy to Netlify

1. **Add new site → Import from Git**, pick the repo.
2. Build command `npm run build`, publish directory `dist` (also in `netlify.toml`).
3. Add the three `VITE_*` env vars under Site settings → Environment variables.
4. Add the custom domain `networkk.online` and update DNS.

SPA routing is handled by `netlify.toml` and `public/_redirects`.

---

## 5. Android build (local bundle, no remote loading)

`capacitor.config.ts` intentionally has **no `server.url`**, so the APK ships the
bundled `dist/`:

```bash
npm install
npm run build
npx cap sync android
cd android && ./gradlew assembleRelease   # or bundleRelease for AAB
```

The GitHub Actions workflows `.github/workflows/build-apk.yml` and
`build-aab.yml` do the same in CI. See `ANDROID_PRODUCTION.md` for signing.

---

## 6. Remaining manual steps

1. Create the Vercel or Netlify project and set the three `VITE_*` env vars.
2. Repoint `networkk.online` DNS to the chosen host when you move off Lovable hosting.
3. If Lovable Email is paused, disable the Supabase Auth email hook so default
   auth emails are sent.
4. Keep Supabase, Agora, Daily and AWS billing active — those are separate from
   Lovable credits.
