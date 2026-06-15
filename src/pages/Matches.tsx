import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, Calendar, Trophy } from 'lucide-react';
import BackButton from '@/components/BackButton';

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  league: string | null;
  start_time: string;
  status: string;
  thumbnail_url: string | null;
}

const statusLabel = (s: string) =>
  s === 'live' ? 'مباشر' : s === 'ended' ? 'انتهت' : 'قادمة';

const Matches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('matches')
        .select('id, home_team, away_team, league, start_time, status, thumbnail_url')
        .order('start_time', { ascending: false });
      setMatches((data as Match[]) || []);
      setLoading(false);
    };
    load();

    const ch = supabase
      .channel('matches-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center gap-3">
        <BackButton />
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#08A045]" /> المباريات المباشرة
        </h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-3">
        {loading ? (
          <p className="text-center text-white/40 py-12">جاري التحميل...</p>
        ) : matches.length === 0 ? (
          <p className="text-center text-white/40 py-12">لا توجد مباريات حالياً</p>
        ) : (
          matches.map((m) => (
            <Link key={m.id} to={`/matches/${m.id}`}>
              <Card className="bg-white/[0.04] hover:bg-white/[0.07] transition border-white/[0.08] backdrop-blur-xl overflow-hidden">
                <div className="flex items-stretch">
                  {m.thumbnail_url && (
                    <div className="w-32 h-24 shrink-0 bg-black/60">
                      <img src={m.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-white/40">{m.league || '—'}</span>
                      <Badge
                        variant="outline"
                        className={
                          m.status === 'live'
                            ? 'border-red-500/40 text-red-400 bg-red-500/10'
                            : m.status === 'ended'
                            ? 'border-white/20 text-white/40'
                            : 'border-[#08A045]/40 text-[#08A045] bg-[#08A045]/10'
                        }
                      >
                        {m.status === 'live' && <Radio className="w-3 h-3 ml-1 animate-pulse" />}
                        {statusLabel(m.status)}
                      </Badge>
                    </div>
                    <div className="text-base font-semibold mt-2">
                      {m.home_team} <span className="text-white/30">vs</span> {m.away_team}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-white/40 mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(m.start_time).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </main>
    </div>
  );
};

export default Matches;
