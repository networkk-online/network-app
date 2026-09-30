# Networkk Test User Generator

Generates **internal Networkk test accounts only** using the Supabase Admin API. It does not create TikTok, Instagram, or other third-party accounts.

## GitHub setup

Add these repository Actions secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Never put the service-role key in frontend code or commit it to the repository.

## Run

GitHub → Actions → **Generate Networkk Test Users** → Run workflow.

You can generate 1–1000 accounts per run. The workflow creates verified test emails under `@test.networkk.local` and stores credentials in a short-lived Actions artifact (1 day).

These accounts are marked with `is_test_account: true` in auth metadata so your admin/test tooling can identify them.
