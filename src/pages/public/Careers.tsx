import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Clock, ChevronLeft } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string;
  requirements: string;
}

const Careers = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Job | null>(null);

  useEffect(() => {
    document.title = 'Careers • NETWORKK';
    (async () => {
      const { data } = await supabase
        .from('careers_jobs')
        .select('*')
        .eq('is_open', true)
        .order('posted_at', { ascending: false });
      setJobs((data || []) as any);
      setLoading(false);
    })();
  }, []);

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
          <Briefcase className="h-12 w-12 text-[#00e676] mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-3">Join NETWORKK</h1>
          <p className="text-white/50">Help us build the next generation social platform.</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-[#0d0d0d]/80 border border-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-[#0d0d0d]/80 border border-white/5 rounded-2xl p-12 text-center backdrop-blur-xl">
            <p className="text-white/50 mb-2">No open positions right now.</p>
            <p className="text-white/30 text-sm">Check back soon — we're growing fast.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map(job => (
              <button
                key={job.id}
                onClick={() => setSelected(job)}
                className="text-left bg-[#0d0d0d]/80 hover:bg-[#0d0d0d] border border-white/5 hover:border-[#00e676]/40 rounded-2xl p-6 backdrop-blur-xl transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-[#00e676] transition mb-2">{job.title}</h3>
                    <div className="flex flex-wrap gap-3 text-xs text-white/40">
                      {job.department && <span>{job.department}</span>}
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.employment_type}</span>
                    </div>
                  </div>
                  <span className="text-[#00e676] text-sm font-medium opacity-0 group-hover:opacity-100 transition">View →</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <div className="bg-[#0d0d0d] border border-[#00e676]/30 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-8" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-white mb-2">{selected.title}</h2>
              <div className="flex flex-wrap gap-3 text-xs text-white/40 mb-6">
                {selected.department && <span>{selected.department}</span>}
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{selected.location}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{selected.employment_type}</span>
              </div>
              <h3 className="text-[#00e676] font-semibold mb-2">Description</h3>
              <p className="text-white/70 whitespace-pre-wrap mb-6">{selected.description}</p>
              {selected.requirements && (
                <>
                  <h3 className="text-[#00e676] font-semibold mb-2">Requirements</h3>
                  <p className="text-white/70 whitespace-pre-wrap mb-6">{selected.requirements}</p>
                </>
              )}
              <button onClick={() => setSelected(null)} className="w-full py-3 bg-[#00e676]/10 hover:bg-[#00e676]/20 border border-[#00e676]/40 text-[#00e676] rounded-xl font-medium transition">
                Close
              </button>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default Careers;
