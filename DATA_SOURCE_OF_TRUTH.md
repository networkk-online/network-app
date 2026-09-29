# Networkk Data Source of Truth

## Canonical data

The Networkk Android app's existing Supabase project is the single source of truth for production application data.

- Supabase project ID: `ykjnpcrseiyltsazbnci`
- Supabase URL: `https://ykjnpcrseiyltsazbnci.supabase.co`
- Production site: `https://networkk.online`

## Required architecture

Android and website use the same Supabase project, schema, storage, authentication, realtime channels, RPCs, and Edge Functions.

There is no separate website database. The website is another client of the app's existing backend. Existing app users, profiles, posts, reels, messages, wallet/rewards, notifications, live data, Network TV data, subscriptions, and admin data remain in the canonical Supabase project.

## Data safety

Do not migrate, reset, truncate, replace, or recreate canonical production tables as part of website work.

Browser localStorage is only for device-local UI preferences/session support. It is not the production database.

AWS/DynamoDB integrations are auxiliary integrations only; they must not become the authoritative source for Networkk application data.

## Deployment

Vercel, Netlify, Android builds, and future web deployments must use the same canonical `VITE_SUPABASE_URL` and publishable key.

The shared Supabase client rejects a build pointed at a different Supabase project instead of silently creating a second data source.
