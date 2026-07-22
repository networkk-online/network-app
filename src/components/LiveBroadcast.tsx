import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, X, RotateCcw, Loader2, Swords } from 'lucide-react';
import { DonationReplyDialog } from './DonationReplyDialog';
import { TikTokLiveOverlay } from './TikTokLiveOverlay';
import { AgoraVideoGrid } from './live/AgoraVideoGrid';
import { LiveStatsOverlay } from './live/LiveStatsOverlay';
import { LiveChatSidebar } from './live/LiveChatSidebar';
import { TieredGiftOverlay, giftTier, type TieredGiftEvent } from './live/TieredGiftOverlay';
import { HostTopBar, beautyFilterStyle } from './live/HostTopBar';
import { WatchTogetherPanel } from './live/WatchTogetherPanel';
import { WatchTogetherSyncedVideo } from './live/WatchTogetherSyncedVideo';
import { ModeratorPanel, type ModViewer } from './live/ModeratorPanel';
import { VSModeFrame } from './live/VSModeFrame';
import { useAgoraRoom } from '@/hooks/useAgoraRoom';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import type { LiveComment } from './live';
import { GrandGiftAnimationEngine, type GrandGift, type GrandGiftType } from './live/GrandGiftAnimation';
import { TermsConsentModal } from './legal/TermsConsentModal';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeText } from '@/lib/sanitize';

const PREMIUM_GIFT_TYPES = new Set<GrandGiftType>(['lion', 'whale', 'supercar', 'falcon']);


const GIFT_META: Record<string, { icon: string; name: string; price: number }> = {
  rose: { icon: '🌹', name: 'وردة', price: 1 },
  heart: { icon: '💖', name: 'قلب', price: 5 },
  star: { icon: '⭐', name: 'نجمة', price: 10 },
  crown: { icon: '👑', name: 'تاج', price: 50 },
  diamond: { icon: '💎', name: 'ماسة', price: 100 },
  lion: { icon: '🦁', name: 'أسد الملك', price: 500 },
  whale: { icon: '🐋', name: 'الحوت', price: 1000 },
  supercar: { icon: '🏎️', name: 'سوبركار', price: 2000 },
  falcon: { icon: '🦅', name: 'الصقر', price: 750 },

  rocket: { icon: '🚀', name: 'صاروخ', price: 500 },
  galaxy: { icon: '🌌', name: 'مجرة', price: 1000 },
};

interface LiveBroadcastProps {
  onClose: () => void;
  joinRoomId?: string;
}

const LiveBroadcast = ({ onClose, joinRoomId }: LiveBroadcastProps) => {
  const { toast } = useToast();
  const agora = useAgoraRoom();

  const [liveComments, setLiveComments] = useState<LiveComment[]>([
    { id: '1', username: 'سيف_العراق', message: 'يا هلا! 🔥', isVIP: true },
    { id: '2', username: 'نور123', message: 'شلون الحال؟' },
  ]);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [broadcastTitle, setBroadcastTitle] = useState('');

  // === Tiered gifts + session metrics ===
  const [tieredEvents, setTieredEvents] = useState<TieredGiftEvent[]>([]);
  const [grandGifts, setGrandGifts] = useState<GrandGift[]>([]);

  const [gemsCollected, setGemsCollected] = useState(0);
  const [startedAt, setStartedAt] = useState<number>(Date.now());
  const [beautyOn, setBeautyOn] = useState(false);
  const [vsMode, setVsMode] = useState(false);
  const [watchTogether, setWatchTogether] = useState<{ url: string | null; playing: boolean; t: number }>({
    url: null,
    playing: false,
    t: 0,
  });
  const [mutedUids, setMutedUids] = useState<Set<string>>(new Set());
  const [termsOpen, setTermsOpen] = useState(false);
  const [streamRowId, setStreamRowId] = useState<string | null>(null);
  const [resolvedJoinChannel, setResolvedJoinChannel] = useState<string | null>(null);
  const [hostUserId, setHostUserId] = useState<string | null>(null);
  const [hostProfile, setHostProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const isViewer = !!joinRoomId;
  const streamRowIdRef = useRef<string | null>(null);
  const isHostRef = useRef(false);

  useEffect(() => {
    streamRowIdRef.current = streamRowId;
  }, [streamRowId]);

  useEffect(() => {
    isHostRef.current = agora.isHost;
  }, [agora.isHost]);

  useEffect(() => {
    if (agora.isInRoom) setStartedAt(Date.now());
  }, [agora.isInRoom]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setHostUserId(data.user?.id ?? null));
  }, []);

  // Viewer: resolve host profile from live_streams by channel_name
  useEffect(() => {
    if (!joinRoomId) return;
    (async () => {
      const freshSince = new Date(Date.now() - 90_000).toISOString();
      let query = supabase
        .from('live_streams')
        .select('id, host_id, channel_name')
        .eq('status', 'live')
        .gt('last_heartbeat_at', freshSince);

      query = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(joinRoomId)
        ? query.eq('id', joinRoomId)
        : query.eq('channel_name', joinRoomId);

      const { data: stream } = await query.maybeSingle();
      if (!stream) return;
      setStreamRowId(stream.id);
      setResolvedJoinChannel(stream.channel_name);
      const { data: prof } = await supabase
        .from('profiles_public')
        .select('username, avatar_url')
        .eq('id', stream.host_id)
        .maybeSingle();
      if (prof) setHostProfile({ username: prof.username, avatar_url: prof.avatar_url });
    })();
  }, [joinRoomId]);

  // Listen for kill-switch on this stream
  useEffect(() => {
    if (!streamRowId) return;
    const ch = supabase
      .channel(`stream-${streamRowId}`)
      .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'live_streams', filter: `id=eq.${streamRowId}` },
          (p) => {
            const next = (p.new as any)?.status;
            if (next === 'killed') {
              toast({ title: '🛑 تم إيقاف البث من قبل الإدارة', variant: 'destructive' });
              agora.leaveRoom().finally(onClose);
            }
          })
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [streamRowId]);

  // Premium gift realtime channel — shared by host + viewers for FIFO 3D animations.
  const giftChannelKey = streamRowId || agora.channelName || null;
  const giftChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  useEffect(() => {
    if (!giftChannelKey) return;
    const ch = supabase.channel(`live-gifts-${giftChannelKey}`, {
      config: { broadcast: { self: false } },
    });
    ch.on('broadcast', { event: 'premium_gift' }, ({ payload }) => {
      const p = payload as { giftType?: GrandGiftType; senderName?: string; senderAvatar?: string; id?: string };
      if (!p?.giftType || !PREMIUM_GIFT_TYPES.has(p.giftType)) return;
      setGrandGifts(prev => [
        ...prev,
        {
          id: p.id || `${Date.now()}-${Math.random()}`,
          giftType: p.giftType!,
          senderName: p.senderName || 'ضيف',
          senderAvatar: p.senderAvatar,
        },
      ]);
    });
    ch.subscribe();
    giftChannelRef.current = ch;
    return () => {
      giftChannelRef.current = null;
      supabase.removeChannel(ch);
    };
  }, [giftChannelKey]);

  const completeGrandGift = (id: string) =>
    setGrandGifts(prev => prev.filter(g => g.id !== id));



  const handleGiftSent = async (giftId: string, amount: number) => {
    const meta = GIFT_META[giftId] || { icon: '🎁', name: 'هدية', price: 1 };
    const totalPrice = meta.price * amount;

    // Optimistic UI
    setGemsCollected(g => g + totalPrice);
    setTieredEvents(prev => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        giftId,
        icon: meta.icon,
        name: meta.name,
        price: totalPrice,
        sender: 'أنت',
        tier: giftTier(totalPrice),
      },
    ]);
    setLiveComments(prev => [
      ...prev,
      { id: Date.now().toString(), username: 'أنت', message: `أرسل ${meta.name} ${meta.icon}`, isVIP: true },
    ]);

    // Premium/luxury gifts trigger fullscreen 3D animation for everyone in the room.
    if (PREMIUM_GIFT_TYPES.has(giftId as GrandGiftType)) {
      const eventId = `${Date.now()}-${Math.random()}`;
      const senderName = 'أنت';
      // Local playback (self:false broadcast won't come back to us).
      setGrandGifts(prev => [
        ...prev,
        { id: eventId, giftType: giftId as GrandGiftType, senderName },
      ]);
      giftChannelRef.current?.send({
        type: 'broadcast',
        event: 'premium_gift',
        payload: { id: eventId, giftType: giftId, senderName },
      });
    }



    // Server-side authoritative ledger entry (only when there is a remote creator)
    const creator = agora.participants.find(p => !p.isLocal);
    if (!creator || agora.isHost) return; // hosts don't tip themselves
    try {
      const { error } = await supabase.functions.invoke('process-gift', {
        body: {
          creator_id: String(creator.uid), // best-effort: real mapping requires uid->user_id table
          gift_id: giftId,
          gift_name: meta.name,
          unit_price: meta.price,
          quantity: amount,
          channel_name: agora.channelName,
          stream_id: streamRowId,
        },
      });
      if (error) toast({ title: 'تعذّر تأكيد الهدية', description: error.message, variant: 'destructive' });
    } catch (e: any) {
      toast({ title: 'تعذّر إرسال الهدية', description: e?.message, variant: 'destructive' });
    }
  };

  const completeGift = (id: string) => setTieredEvents(prev => prev.filter(e => e.id !== id));

  const moderatorViewers: ModViewer[] = agora.participants
    .filter(p => !p.isLocal)
    .map(p => ({ uid: p.uid, username: `viewer_${String(p.uid).slice(-4)}`, isMuted: mutedUids.has(String(p.uid)) }));

  const handleKick = (uid: string | number) => {
    toast({ title: '🚫 تم طرد المشاهد', description: String(uid) });
    // Note: actual Agora kick requires a server-side privilege call; UI feedback only.
  };
  const handleMute = (uid: string | number) => {
    setMutedUids(prev => {
      const next = new Set(prev);
      const k = String(uid);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
    toast({ title: '🔇 تم تبديل حالة الكتم', description: String(uid) });
  };

  // === Local camera preview ===
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);
  const [previewActive, setPreviewActive] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!agora.isInRoom && !isViewer) {
      startPreview();
    }
    return () => stopPreview();
  }, [agora.isInRoom, isViewer]);

  const startPreview = async () => {
    try {
      setPreviewError(null);
      // Check device availability first
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCam = devices.some(d => d.kind === 'videoinput');
      const hasMic = devices.some(d => d.kind === 'audioinput');
      if (!hasCam || !hasMic) {
        throw Object.assign(new Error('NotFoundError'), { name: 'NotFoundError' });
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
        audio: true,
      });
      previewStreamRef.current = stream;
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
      }
      setPreviewActive(true);
    } catch (err: any) {
      const name = err?.name || '';
      if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') {
        setPreviewError('يرجى التأكد من توصيل الكاميرا والمايكروفون وإعطاء الصلاحية للمتصفح');
      } else if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setPreviewError('تم رفض الإذن. يرجى السماح بالوصول للكاميرا والمايكروفون من إعدادات المتصفح');
      } else {
        setPreviewError('تعذر الوصول للكاميرا. تأكد من السماح بالأذونات.');
      }
      setPreviewActive(false);
    }
  };

  const stopPreview = () => {
    previewStreamRef.current?.getTracks().forEach(t => t.stop());
    previewStreamRef.current = null;
    setPreviewActive(false);
  };

  useEffect(() => {
    const channelToJoin = resolvedJoinChannel || (/^network-live-/.test(joinRoomId || '') ? joinRoomId : null);
    if (channelToJoin && !agora.isInRoom && !agora.isLoading) {
      agora.joinRoom(channelToJoin);
    }
  }, [joinRoomId, resolvedJoinChannel, agora.isInRoom, agora.isLoading]);

  const handleSendLiveComment = (raw: string) => {
    const message = sanitizeText(raw, 500);
    if (!message) return;
    setLiveComments(prev => [
      ...prev,
      { id: Date.now().toString(), username: 'أنت', message, isHost: agora.isHost },
    ]);
  };

  const requestStart = () => setTermsOpen(true);

  const startBroadcast = async () => {
    stopPreview();
    const room = await agora.createRoom(broadcastTitle || 'بث مباشر');
    if (room) {
      toast({ title: '🔴 بدأ البث المباشر!' });
      // Register stream in the live_streams registry
      if (hostUserId) {
        const { data, error } = await supabase
          .from('live_streams')
          .insert({
            host_id: hostUserId,
            channel_name: room,
            title: broadcastTitle || 'بث مباشر',
            status: 'live',
            viewer_count: 0,
            last_heartbeat_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        if (!error && data) setStreamRowId(data.id);
      }
    }
  };

  const stopBroadcast = async () => {
    if (streamRowId && agora.isHost) {
      await supabase
        .from('live_streams')
        .update({ status: 'ended', ended_at: new Date().toISOString(), last_heartbeat_at: new Date().toISOString() })
        .eq('id', streamRowId);
    }
    await agora.leaveRoom();
    onClose();
  };

  // Keep the database live status fresh while the host is actively broadcasting.
  useEffect(() => {
    if (!streamRowId || !agora.isInRoom || !agora.isHost) return;

    const heartbeat = () => {
      supabase
        .from('live_streams')
        .update({ last_heartbeat_at: new Date().toISOString() })
        .eq('id', streamRowId)
        .eq('status', 'live')
        .then(() => undefined);
    };

    heartbeat();
    const interval = window.setInterval(heartbeat, 25_000);
    return () => window.clearInterval(interval);
  }, [streamRowId, agora.isInRoom, agora.isHost]);

  // If the host closes/navigates away without pressing End, clear the live flag immediately.
  useEffect(() => {
    return () => {
      const id = streamRowIdRef.current;
      if (!id || !isHostRef.current) return;
      supabase
        .from('live_streams')
        .update({ status: 'ended', ended_at: new Date().toISOString(), last_heartbeat_at: new Date().toISOString() })
        .eq('id', id)
        .then(() => undefined);
    };
  }, []);

  // Sync viewer count to live_streams
  useEffect(() => {
    if (!streamRowId || !agora.isHost) return;
    supabase.from('live_streams').update({ viewer_count: agora.viewerCount, last_heartbeat_at: new Date().toISOString() }).eq('id', streamRowId).eq('status', 'live');
  }, [agora.viewerCount, streamRowId, agora.isHost]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex"
    >
      <div className="relative flex-1 min-w-0">
        {agora.isInRoom ? (
          <>
            {/* Beauty filter wraps the video layer */}
            <div className="absolute inset-0" style={beautyOn ? beautyFilterStyle : undefined}>
              {vsMode ? (
                <VSModeFrame participants={agora.participants} onExit={() => setVsMode(false)} />
              ) : (
                <AgoraVideoGrid participants={agora.participants} />
              )}
              {/* Watch Together replaces main feed when active */}
              <WatchTogetherSyncedVideo state={watchTogether} channelName={agora.channelName} isHost={agora.isHost} />
            </div>

            {/* Host PiP bubble while Watch-Together is on */}
            {watchTogether.url && agora.isHost && (
              <div className="absolute bottom-28 right-4 z-30 w-28 h-40 rounded-2xl overflow-hidden border-2 border-[#39FF14] shadow-[0_0_20px_rgba(57,255,20,0.5)] bg-black">
                <AgoraVideoGrid participants={agora.participants.filter(p => p.isLocal)} />
              </div>
            )}

            <LiveStatsOverlay stats={agora.stats} />
            <LiveChatSidebar comments={liveComments} onSend={handleSendLiveComment} />

            {/* Tiered gift animations */}
            <TieredGiftOverlay events={tieredEvents} onComplete={completeGift} />

            {/* Host-only top bar + tools */}
            {agora.isHost && (
              <>
                <HostTopBar
                  startedAt={startedAt}
                  gemsCollected={gemsCollected}
                  beautyOn={beautyOn}
                  onToggleBeauty={() => setBeautyOn(b => !b)}
                  viewerCount={agora.viewerCount}
                />
                <WatchTogetherPanel
                  isHost
                  remoteState={watchTogether}
                  onChange={setWatchTogether}
                />
                <ModeratorPanel
                  isHost
                  channel={agora.channelName}
                  viewers={moderatorViewers}
                  onKick={handleKick}
                  onMute={handleMute}
                />
                <button
                  onClick={() => setVsMode(v => !v)}
                  className={`absolute top-40 right-3 z-40 w-10 h-10 rounded-full backdrop-blur-xl border flex items-center justify-center ${
                    vsMode
                      ? 'bg-[#39FF14]/20 border-[#39FF14]/60 text-[#39FF14]'
                      : 'bg-black/60 border-[#39FF14]/40 text-[#39FF14]'
                  }`}
                  title="VS Mode"
                >
                  <Swords className="w-4 h-4" />
                </button>
              </>
            )}

            <TikTokLiveOverlay
              streamerName={agora.isHost ? 'أنت' : (hostProfile?.username || 'المضيف')}
              streamerAvatar={agora.isHost ? undefined : (hostProfile?.avatar_url || undefined)}
              viewerCount={agora.viewerCount}
              onClose={stopBroadcast}
              onSendComment={handleSendLiveComment}
              onSendGift={agora.isHost ? undefined : handleGiftSent}
              comments={liveComments}
              isHost={agora.isHost}
            />
          </>
        ) : (
          <div className="w-full h-full relative overflow-hidden">
            {previewActive ? (
              <video
                ref={previewVideoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0d1a0f] to-[#0a0a0a]" />
            )}

            <div className="absolute inset-0 bg-black/40" />

            <div className="absolute inset-0 flex items-center justify-center z-10">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center px-6"
              >
                {previewError ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5 mx-auto max-w-sm bg-white/[0.05] backdrop-blur-xl border border-[#39FF14]/30 rounded-2xl p-5 shadow-[0_0_30px_rgba(57,255,20,0.15)]"
                  >
                    <p className="text-white text-sm mb-4 leading-relaxed">{previewError}</p>
                    <button
                      onClick={startPreview}
                      className="w-full py-2.5 rounded-xl bg-[#39FF14]/20 hover:bg-[#39FF14]/30 border border-[#39FF14]/50 text-[#39FF14] font-bold text-sm transition"
                    >
                      إعادة المحاولة
                    </button>
                  </motion.div>
                ) : previewActive ? (
                  <div className="flex items-center gap-2 mb-4 justify-center">
                    <div className="w-3 h-3 rounded-full bg-[#39FF14] animate-pulse shadow-[0_0_10px_#39FF14]" />
                    <span className="text-white/70 text-sm">الكاميرا جاهزة</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-4 justify-center">
                    <Loader2 className="w-4 h-4 text-white/60 animate-spin" />
                    <span className="text-white/60 text-sm">جاري تجهيز الكاميرا...</span>
                  </div>
                )}

                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(25,224,91,0)',
                      '0 0 40px 15px rgba(25,224,91,0.2)',
                      '0 0 0 0 rgba(25,224,91,0)',
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="w-24 h-24 bg-gradient-to-br from-[#19e05b] to-[#0f8a3a] rounded-full mx-auto mb-5 flex items-center justify-center"
                >
                  <Video className="w-12 h-12 text-black" />
                </motion.div>

                <h2 className="text-xl font-bold text-white mb-1">جاهز للبث المباشر؟</h2>
                <p className="text-white/40 text-sm mb-4">اضغط على "بدء البث" للانطلاق</p>

                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                  placeholder="عنوان البث (اختياري)..."
                  className="w-full max-w-xs bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-sm placeholder:text-white/30 outline-none focus:border-[#19e05b]/50 backdrop-blur-md"
                />
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Pre-live controls */}
      {!agora.isInRoom && (
        <>
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </Button>
            <h1 className="text-lg font-bold text-white">البث المباشر</h1>
            <div className="w-10" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent z-20">
            <div className="flex items-center justify-center gap-6">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={requestStart}
                disabled={agora.isLoading || !previewActive || !!previewError}
                className="w-20 h-20 bg-[#39FF14] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(57,255,20,0.5)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {agora.isLoading ? (
                  <Loader2 className="w-8 h-8 text-black animate-spin" />
                ) : (
                  <span className="text-black font-black text-lg">بدء</span>
                )}
              </motion.button>
            </div>
          </div>
        </>
      )}

      {/* Live controls */}
      {agora.isInRoom && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-4">
            {agora.isHost && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={agora.switchCamera}
                  className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/10"
                >
                  <RotateCcw className="w-5 h-5 text-white" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={agora.toggleCamera}
                  className={`w-11 h-11 rounded-full ${
                    agora.isCameraOff ? 'bg-red-500/60' : 'bg-black/50'
                  } backdrop-blur-md border border-white/10`}
                >
                  {agora.isCameraOff ? (
                    <VideoOff className="w-5 h-5 text-white" />
                  ) : (
                    <Video className="w-5 h-5 text-white" />
                  )}
                </Button>
              </>
            )}
            {agora.isHost ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={stopBroadcast}
                className="px-6 py-2.5 bg-red-500 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              >
                <span className="text-white font-bold">إنهاء البث</span>
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={stopBroadcast}
                className="px-6 py-2.5 bg-red-500/80 rounded-full"
              >
                <span className="text-white font-bold">مغادرة</span>
              </motion.button>
            )}
            {agora.isHost && (
              <Button
                variant="ghost"
                size="icon"
                onClick={agora.toggleMute}
                className={`w-11 h-11 rounded-full ${
                  agora.isMuted ? 'bg-red-500/60' : 'bg-black/50'
                } backdrop-blur-md border border-white/10`}
              >
                {agora.isMuted ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-white" />
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {selectedDonation && (
        <DonationReplyDialog
          isOpen={replyDialogOpen}
          onClose={() => {
            setReplyDialogOpen(false);
            setSelectedDonation(null);
          }}
          donation={selectedDonation}
        />
      )}

      <TermsConsentModal
        open={termsOpen}
        context="live_stream"
        onAccept={() => { setTermsOpen(false); startBroadcast(); }}
        onCancel={() => setTermsOpen(false)}
      />
    </motion.div>
  );
};

export default LiveBroadcast;
