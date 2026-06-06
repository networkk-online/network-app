## Scope

Two major workstreams:
1. **Consolidate admin routes** into the existing Owner Vault at `/G3142-AF26-0x99` and redirect legacy routes.
2. **Footer-driven content system**: create ~20 public pages (Careers, About, Help, etc.), wire each to a dynamic content store, and add admin CRUD managers inside the Vault — including a Support Center content manager.

## Workstream 1 — Admin Consolidation

**Redirects (no business-logic change)**
- `/admin` → `/G3142-AF26-0x99`
- `/admin-control` → `/G3142-AF26-0x99`
- `/admin-control-panel-secret` → `/G3142-AF26-0x99`
- Replace each page component with a `<Navigate to="/G3142-AF26-0x99" replace />` (kept as files so any deep import still resolves). Keep `AdminAuthGuard` on the vault as today.

**Vault sidebar embedding** (`src/pages/OwnerVault.tsx` + `VaultSidebar.tsx`)
- Under **المالية والأصول**: mount `AdminContentManager`'s Payment Gateways card grid (new `finance` sub-tab "بوابات الدفع").
- Under **مركز التنفيذ**: add tabs for `pages-content` (CMS for footer pages), `careers` (jobs CRUD), `support-center` (support page content + phone + WhatsApp link CRUD).
- All tabs render via the existing `activeTab` switch — no hard refresh.

**Theme pass**: ensure new panels use `bg-[#080808]`, glass cards `bg-[#0d0d0d]/80 border border-white/5`, accents `#00e676` (matches existing vault tokens; minor tweak only).

## Workstream 2 — Footer Pages + CMS

**Database (single migration)**
- `site_pages` (slug PK-ish unique, title, body_md, body_html, meta_description, updated_at, updated_by). Seeded with all footer slugs.
- `careers_jobs` (id, title, department, location, employment_type, description, requirements, is_open, posted_at).
- `support_settings` (singleton row: support_phone, whatsapp_url, hero_title, hero_subtitle, sections JSONB).
- RLS: public `SELECT` on all three; `INSERT/UPDATE/DELETE` restricted to `has_role(auth.uid(),'admin')`.
- Grants: `anon, authenticated` SELECT; `authenticated` full CRUD (guarded by RLS); `service_role` ALL.

**Public routes** (each fetches its row from `site_pages` by slug; Careers fetches jobs list)
```
/careers, /platform-status, /accessibility, /download
/about, /newsroom, /investors
/help, /using-networkk, /manage-account, /terms, /contact
/developers, /docs, /engineering-blog
/advertising, /business, /resources
```
- One shared `<DynamicPage slug="…" />` component renders title + markdown body for the static ones.
- `Careers.tsx` lists `careers_jobs where is_open=true` with a clean card UI.
- Add routes to `src/App.tsx`; lazy load.

**Vault CMS panels** (inside `OwnerVault`, glass theme)
- `VaultPagesContent.tsx`: list site_pages, edit title/body/meta, save → updates row (no rebuild needed; consumers re-fetch).
- `VaultCareersManager.tsx`: full CRUD on `careers_jobs` (create, edit, toggle open, delete).
- `VaultSupportCenter.tsx`: edit phone, WhatsApp URL, hero text, section cards.

**Footer**: update existing footer (if present) so every link points to the new routes; otherwise add a `SiteFooter` with the columns from the screenshot.

## Out of scope / explicit notes
- `https://support.networkk.online` is a separate subdomain not in this repo. We expose a **shared `support_settings` table + public read endpoint** so that subdomain can fetch the same data. We will not deploy to that subdomain here.
- No payment-gateway logic changes — only relocate the existing manager UI into the vault sidebar.
- No auth changes; Vault keeps its 123456 secondary password.

## Technical sections

**Files created**
- `supabase/migrations/<ts>_cms_and_admin_consolidation.sql`
- `src/components/vault/VaultPagesContent.tsx`
- `src/components/vault/VaultCareersManager.tsx`
- `src/components/vault/VaultSupportCenter.tsx`
- `src/components/vault/VaultPaymentGateways.tsx` (wrapper that mounts existing gateway UI from `AdminContentManager`)
- `src/components/public/DynamicPage.tsx`
- `src/pages/public/Careers.tsx` + ~17 thin page files (or one route that takes `:slug`)
- `src/components/SiteFooter.tsx` (if missing)

**Files edited**
- `src/App.tsx` — add public routes, add redirect routes for legacy admin paths.
- `src/pages/OwnerVault.tsx` — register new tabs.
- `src/components/vault/VaultSidebar.tsx` — add menu items (pages-content, careers, support-center, payment-gateways).
- `src/pages/AdminControl.tsx`, `src/pages/ControlPanel.tsx`, `src/pages/SecureAdminPanel.tsx`, `src/pages/AdminDashboard.tsx` (if linked) — replaced with `<Navigate>` redirect.

**Single slug-driven route to keep things lean**
Instead of 17 separate page files, use one `<Route path="/p/:slug" element={<DynamicPage/>}/>` plus explicit aliases (`/about`, `/careers`, etc.) that render the same component with a fixed slug.

## Confirm before I build
The plan touches a lot of surface area (1 migration, ~6 new components, ~17 new routes, sidebar/vault refactor, 4 redirects). Approve and I'll execute it as a single batch, then verify the build.
