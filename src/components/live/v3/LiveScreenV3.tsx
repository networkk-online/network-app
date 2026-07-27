import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Gift,
  Users,
  Share2,
  Shield,
  X,
  Send,
  Wifi,
  Camera,
  Mic,
  MicOff,
  VideoOff,
  Video,
  MoreHorizontal,
  Target,
  Trophy,
  Swords,
  Sparkles,
  Package,
  Radio,
  SwitchCamera,
} from 'lucide-react';
import { useAgoraRoom } from '@/hooks/useAgoraRoom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  CinematicGiftLayer,
  VIPEntranceLayer,
  ComboBanner,
  FlyingHeartsLayer,
  type CinematicGift,
  type VIPEntrance,
} from './effects';
import { PremiumGiftDrawer, type CatalogGift } from './PremiumGiftDrawer';
import { GuestSlots, type GuestLayout, type GuestSlot } from './GuestSlots';
import {
  MissionsSheet,
  LeaderboardSheet,
  ViewersSheet,
  PKBattlePanel,
  GoalsSheet,
  ModerationSheet,
  TreasureBoxSheet,
} from './panels';

interface LiveScreenV3Props {
  joinRoomId?: string;
  onClose: () => void;
}

interface LiveChatMsg {
  id: string;
  username: string;
  avatarUrl?: string;
  text: string;
  isSystem?: boolean;
  vipTier?: 'gold' | 'diamond' | 'legend';
}

export const LiveScreenV3 = ({ joinRoomId, onClose }: LiveScreenV3Props) => {
  const { toast } = useToast();
  const agora = useAgoraRoom();

  const [me, setMe] = useState<{ id: string; username: string; avatarUrl?: string } | null>(null);
  const [preLive, setPreLive] = useState(!joinRoomId);
  const [title, setTitle] = useState('');
  const [guestLayout, setGuestLayout] = useState<GuestLayout>(1);

  const [streamRowId, setStreamRowId] = useState<string | null>(null);
  const [hostInfo, setHostInfo] = useState<{
    id: string;
    username: string;
    avatarUrl?: string;
    isVerified?: boolean;
    verificationType?: 'gold' | 'blue' | 'gray' | null;
  } | null>(null);
  const [followingHost, setFollowingHost] = useState(false);

  const [chat, setChat] = useState<LiveChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const [giftDrawerOpen, setGiftDrawerOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [cinematicQueue, setCinematicQueue] = useState<CinematicGift[]>([]);
  const [vipQueue, setVipQueue] = useState<VIPEntrance[]>([]);
  const [comboCount, setComboCount] = useState(0);
  const [comboGiftEmoji, setComboGiftEmoji] = useState('🎁');
  const comboTimerRef = useRef<number | null>(null);
  const [heartPulse, setHeartPulse] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [guestSlots, setGuestSlots] = useState<GuestSlot[]>([]);

  const [openPanel, setOpenPanel] = useState<
    'missions' | 'leaderboard' | 'viewers' | 'pk' | 'goals' | 'moderation' | 'treasure' | null
  >(null);
  const [duration, setDuration] = useState(0);
  const startedAtRef = useRef<number>(0);

  // Video containers
  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRef = useRef<HTMLDivElement | null>(null);

  // ─── Load user + balance ────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', userData.user.id)
        .maybeSingle();
      if (profile) {
        setMe({ id: profile.id, username: profile.username || 'أنا', avatarUrl: profile.avatar_url || undefined });
      }
      const { data: gems } = await supabase
        .from('user_gems')
        .select('balance')
        .eq('user_id', userData.user.id)
        .maybeSingle();
      setBalance(Number(gems?.balance || 0));
    })();
  }, []);

  // ─── Viewer: resolve host from join room id ───────────
  useEffect(() => {
    if (!joinRoomId) return;
    (async () => {
      const { data: stream } = await supabase
        .from('live_streams')
        .select('id, host_id, title, channel_name, viewer_count')
        .eq('channel_name', joinRoomId)
        .eq('status', 'live')
        .maybeSingle();
      if (!stream) {
        toast({ title: 'البث غير متاح', description: 'انتهى البث أو الرابط غير صحيح', variant: 'destructive' });
        onClose();
        return;
      }
      setStreamRowId(stream.id);
      setTitle(stream.title || '');
      const { data: hostProfile } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, is_verified, verification_type')
        .eq('id', stream.host_id)
        .maybeSingle();
      if (hostProfile) {
        setHostInfo({
          id: hostProfile.id,
          username: hostProfile.username || 'مضيف',
          avatarUrl: hostProfile.avatar_url || undefined,
          isVerified: !!hostProfile.is_verified,
          verificationType: (hostProfile.verification_type as any) || null,
        });
      }
      if (me?.id) {
        const { data: follow } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', me.id)
          .eq('following_id', stream.host_id)
          .maybeSingle();
        setFollowingHost(!!follow);

        // Read viewer's VIP tier and broadcast entrance
        const { data: vip } = await supabase
          .from('live_vip_levels')
          .select('tier')
          .eq('user_id', me.id)
          .maybeSingle();
        const tier = (vip?.tier as any) || 'none';
        if (tier !== 'none' && ['gold', 'diamond', 'legend', 'platinum', 'royal', 'silver', 'bronze'].includes(tier)) {
          const mappedTier: any = ['platinum', 'royal'].includes(tier) ? 'diamond' : tier;
          // slight delay so channel is subscribed before broadcasting
          setTimeout(() => {
            supabase.channel(`live-chat-${stream.id}`).send({
              type: 'broadcast',
              event: 'entrance',
              payload: { id: `${Date.now()}`, username: me.username, tier: mappedTier, avatarUrl: me.avatarUrl },
            });
          }, 800);
        }
      }
      await agora.joinRoom(joinRoomId);
      startedAtRef.current = Date.now();
    })();
  }, [joinRoomId, me?.id]);

  // ─── Host: create stream row when going live ──────────
  const startHostStream = async () => {
    if (!me) return;
    if (!title.trim()) {
      toast({ title: 'أضف عنواناً للبث', variant: 'destructive' });
      return;
    }
    const channel = `live_${me.id.slice(0, 8)}_${Date.now()}`;
    setHostInfo({ id: me.id, username: me.username, avatarUrl: me.avatarUrl });
    try {
      await agora.createRoom(channel);
    } catch (e: any) {
      toast({ title: 'تعذر بدء البث', description: e?.message, variant: 'destructive' });
      return;
    }
    const { data: streamRow } = await supabase
      .from('live_streams')
      .insert({
        host_id: me.id,
        title: title.trim(),
        channel_name: channel,
        status: 'live',
        viewer_count: 0,
        last_heartbeat_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle();
    if (streamRow) setStreamRowId(streamRow.id);
    startedAtRef.current = Date.now();
    setPreLive(false);
  };

  // ─── Duration ticker + heartbeat ──────────────────────
  useEffect(() => {
    if (preLive) return;
    const iv = window.setInterval(() => {
      setDuration(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(iv);
  }, [preLive]);

  useEffect(() => {
    if (!streamRowId || !agora.isHost) return;
    const iv = window.setInterval(() => {
      supabase
        .from('live_streams')
        .update({ viewer_count: agora.viewerCount, last_heartbeat_at: new Date().toISOString() })
        .eq('id', streamRowId)
        .eq('status', 'live')
        .then();
    }, 15000);
    return () => window.clearInterval(iv);
  }, [streamRowId, agora.isHost, agora.viewerCount]);

  // ─── Attach local + remote video tracks ──────────────
  useEffect(() => {
    const local = agora.participants.find((p) => p.isLocal);
    const remote = agora.participants.find((p) => !p.isLocal);
    if (local?.videoTrack && localVideoRef.current) {
      try { local.videoTrack.play(localVideoRef.current); } catch {}
    }
    if (remote?.videoTrack && remoteVideoRef.current) {
      try { remote.videoTrack.play(remoteVideoRef.current); } catch {}
    }
    if (remote?.audioTrack) {
      try { remote.audioTrack.play(); } catch {}
    }
  }, [agora.participants]);

  // ─── Realtime chat via broadcast channel ─────────────
  useEffect(() => {
    if (!streamRowId) return;
    const ch = supabase
      .channel(`live-chat-${streamRowId}`)
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        setChat((prev) => [...prev.slice(-99), payload as LiveChatMsg]);
      })
      .on('broadcast', { event: 'like' }, () => {
        setLikeCount((c) => c + 1);
        setHeartPulse((n) => n + 1);
      })
      .on('broadcast', { event: 'gift' }, ({ payload }) => {
        const g = payload as CinematicGift;
        if (g.tier === 'super' || g.tier === 'legendary') {
          setCinematicQueue((q) => [...q, g]);
        }
        setComboGiftEmoji(g.emoji);
        setComboCount((c) => c + 1);
        if (comboTimerRef.current) window.clearTimeout(comboTimerRef.current);
        comboTimerRef.current = window.setTimeout(() => setComboCount(0), 2000);
      })
      .on('broadcast', { event: 'entrance' }, ({ payload }) => {
        setVipQueue((q) => [...q, payload as VIPEntrance]);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [streamRowId]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.length]);

  // ─── Guest slots realtime ────────────────────────────
  useEffect(() => {
    if (!streamRowId) return;
    const load = async () => {
      const { data } = await supabase
        .from('live_guest_slots')
        .select('*')
        .eq('stream_id', streamRowId)
        .order('slot_index');
      setGuestSlots((data || []) as any);
    };
    load();
    const ch = supabase
      .channel(`live-guests-${streamRowId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_guest_slots', filter: `stream_id=eq.${streamRowId}` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [streamRowId]);

  // ─── Actions ─────────────────────────────────────────
  const broadcast = useCallback(
    (event: string, payload: any) => {
      if (!streamRowId) return;
      supabase.channel(`live-chat-${streamRowId}`).send({ type: 'broadcast', event, payload });
    },
    [streamRowId],
  );

  const sendChat = () => {
    if (!chatInput.trim() || !me) return;
    const msg: LiveChatMsg = {
      id: `${Date.now()}-${Math.random()}`,
      username: me.username,
      avatarUrl: me.avatarUrl,
      text: chatInput.trim(),
    };
    setChat((prev) => [...prev.slice(-99), msg]);
    broadcast('chat', msg);
    setChatInput('');
  };

  const tapLike = () => {
    setLikeCount((c) => c + 1);
    setHeartPulse((n) => n + 1);
    broadcast('like', {});
    if (navigator.vibrate) navigator.vibrate(15);
    // Backend mission progress (throttled — 1 call per tap batch)
    if (streamRowId) {
      supabase.rpc('live_tap_like', { _stream_id: streamRowId, _amount: 1 }).then();
    }
  };

  const sendGift = async (gift: CatalogGift, quantity: number) => {
    if (!me || !hostInfo || !streamRowId) return;
    const totalCost = gift.price_coins * quantity;
    if (balance < totalCost) {
      toast({ title: 'رصيد غير كافٍ', description: 'قم بشحن العملات', variant: 'destructive' });
      return;
    }

    // Atomic backend call — debits gems, credits host, logs ledger, bumps goals/missions/VIP
    const { data, error } = await supabase.rpc('send_live_gift', {
      _stream_id: streamRowId,
      _gift_id: gift.id,
      _quantity: quantity,
    });

    if (error) {
      toast({ title: 'فشل إرسال الهدية', description: error.message, variant: 'destructive' });
      return;
    }
    const res = data as { success: boolean; error?: string; new_balance?: number; vip_tier?: string };
    if (!res?.success) {
      const map: Record<string, string> = {
        insufficient_coins: 'رصيد غير كافٍ',
        stream_not_live: 'انتهى البث',
        cannot_gift_self: 'لا يمكن إهداء نفسك',
        banned: 'أنت محظور من هذا البث',
        gift_not_found: 'الهدية غير متاحة',
        unauthenticated: 'يرجى تسجيل الدخول',
      };
      toast({ title: map[res?.error || ''] || 'فشل إرسال الهدية', variant: 'destructive' });
      return;
    }

    // Optimistic local balance sync from server truth
    if (typeof res.new_balance === 'number') setBalance(res.new_balance);

    const cinematic: CinematicGift = {
      id: `${Date.now()}`,
      giftId: gift.id,
      emoji: gift.emoji || '🎁',
      name: gift.name_ar || gift.name,
      senderName: me.username,
      tier: gift.tier,
    };
    broadcast('gift', cinematic);
    if (gift.tier === 'super' || gift.tier === 'legendary') {
      setCinematicQueue((q) => [...q, cinematic]);
    }
    setComboGiftEmoji(cinematic.emoji);
    setComboCount((c) => c + quantity);
    if (comboTimerRef.current) window.clearTimeout(comboTimerRef.current);
    comboTimerRef.current = window.setTimeout(() => setComboCount(0), 2000);

    setGiftDrawerOpen(false);
    toast({ title: 'تم إرسال الهدية', description: `${cinematic.name} × ${quantity}` });
  };


  const followHost = async () => {
    if (!me || !hostInfo || followingHost) return;
    setFollowingHost(true);
    await supabase.from('follows').insert({ follower_id: me.id, following_id: hostInfo.id });
    toast({ title: 'تمت المتابعة' });
  };

  const endLive = async () => {
    if (streamRowId && agora.isHost) {
      await supabase.from('live_streams').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', streamRowId);
      try {
        await supabase.from('live_summary').insert({
          stream_id: streamRowId,
          host_id: me?.id,
          duration_seconds: duration,
          peak_viewers: agora.viewerCount,
          total_likes: likeCount,
          total_gifts_coins: 0,
        } as any);
      } catch {}
    }
    await agora.leaveRoom();
    onClose();
  };

  const shareLive = async () => {
    const url = `${window.location.origin}/broadcast?join=${agora.channelName || joinRoomId}`;
    try {
      if ((navigator as any).share) await (navigator as any).share({ title: title || 'بث مباشر', url });
      else {
        await navigator.clipboard.writeText(url);
        toast({ title: 'تم نسخ الرابط' });
      }
    } catch {}
  };

  const connectionBar = useMemo(() => {
    const loss = agora.stats.packetLoss;
    if (loss < 2) return { color: 'hsl(var(--live-emerald))', label: 'ممتاز', bars: 4 };
    if (loss < 5) return { color: 'hsl(var(--vip-gold))', label: 'جيد', bars: 3 };
    if (loss < 10) return { color: 'hsl(30 90% 55%)', label: 'متوسط', bars: 2 };
    return { color: 'hsl(0 90% 55%)', label: 'ضعيف', bars: 1 };
  }, [agora.stats.packetLoss]);

  const formatDuration = (s: number) =>
    `${Math.floor(s / 3600).toString().padStart(2, '0')}:${Math.floor((s % 3600) / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const isHost = agora.isHost;

  // ─── Pre-live setup (host only) ──────────────────────
  if (preLive && !joinRoomId) {
    return (
      <div
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6"
        style={{
          background:
            'radial-gradient(ellipse at top, hsl(var(--live-emerald) / 0.15), transparent 50%), #000',
        }}
      >
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3" style={{ background: 'hsl(var(--live-emerald) / 0.15)', border: '1px solid hsl(var(--live-emerald) / 0.4)' }}>
              <Radio className="w-3.5 h-3.5" style={{ color: 'hsl(var(--live-emerald))' }} />
              <span className="text-xs font-bold" style={{ color: 'hsl(var(--live-emerald))' }}>بث جديد</span>
            </div>
            <h1 className="text-3xl font-bold text-white">جهّز بثك المباشر</h1>
            <p className="text-white/50 text-sm mt-1">أضف عنواناً واختر تخطيط الضيوف</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-white/60 uppercase tracking-wider">عنوان البث</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: مساء الخير — تعالوا نحكي!"
              maxLength={80}
              className="bg-white/[0.03] border-white/10 h-12 text-white placeholder:text-white/30 rounded-2xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-white/60 uppercase tracking-wider">تخطيط الضيوف</label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 4, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => setGuestLayout(n as GuestLayout)}
                  className={cn(
                    'aspect-square rounded-2xl border flex items-center justify-center text-white font-bold',
                    guestLayout === n ? 'bg-white text-black border-white' : 'bg-white/[0.03] border-white/10',
                  )}
                >
                  {n === 1 ? 'مضيف' : `+${n - 1}`}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={startHostStream}
            className="w-full h-14 rounded-2xl font-bold text-base"
            style={{ background: 'var(--gradient-emerald)', color: '#fff', boxShadow: '0 0 40px hsl(var(--live-emerald) / 0.5)' }}
          >
            <Radio className="w-5 h-5 mr-2" /> ابدأ البث
          </Button>

          <Button variant="ghost" onClick={onClose} className="w-full text-white/50 hover:text-white">
            إلغاء
          </Button>
        </motion.div>
      </div>
    );
  }

  // ─── Live screen ────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[60] bg-black overflow-hidden">
      {/* Video stage */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-black">
        {isHost ? (
          <div ref={localVideoRef} className="w-full h-full" />
        ) : (
          <div ref={remoteVideoRef} className="w-full h-full" />
        )}
        {/* Ambient gradient overlays for readability */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />
      </div>

      {/* Guest slots overlay (if layout > 1) */}
      {guestLayout > 1 && (
        <div className="absolute top-20 inset-x-3 h-40 z-10 pointer-events-auto">
          <GuestSlots
            layout={guestLayout}
            slots={guestSlots}
            isHost={isHost}
            onInvite={async (slotIndex) => {
              // Host approves the pending request at that slot, or opens viewers sheet
              const slot = guestSlots.find((s) => s.slot_index === slotIndex);
              if (slot?.status === 'requested' && streamRowId) {
                await supabase.rpc('live_approve_guest', { _stream_id: streamRowId, _slot_index: slotIndex });
                toast({ title: 'تم قبول الضيف' });
              } else {
                setOpenPanel('viewers');
              }
            }}
            onKick={async (slotIndex) => {
              if (!streamRowId) return;
              await supabase.rpc('live_kick_guest', { _stream_id: streamRowId, _slot_index: slotIndex });
            }}
            onToggleMute={async (slotIndex) => {
              if (!streamRowId) return;
              await supabase.rpc('live_toggle_mute_guest', { _stream_id: streamRowId, _slot_index: slotIndex });
            }}
          />
        </div>
      )}

      {/* ═══ TOP BAR ═══ */}
      <div className="absolute top-0 inset-x-0 z-30 p-3 pt-[calc(env(safe-area-inset-top,0px)+12px)]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <motion.div
              animate={{ boxShadow: ['0 0 0 0 hsl(var(--legendary-red) / 0)', '0 0 15px 4px hsl(var(--legendary-red) / 0.5)', '0 0 0 0 hsl(var(--legendary-red) / 0)'] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest text-white"
              style={{ background: 'hsl(var(--legendary-red))' }}
            >
              ● LIVE
            </motion.div>
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full pl-1 pr-3 py-1">
              <Avatar className="w-8 h-8 ring-1" style={{ borderColor: 'hsl(var(--live-emerald))' }}>
                <AvatarImage src={hostInfo?.avatarUrl} />
                <AvatarFallback className="bg-white/10 text-white text-xs">{hostInfo?.username?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-white truncate">{hostInfo?.username || 'مضيف'}</span>
                  {hostInfo?.isVerified && (
                    <span
                      className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px]"
                      style={{
                        background:
                          hostInfo.verificationType === 'gold'
                            ? 'hsl(var(--vip-gold))'
                            : hostInfo.verificationType === 'gray'
                            ? '#6b7280'
                            : '#3b82f6',
                        color: '#fff',
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-white/60">
                  <Users className="w-2.5 h-2.5" />
                  <span>{agora.viewerCount.toLocaleString()}</span>
                  <span className="opacity-40">·</span>
                  <span>{formatDuration(duration)}</span>
                </div>
              </div>
            </div>
            {!isHost && !followingHost && (
              <Button size="sm" onClick={followHost} className="h-7 px-3 text-[11px] rounded-full font-bold" style={{ background: 'var(--gradient-emerald)', color: '#fff' }}>
                متابعة
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Connection quality */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-xl border border-white/10" title={connectionBar.label}>
              <Wifi className="w-3 h-3" style={{ color: connectionBar.color }} />
              <span className="text-[10px] text-white/70">{agora.stats.bitrateKbps}k</span>
            </div>
            <Button variant="ghost" size="icon" onClick={shareLive} className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-xl border border-white/10">
              <Share2 className="w-3.5 h-3.5 text-white" />
            </Button>
            <Button variant="ghost" size="icon" onClick={endLive} className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-xl border border-white/10">
              <X className="w-3.5 h-3.5 text-white" />
            </Button>
          </div>
        </div>
      </div>

      {/* ═══ LEFT RAIL — engagement panels ═══ */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        {[
          { icon: Target, key: 'missions' as const, label: 'مهام' },
          { icon: Trophy, key: 'leaderboard' as const, label: 'متصدرون' },
          { icon: Swords, key: 'pk' as const, label: 'PK' },
          { icon: Package, key: 'treasure' as const, label: 'كنز' },
          { icon: Sparkles, key: 'goals' as const, label: 'أهداف' },
        ].map((it) => (
          <motion.button
            key={it.key}
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpenPanel(it.key)}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10"
            title={it.label}
          >
            <it.icon className="w-4 h-4" />
          </motion.button>
        ))}
      </div>

      {/* ═══ RIGHT RAIL — actions ═══ */}
      <div className="absolute right-3 bottom-32 z-20 flex flex-col items-center gap-2.5">
        <div className="flex flex-col items-center gap-0.5">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={tapLike}
            className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center"
          >
            <Heart className="w-5 h-5" fill="hsl(350 90% 55%)" stroke="hsl(350 90% 55%)" />
          </motion.button>
          <span className="text-[10px] text-white/70 font-semibold">{likeCount.toLocaleString()}</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => setGiftDrawerOpen(true)}
          className="w-11 h-11 rounded-full border flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--vip-gold)/0.25), hsl(var(--vip-gold)/0.05))',
            borderColor: 'hsl(var(--vip-gold) / 0.5)',
            boxShadow: '0 0 15px hsl(var(--vip-gold) / 0.4)',
          }}
        >
          <Gift className="w-5 h-5" style={{ color: 'hsl(var(--vip-gold))' }} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => setOpenPanel('viewers')}
          className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center"
        >
          <Users className="w-5 h-5 text-white" />
        </motion.button>
        {isHost && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setOpenPanel('moderation')}
            className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center"
          >
            <Shield className="w-5 h-5 text-white" />
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={shareLive}
          className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center"
        >
          <Share2 className="w-5 h-5 text-white" />
        </motion.button>
      </div>

      {/* ═══ HOST CONTROL BAR (bottom-left) ═══ */}
      {isHost && (
        <div className="absolute left-3 bottom-24 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-2 py-1.5">
          <Button size="icon" variant="ghost" onClick={agora.toggleMute} className="w-9 h-9 rounded-full">
            {agora.isMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-white" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={agora.toggleCamera} className="w-9 h-9 rounded-full">
            {agora.isCameraOff ? <VideoOff className="w-4 h-4 text-red-400" /> : <Video className="w-4 h-4 text-white" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={agora.switchCamera} className="w-9 h-9 rounded-full">
            <SwitchCamera className="w-4 h-4 text-white" />
          </Button>
          <div className="w-px h-6 bg-white/10" />
          <Button size="sm" onClick={endLive} className="h-9 rounded-full text-xs font-bold px-4 bg-red-500 hover:bg-red-600 text-white">
            إنهاء
          </Button>
        </div>
      )}

      {/* ═══ CHAT STREAM (bottom-left overlay) ═══ */}
      <div className="absolute left-3 right-20 bottom-16 max-h-[38%] z-10 pointer-events-none">
        <div className="flex flex-col justify-end h-full gap-1 overflow-y-auto no-scrollbar">
          {chat.slice(-25).map((m) => (
            <motion.div
              key={m.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="pointer-events-auto max-w-[85%]"
            >
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl backdrop-blur-md border"
                style={{
                  background: m.isSystem ? 'hsl(var(--live-emerald) / 0.15)' : 'rgba(0,0,0,0.5)',
                  borderColor: m.isSystem ? 'hsl(var(--live-emerald) / 0.4)' : 'rgba(255,255,255,0.08)',
                }}
              >
                <span
                  className="text-[11px] font-bold"
                  style={{ color: m.vipTier ? 'hsl(var(--vip-gold))' : m.isSystem ? 'hsl(var(--live-emerald))' : 'hsl(var(--live-emerald-glow))' }}
                >
                  {m.username}
                </span>
                <span className="text-[13px] text-white/90 break-words">{m.text}</span>
              </div>
            </motion.div>
          ))}
          <div ref={chatBottomRef} />
        </div>
      </div>

      {/* ═══ BOTTOM INPUT ═══ */}
      <div className="absolute inset-x-0 bottom-0 z-30 p-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full pl-4 pr-1 py-1">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendChat()}
            placeholder="اكتب رسالة..."
            className="bg-transparent border-0 text-white placeholder:text-white/40 h-9 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setGiftDrawerOpen(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
          >
            <Gift className="w-4 h-4" style={{ color: 'hsl(var(--vip-gold))' }} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={sendChat}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'var(--gradient-emerald)', boxShadow: '0 0 12px hsl(var(--live-emerald)/0.5)' }}
          >
            <Send className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      </div>

      {/* ═══ EFFECT LAYERS ═══ */}
      <FlyingHeartsLayer pulseKey={heartPulse} />
      <ComboBanner count={comboCount} giftEmoji={comboGiftEmoji} />
      <VIPEntranceLayer queue={vipQueue} onComplete={(id) => setVipQueue((q) => q.filter((x) => x.id !== id))} />
      <CinematicGiftLayer queue={cinematicQueue} onComplete={(id) => setCinematicQueue((q) => q.filter((x) => x.id !== id))} />

      {/* ═══ GIFT DRAWER ═══ */}
      <PremiumGiftDrawer
        open={giftDrawerOpen}
        onClose={() => setGiftDrawerOpen(false)}
        onSend={sendGift}
        balance={balance}
      />

      {/* ═══ PANELS ═══ */}
      <MissionsSheet open={openPanel === 'missions'} onClose={() => setOpenPanel(null)} />
      <LeaderboardSheet open={openPanel === 'leaderboard'} onClose={() => setOpenPanel(null)} />
      <ViewersSheet
        open={openPanel === 'viewers'}
        onClose={() => setOpenPanel(null)}
        isHost={isHost}
        viewers={agora.participants.filter((p) => !p.isLocal).map((p) => ({ uid: p.uid, username: `مشاهد ${String(p.uid).slice(0, 4)}` }))}
        onKick={async (uid) => {
          if (!streamRowId) return;
          const userId = typeof uid === 'string' ? uid : null;
          if (!userId) return;
          await supabase.rpc('live_ban_user', { _stream_id: streamRowId, _user_id: userId, _reason: 'kicked' });
          toast({ title: 'تم الطرد' });
        }}
        onMute={async (uid) => {
          const slot = guestSlots.find((s) => s.guest_user_id === String(uid));
          if (slot && streamRowId) await supabase.rpc('live_toggle_mute_guest', { _stream_id: streamRowId, _slot_index: slot.slot_index });
        }}
        onPromoteMod={async (uid) => {
          if (!streamRowId) return;
          const userId = typeof uid === 'string' ? uid : null;
          if (!userId) return;
          await supabase.rpc('live_grant_moderator', { _stream_id: streamRowId, _user_id: userId });
          toast({ title: 'تم منح صلاحية الإشراف' });
        }}
      />
      <PKBattlePanel
        open={openPanel === 'pk'}
        onClose={() => setOpenPanel(null)}
        hostScore={0}
        opponentScore={0}
        hostName={hostInfo?.username || 'مضيف'}
        opponentName="—"
        timeLeft={0}
      />
      <GoalsSheet open={openPanel === 'goals'} onClose={() => setOpenPanel(null)} isHost={isHost} streamId={streamRowId} hostId={hostInfo?.id || null} />
      <ModerationSheet open={openPanel === 'moderation'} onClose={() => setOpenPanel(null)} streamId={streamRowId} />
      <TreasureBoxSheet open={openPanel === 'treasure'} onClose={() => setOpenPanel(null)} isHost={isHost} streamId={streamRowId} hostId={hostInfo?.id || null} />
    </div>
  );
};

export default LiveScreenV3;
