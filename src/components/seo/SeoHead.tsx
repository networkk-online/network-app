import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';

interface SeoHeadProps {
  route: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
  fallbackKeywords?: string;
}

interface SeoRow {
  title: string;
  description: string;
  keywords: string;
}

const cache = new Map<string, SeoRow>();

const SeoHead = ({ route, fallbackTitle, fallbackDescription, fallbackKeywords }: SeoHeadProps) => {
  const [meta, setMeta] = useState<SeoRow | null>(cache.get(route) ?? null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('seo_meta')
        .select('title, description, keywords')
        .eq('route', route)
        .maybeSingle();
      if (cancelled || !data) return;
      cache.set(route, data as SeoRow);
      setMeta(data as SeoRow);
    })();
    return () => { cancelled = true; };
  }, [route]);

  const title = meta?.title || fallbackTitle || 'NETWORKK';
  const description = meta?.description || fallbackDescription || '';
  const keywords = meta?.keywords || fallbackKeywords || '';
  const canonical = `https://networkk.online${route === '/' ? '/' : route}`;

  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonical} />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
    </Helmet>
  );
};

export default SeoHead;
