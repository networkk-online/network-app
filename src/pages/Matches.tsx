import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Radio, Calendar, Trophy, Play, X } from 'lucide-react';
import BackButton from '@/components/BackButton';
import IframePlayer from '@/components/IframePlayer';

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  league: string | null;
  start_time: string;
  status: string;
  stream_url: string | null;
  thumbnail_url: string | null;
}

const statusLabel = (s: string) =>
  s === 'live' ? 'مباشر' : s === 'ended' ? 'انتهت' : 'قادمة';

const Matches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Match | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('matches')
        .select('id, home_team, away_team, league, start_time, status, stream_url, thumbnail_url')
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

      <main className="max-w-6xl mx-auto px-4 pt-6">
        {loading ? (
          <p className="text-center text-white/40 py-12">جاري التحميل...</p>
        ) : matches.length === 0 ? (
          <p className="text-center text-white/40 py-12">لا توجد مباريات حالياً</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((m) => (
              <Card
                key={m.id}
                className="bg-white/[0.04] hover:bg-white/[0.07] transition border-white/[0.08] backdrop-blur-xl overflow-hidden flex flex-col"
              >
                <div className="relative aspect-video bg-black/60">
                  {m.thumbnail_url ? (
                    <img src={m.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Trophy className="w-10 h-10 text-white/10" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant="outline"
                      className={
                        m.status === 'live'
                          ? 'border-red-500/40 text-red-400 bg-red-500/20 backdrop-blur'
                          : m.status === 'ended'
                          ? 'border-white/20 text-white/60 bg-black/40 backdrop-blur'
                          : 'border-[#08A045]/40 text-[#08A045] bg-black/40 backdrop-blur'
                      }
                    >
                      {m.status === 'live' && <Radio className="w-3 h-3 ml-1 animate-pulse" />}
                      {statusLabel(m.status)}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col gap-3">
                  <span className="text-xs text-white/40">{m.league || '—'}</span>
                  <div className="text-base font-semibold leading-tight">
                    {m.home_team} <span className="text-white/30">vs</span> {m.away_team}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white/40">
                    <Calendar className="w-3 h-3" />
                    {new Date(m.start_time).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                  <Button
                    onClick={() => setActive(m)}
                    disabled={!m.stream_url}
                    className="mt-auto bg-[#08A045] hover:bg-[#08A045]/90 text-white font-bold gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    {m.stream_url ? 'مشاهدة' : 'لا يوجد بث'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-5xl w-full p-0 bg-black border-white/[0.08] overflow-hidden">
          <DialogTitle className="sr-only">
            {active ? `${active.home_team} vs ${active.away_team}` : 'البث المباشر'}
          </DialogTitle>
          {active && (
            <div className="flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2 min-w-0">
                  <Trophy className="w-4 h-4 text-[#08A045] shrink-0" />
                  <span className="font-bold truncate">
                    {active.home_team} <span className="text-white/30">vs</span> {active.away_team}
                  </span>
                  {active.status === 'live' && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/90 text-[10px] font-bold">
                      <Radio className="w-3 h-3 animate-pulse" /> LIVE
                    </span>
                  )}
                </div>
                <button onClick={() => setActive(null)} className="p-1.5 rounded hover:bg-white/10">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative bg-black">
                {active.stream_url ? (
                  <IframePlayer
                    src={active.stream_url}
                    title={`${active.home_team} vs ${active.away_team}`}
                    height={600}
                  />
                ) : (
                  <div className="h-[600px] flex items-center justify-center text-white/40 text-sm">
                    لا يوجد رابط بث متاح
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Matches;
