import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Search, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAgoraCallContext } from '@/components/calls/AgoraCallProvider';
import type { CallPeer } from '@/hooks/useAgoraCall';

type HistoryStatus = 'missed' | 'accepted' | 'rejected' | 'ended' | 'answered' | 'declined' | 'busy';

interface ProfileLite {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

interface CallRecord {
  id: string;
  caller_id: string;
  receiver_id: string;
  call_type: 'voice' | 'video';
  status: HistoryStatus;
  started_at: string;
  ended_at: string | null;
  duration: number | null;
  caller: ProfileLite;
  receiver: ProfileLite;
}

const fallbackProfile = (id: string): ProfileLite => ({ id, username: 'network', full_name: 'Network User', avatar_url: null });

const CallHistory = () => {
  const navigate = useNavigate();
  const { startCall, activeCall, isCallReady } = useAgoraCallContext();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'missed' | 'accepted' | 'rejected'>('all');

  useEffect(() => {
    loadCallHistory();
  }, []);

  const loadCallHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        navigate('/login');
        return;
      }
      setCurrentUserId(userId);

      const { data, error } = await supabase
        .from('call_history')
        .select('id, caller_id, receiver_id, call_type, status, started_at, ended_at, duration, created_at')
        .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const ids = Array.from(new Set((data || []).flatMap((call) => [call.caller_id, call.receiver_id])));
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', ids);

      const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile as ProfileLite]));
      setCalls((data || []).map((call) => ({
        id: call.id,
        caller_id: call.caller_id,
        receiver_id: call.receiver_id,
        call_type: call.call_type as 'voice' | 'video',
        status: call.status as HistoryStatus,
        started_at: call.started_at,
        ended_at: call.ended_at,
        duration: call.duration ?? 0,
        caller: profileMap.get(call.caller_id) ?? fallbackProfile(call.caller_id),
        receiver: profileMap.get(call.receiver_id) ?? fallbackProfile(call.receiver_id),
      })));
    } catch (error) {
      console.error('Error loading call history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number | null): string => {
    const safeSeconds = Math.max(0, seconds ?? 0);
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOtherUser = (call: CallRecord) => (call.caller_id === currentUserId ? call.receiver : call.caller);
  const isOutgoing = (call: CallRecord) => call.caller_id === currentUserId;
  const isMissedForMe = (call: CallRecord) => call.status === 'missed' && call.receiver_id === currentUserId;

  const filteredCalls = useMemo(() => calls.filter((call) => {
    const otherUser = getOtherUser(call);
    const normalizedStatus = call.status === 'ended' || call.status === 'answered' ? 'accepted' : call.status === 'declined' ? 'rejected' : call.status;
    const matchesSearch = `${otherUser.full_name || ''} ${otherUser.username || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'all') return matchesSearch;
    if (filter === 'missed') return matchesSearch && isMissedForMe(call);
    return matchesSearch && normalizedStatus === filter;
  }), [calls, currentUserId, filter, searchQuery]);

  const redial = (peer: CallPeer, type: 'voice' | 'video') => {
    if (!isCallReady || activeCall) return;
    startCall(peer, type);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground pb-24" dir="rtl">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">سجل المكالمات</h1>
              <p className="text-xs text-muted-foreground">الصوت والفيديو عبر Network Calls</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/settings/calls')} className="rounded-full border-primary/40 text-primary">
            الإعدادات
          </Button>
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-4 space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="بحث في المكالمات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-full border-border/70 bg-card/70 pr-10"
            />
          </div>
          <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
            <TabsList className="grid w-full grid-cols-4 rounded-full bg-card/70 p-1">
              <TabsTrigger value="all" className="rounded-full">الكل</TabsTrigger>
              <TabsTrigger value="missed" className="rounded-full">الفائتة</TabsTrigger>
              <TabsTrigger value="accepted" className="rounded-full">المقبولة</TabsTrigger>
              <TabsTrigger value="rejected" className="rounded-full">المرفوضة</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-5 space-y-3">
        {filteredCalls.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center px-6 py-16 text-center">
            <Phone className="h-12 w-12 text-primary/70" />
            <p className="mt-4 font-medium">لا توجد مكالمات</p>
            <p className="mt-1 text-sm text-muted-foreground">ستظهر المكالمات الصوتية والفيديو هنا تلقائياً.</p>
          </div>
        ) : (
          filteredCalls.map((call) => {
            const otherUser = getOtherUser(call);
            const outgoing = isOutgoing(call);
            const missed = isMissedForMe(call);
            const accepted = ['accepted', 'ended', 'answered'].includes(call.status);
            const rejected = ['rejected', 'declined', 'busy'].includes(call.status);
            const Icon = call.call_type === 'video' ? Video : Phone;

            return (
              <article key={call.id} className="glass-card p-4">
                <div className="relative z-[2] flex items-center gap-3">
                  <Avatar className="h-14 w-14 border border-border/80">
                    <AvatarImage src={otherUser.avatar_url || ''} className="object-cover" />
                    <AvatarFallback className="bg-secondary text-foreground">
                      {otherUser.full_name?.charAt(0) || otherUser.username?.charAt(0) || 'N'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className={`truncate font-semibold ${missed ? 'text-destructive' : 'text-foreground'}`}>
                        {otherUser.full_name || otherUser.username}
                      </h2>
                      {missed ? (
                        <PhoneMissed className="h-4 w-4 text-destructive" />
                      ) : outgoing ? (
                        <PhoneOutgoing className="h-4 w-4 text-primary" />
                      ) : (
                        <PhoneIncoming className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" />
                      <span>{outgoing ? 'صادرة' : 'واردة'}</span>
                      <span>•</span>
                      <span className={missed ? 'text-destructive' : accepted ? 'text-primary' : rejected ? 'text-muted-foreground' : ''}>
                        {missed ? 'فائتة' : accepted ? 'مقبولة' : rejected ? 'مرفوضة' : call.status}
                      </span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(call.started_at), { addSuffix: true, locale: ar })}</span>
                      {accepted && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDuration(call.duration)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!isCallReady || !!activeCall}
                    onClick={() => redial(otherUser, call.call_type)}
                    className="h-11 w-11 rounded-full border border-primary/40 bg-primary/10 text-primary shadow-[0_0_18px_hsl(var(--primary)/0.18)]"
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
};

export default CallHistory;
