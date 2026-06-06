import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Phone, MessageCircle, ChevronLeft, LifeBuoy } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';

const SupportCenter = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    document.title = 'Help Center • NETWORKK';
    (async () => {
      const { data } = await supabase.from('support_settings').select('*').limit(1).maybeSingle();
      setData(data);
    })();
  }, []);

  const phone = data?.support_phone || '07737318706';
  const whatsapp = data?.whatsapp_url || 'https://wa.me/9647737318706';

  return (
    <div className="min-h-screen bg-[#080808] text-white/90">
      <header className="sticky top-0 z-40 bg-[#080808]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1 text-white/60 hover:text-[#00e676] transition">
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm">Home</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <LifeBuoy className="h-12 w-12 text-[#00e676] mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-3">{data?.hero_title || 'Support & Help Center'}</h1>
          <p className="text-white/50">{data?.hero_subtitle || 'We are here to help.'}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <a href={`tel:${phone}`} className="bg-[#0d0d0d]/80 border border-white/5 hover:border-[#00e676]/40 rounded-2xl p-6 backdrop-blur-xl transition group">
            <Phone className="h-8 w-8 text-[#00e676] mb-3" />
            <h3 className="text-white font-semibold mb-1">Call Now</h3>
            <p className="text-white/40 text-sm">{phone}</p>
          </a>
          <a href={whatsapp} target="_blank" rel="noreferrer" className="bg-[#0d0d0d]/80 border border-white/5 hover:border-[#00e676]/40 rounded-2xl p-6 backdrop-blur-xl transition group">
            <MessageCircle className="h-8 w-8 text-[#00e676] mb-3" />
            <h3 className="text-white font-semibold mb-1">WhatsApp</h3>
            <p className="text-white/40 text-sm">Chat with us instantly</p>
          </a>
        </div>

        <div className="grid gap-4">
          {(data?.sections || []).map((s: any, i: number) => (
            <div key={i} className="bg-[#0d0d0d]/80 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
              <h3 className="text-[#00e676] font-semibold mb-2">{s.title}</h3>
              <p className="text-white/70 whitespace-pre-wrap">{s.body}</p>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default SupportCenter;
