// Generates public/sitemap.xml at predev/prebuild.
// Combines static routes with dynamic Networkk Cinema video URLs from Supabase.

import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://networkk.online';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

type Entry = {
  path: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: string;
  lastmod?: string;
};

const STATIC_ENTRIES: Entry[] = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.7' },
  { path: '/add-funds', changefreq: 'weekly', priority: '0.8' },
  { path: '/recharge', changefreq: 'weekly', priority: '0.7' },
  { path: '/network-tv', changefreq: 'daily', priority: '0.9' },
  { path: '/explore', changefreq: 'daily', priority: '0.8' },
  { path: '/shorts', changefreq: 'daily', priority: '0.7' },
  { path: '/tweets', changefreq: 'daily', priority: '0.6' },
  { path: '/welcome', changefreq: 'monthly', priority: '0.7' },
  { path: '/broadcast', changefreq: 'weekly', priority: '0.6' },
  { path: '/business', changefreq: 'monthly', priority: '0.6' },
  { path: '/pages', changefreq: 'weekly', priority: '0.6' },
];

async function fetchCinemaEntries(): Promise<Entry[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('[sitemap] Supabase env missing — skipping dynamic videos');
    return [];
  }
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase
      .from('videos')
      .select('id, updated_at, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(5000);
    if (error) throw error;
    return (data ?? []).map((v: any) => ({
      path: `/watch/${v.id}`,
      lastmod: (v.updated_at ?? v.created_at)?.split('T')[0],
      changefreq: 'weekly' as const,
      priority: '0.6',
    }));
  } catch (e) {
    console.warn('[sitemap] fetch videos failed:', (e as Error).message);
    return [];
  }
}

function render(entries: Entry[]): string {
  const urls = entries
    .map((e) =>
      [
        '  <url>',
        `    <loc>${BASE_URL}${e.path}</loc>`,
        e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
        e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
        e.priority ? `    <priority>${e.priority}</priority>` : null,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

(async () => {
  const dynamicEntries = await fetchCinemaEntries();
  const all = [...STATIC_ENTRIES, ...dynamicEntries];
  const xml = render(all);
  const out = resolve('public/sitemap.xml');
  writeFileSync(out, xml, 'utf8');
  console.log(`[sitemap] wrote ${all.length} entries → ${out}`);
})();
