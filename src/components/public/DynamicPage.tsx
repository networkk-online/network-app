import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';

interface Props { slug: string }

const DynamicPage = ({ slug }: Props) => {
  const [page, setPage] = useState<{ title: string; body: string; meta_description: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('site_pages')
        .select('title, body, meta_description')
        .eq('slug', slug)
        .maybeSingle();
      setPage(data as any);
      setLoading(false);
      if (data?.title) document.title = `${data.title} • NETWORKK`;
      if ((data as any)?.meta_description) {
        let m = document.querySelector('meta[name="description"]');
        if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'description'); document.head.appendChild(m); }
        m.setAttribute('content', (data as any).meta_description);
      }
    })();
  }, [slug]);

  return (
    <div className="min-h-screen bg-[#080808] text-white/90">
      <header className="sticky top-0 z-40 bg-[#080808]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1 text-white/60 hover:text-[#00e676] transition">
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm">Home</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {loading ? (
          <div className="space-y-3">
            <div className="h-8 w-1/2 bg-white/5 rounded animate-pulse" />
            <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-white/5 rounded animate-pulse" />
          </div>
        ) : !page ? (
          <div className="text-center py-24">
            <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
            <p className="text-white/40">The requested page does not exist.</p>
          </div>
        ) : (
          <article className="bg-[#0d0d0d]/80 border border-white/5 rounded-2xl p-8 backdrop-blur-xl">
            <h1 className="text-3xl font-bold text-white mb-6 border-b border-[#00e676]/20 pb-4">{page.title}</h1>
            <div className="prose prose-invert max-w-none whitespace-pre-wrap text-white/70 leading-relaxed">
              {page.body}
            </div>
          </article>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default DynamicPage;
