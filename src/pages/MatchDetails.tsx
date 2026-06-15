import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Radio, Calendar, LogIn, Trophy } from 'lucide-react';
import BackButton from '@/components/BackButton';
import HlsPlayer from '@/components/HlsPlayer';

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  league: string | null;
  start_time: string;
  status: string;
  stream_url: string | null;
  thumbnail_url: string | null;
  notes: string | null;
}

const MatchDetails = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!matchId) return;
    const load = async () => {
      const { data } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .maybeSingle();
      setMatch(data as Match | null);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel(`match-${matchId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [matchId]);

  if (loading) {
    return <div className="min-h-screen bg-black text-white/40 flex items-center justify-center">جاري التحميل...</div>;
  }
  if (!match) {
    return <div className="min-h-screen bg-black text-white/40 flex items-center justify-center">المباراة غير موجودة</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center gap-3">
        <BackButton />
        <h1 className="text-base font-bold flex items-center gap-2 truncate">
          <Trophy className="w-4 h-4 text-[#08A045] shrink-0" />
          <span className="truncate">{match.home_team} vs {match.away_team}</span>
        </h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
        {/* Player container */}
        <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-white/[0.08]">
          {isLoggedIn === false ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-black via-black to-[#08A045]/10">
              {match.thumbnail_url && (
                <img src={match.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
              )}
              <div className="relative z-10 flex flex-col items-center gap-3">
                <LogIn className="w-10 h-10 text-[#08A045]" />
                <p className="text-white/70 text-sm">سجّل الدخول لمشاهدة البث المباشر</p>
                <Button
                  size="lg"
                  onClick={() => navigate(`/login?redirect=/matches/${match.id}`)}
                  className="bg-[#08A045] hover:bg-[#08A045]/90 text-white font-bold px-8"
                >
                  تسجيل الدخول للمشاهدة
                </Button>
              </div>
            </div>
          ) : isLoggedIn === true ? (
            match.stream_url ? (
              <>
                <HlsPlayer
                  src={match.stream_url}
                  poster={match.thumbnail_url || undefined}
                  className="w-full h-full object-contain bg-black"
                />
                {/* Branding overlay — top right */}
                <div
                  className="absolute top-3 right-3 z-20 pointer-events-none select-none px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10"
                  style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
                >
                  <span className="text-white font-black text-sm tracking-widest">
                    NETWORK<span className="text-[#08A045]">K</span>
                  </span>
                </div>
                {match.status === 'live' && (
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/90 backdrop-blur-md">
                    <Radio className="w-3 h-3 text-white animate-pulse" />
                    <span className="text-white text-xs font-bold tracking-wider">LIVE</span>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
                لا يوجد رابط بث متاح حالياً
              </div>
            )
          ) : null}
        </div>

        {/* Meta */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/40">{match.league || '—'}</div>
            <Badge
              variant="outline"
              className={
                match.status === 'live'
                  ? 'border-red-500/40 text-red-400 bg-red-500/10'
                  : match.status === 'ended'
                  ? 'border-white/20 text-white/40'
                  : 'border-[#08A045]/40 text-[#08A045] bg-[#08A045]/10'
              }
            >
              {match.status === 'live' ? 'مباشر الآن' : match.status === 'ended' ? 'انتهت' : 'قادمة'}
            </Badge>
          </div>
          <div className="text-xl font-bold">
            {match.home_team} <span className="text-white/30 mx-1">vs</span> {match.away_team}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-white/50">
            <Calendar className="w-4 h-4" />
            {new Date(match.start_time).toLocaleString('ar', { dateStyle: 'full', timeStyle: 'short' })}
          </div>
          {match.notes && (
            <p className="text-sm text-white/60 leading-relaxed pt-2 border-t border-white/[0.06]">{match.notes}</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default MatchDetails;
