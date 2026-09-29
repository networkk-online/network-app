# Networkk Performance + App/Web Parity Hardening

## Data source
- Android and website use the same Supabase project: ykjnpcrseiyltsazbnci.
- No website-only database, migration, reset, truncate, or data copy is introduced.
- Existing app data remains the source of truth.

## Performance changes
- React Query now keeps successful query data warm for 30 seconds, avoids unnecessary focus refetches, and retries failed queries once.
- Reels and stories feed queries are bounded to the visible feed window instead of requesting unbounded rows.
- Reels payloads request only fields used by the UI and only load liked IDs for the current feed items.
- Stories payloads request only fields used by the UI, cap active stories, and use a Map for profile lookup.
- Story view writes are batched into one upsert instead of one network request per story.
- Bottom navigation and global notification/finance/subscription providers use the cached Supabase session instead of unnecessary user lookups.
- Subscription refreshes are deferred out of the auth callback to avoid Supabase auth request contention.
- Vite no longer loads the unused development-only component tagger.

## Parity rule
Feature code is shared by the Capacitor Android app and the website. The canonical Supabase runtime invariant rejects a deployment configured against a different Supabase project.

## Safety
No canonical tables are recreated, migrated, truncated, or copied by this hardening change.
