import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  ILocalVideoTrack,
} from 'agora-rtc-sdk-ng';
import { loadAgora } from '@/lib/lazySdk';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type CallStatus =
  | 'idle'
  | 'initiated'
  | 'ringing'
  | 'accepted'
  | 'rejected'
  | 'ended'
  | 'missed';

export interface CallPeer {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

export interface ActiveCall {
  id: string;
  caller_id: string;
  receiver_id: string;
  call_type: 'voice' | 'video';
  channel_name: string;
  status: CallStatus;
  peer: CallPeer;
  direction: 'incoming' | 'outgoing';
}

export interface CallQuality {
  latency: number | null;
  bitrate: number | null;
  packetLoss: number | null;
  uplinkLevel: number | null;
  downlinkLevel: number | null;
  label: 'excellent' | 'good' | 'fair' | 'poor' | 'reconnecting';
}

type PermissionError = 'denied' | 'unavailable' | null;

type CallPreferences = {
  call_sound: boolean;
  vibration: boolean;
  push_notifications: boolean;
  in_app_notifications: boolean;
  default_mic_muted: boolean;
  default_camera_off: boolean;
};

const DEFAULT_PREFERENCES: CallPreferences = {
  call_sound: true,
  vibration: true,
  push_notifications: true,
  in_app_notifications: true,
  default_mic_muted: false,
  default_camera_off: true,
};

const DEFAULT_QUALITY: CallQuality = {
  latency: null,
  bitrate: null,
  packetLoss: null,
  uplinkLevel: null,
  downlinkLevel: null,
  label: 'good',
};

const RLS_POLICY_HELP = `CREATE POLICY "Participants can manage Agora calls"
ON public.agora_calls
FOR ALL
TO authenticated
USING (auth.uid() = caller_id OR auth.uid() = receiver_id)
WITH CHECK (auth.uid() = caller_id OR auth.uid() = receiver_id);`;

const isRlsError = (error: unknown) => {
  const message = String((error as { message?: string })?.message ?? error ?? '').toLowerCase();
  return message.includes('row-level security') || message.includes('rls') || message.includes('permission denied');
};

const classifyQuality = (latency: number | null, packetLoss: number | null, uplink?: number | null, downlink?: number | null): CallQuality['label'] => {
  const worstLevel = Math.max(uplink ?? 0, downlink ?? 0);
  if (worstLevel >= 5 || (latency ?? 0) > 500 || (packetLoss ?? 0) > 8) return 'poor';
  if (worstLevel >= 4 || (latency ?? 0) > 300 || (packetLoss ?? 0) > 4) return 'fair';
  if (worstLevel <= 2 && (latency ?? 0) < 120 && (packetLoss ?? 0) < 1) return 'excellent';
  return 'good';
};

export const useAgoraCall = () => {
  const { toast } = useToast();
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoRef = useRef<ICameraVideoTrack | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const activeCallRef = useRef<ActiveCall | null>(null);
  const qualityTimerRef = useRef<number | null>(null);
  const missedTimerRef = useRef<number | null>(null);
  const ringtoneOscillatorRef = useRef<OscillatorNode | null>(null);
  const ringtoneGainRef = useRef<GainNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const joinAgoraChannelRef = useRef<((call: ActiveCall, reconnecting?: boolean) => Promise<void>) | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [activeCall, setActiveCallState] = useState<ActiveCall | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [permissionError, setPermissionError] = useState<PermissionError>(null);
  const [joining, setJoining] = useState(false);
  const [quality, setQuality] = useState<CallQuality>(DEFAULT_QUALITY);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<CallPreferences>(DEFAULT_PREFERENCES);

  const setActiveCall = useCallback((call: ActiveCall | null) => {
    activeCallRef.current = call;
    setActiveCallState(call);
  }, []);

  const syncRealtimeAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      (supabase.realtime as unknown as { setAuth?: (token: string) => void }).setAuth?.(session.access_token);
    }
    return session;
  }, []);

  const getAuthenticatedUser = useCallback(async () => {
    const session = await syncRealtimeAuth();
    if (session?.user?.id) return session.user;

    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (data.user?.id) return data.user;

    throw new Error('Must be logged in to call');
  }, [syncRealtimeAuth]);

  const loadPreferences = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('call_settings')
      .select('call_sound, vibration, push_notifications, in_app_notifications, default_mic_muted, default_camera_off')
      .eq('user_id', userId)
      .maybeSingle();

    const next = {
      call_sound: data?.call_sound ?? true,
      vibration: data?.vibration ?? true,
      push_notifications: data?.push_notifications ?? true,
      in_app_notifications: data?.in_app_notifications ?? true,
      default_mic_muted: data?.default_mic_muted ?? false,
      default_camera_off: data?.default_camera_off ?? true,
    };
    setPreferences(next);
    return next;
  }, []);

  const notifyDbError = useCallback((action: string, error: unknown) => {
    console.error(`[Agora calls] ${action} failed:`, error);
    if (isRlsError(error)) {
      console.error('[Agora calls] Required RLS policy:', RLS_POLICY_HELP);
      toast({
        title: 'صلاحيات المكالمة تحتاج تحديث',
        description: 'تم منع العملية بواسطة قواعد الأمان. تم تسجيل سياسة SQL المطلوبة في Console.',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'تعذر تحديث المكالمة',
      description: (error as { message?: string })?.message || 'حدث خطأ غير متوقع',
      variant: 'destructive',
    });
  }, [toast]);

  const stopIncomingAlerts = useCallback(() => {
    if (ringtoneOscillatorRef.current) {
      try { ringtoneOscillatorRef.current.stop(); } catch (_) { /* noop */ }
      ringtoneOscillatorRef.current.disconnect();
      ringtoneOscillatorRef.current = null;
    }
    ringtoneGainRef.current?.disconnect();
    ringtoneGainRef.current = null;
    if ('vibrate' in navigator) navigator.vibrate(0);
  }, []);

  const startIncomingAlerts = useCallback((peer: CallPeer, callType: 'voice' | 'video', prefs: CallPreferences) => {
    if (document.visibilityState !== 'visible' && prefs.push_notifications && 'Notification' in window) {
      const showNotification = () => {
        if (Notification.permission === 'granted') {
          new Notification(callType === 'video' ? 'Incoming video call' : 'Incoming voice call', {
            body: peer.full_name || peer.username || 'Network',
            icon: peer.avatar_url || '/favicon.ico',
            tag: `incoming-call-${peer.id}`,
            requireInteraction: true,
          });
        }
      };

      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') showNotification();
        });
      } else {
        showNotification();
      }
    }

    if (prefs.vibration && 'vibrate' in navigator) {
      navigator.vibrate([500, 250, 500, 800]);
    }

    if (prefs.call_sound) {
      try {
        const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtor) return;
        const ctx = audioContextRef.current ?? new AudioCtor();
        audioContextRef.current = ctx;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
        oscillator.connect(gain).connect(ctx.destination);
        oscillator.start();
        ringtoneOscillatorRef.current = oscillator;
        ringtoneGainRef.current = gain;
      } catch (error) {
        console.warn('[Agora calls] Ringtone could not start:', error);
      }
    }
  }, []);

  const updateCallStatus = useCallback(async (callId: string, values: Record<string, unknown>, action: string) => {
    try {
      const user = await getAuthenticatedUser();
      const { error } = await supabase
        .from('agora_calls')
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq('id', callId)
        .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`);
      if (error) throw error;
      return true;
    } catch (error) {
      notifyDbError(action, error);
      return false;
    }
  }, [getAuthenticatedUser, notifyDbError]);

  const teardownAgora = useCallback(async (resetUi = true) => {
    try {
      if (qualityTimerRef.current) {
        window.clearInterval(qualityTimerRef.current);
        qualityTimerRef.current = null;
      }
      localAudioRef.current?.stop();
      localAudioRef.current?.close();
      localVideoRef.current?.stop();
      localVideoRef.current?.close();
      localAudioRef.current = null;
      localVideoRef.current = null;
      if (clientRef.current) {
        await clientRef.current.leave().catch(() => undefined);
        clientRef.current.removeAllListeners();
        clientRef.current = null;
      }
      setRemoteUsers([]);
      setQuality(DEFAULT_QUALITY);
      setConnectionMessage(null);
      reconnectAttemptsRef.current = 0;
      if (resetUi) {
        setIsMuted(false);
        setIsCameraOff(false);
      }
    } catch (e) {
      console.warn('teardown error:', e);
    }
  }, []);

  const subscribeToIncoming = useCallback((userId: string) => {
    channelRef.current?.unsubscribe();
    const ch = supabase
      .channel(`agora_calls:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agora_calls',
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload) => {
          const row = payload.new as any;
          if (row.status !== 'initiated' && row.status !== 'ringing') return;
          if (activeCallRef.current) return;

          const { data: prof } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', row.caller_id)
            .maybeSingle();
          if (!prof) return;

          const incomingCall: ActiveCall = {
            id: row.id,
            caller_id: row.caller_id,
            receiver_id: row.receiver_id,
            call_type: row.call_type,
            channel_name: row.channel_name,
            status: 'ringing',
            peer: prof as CallPeer,
            direction: 'incoming',
          };

          const prefs = await loadPreferences(userId);
          setActiveCall(incomingCall);
          startIncomingAlerts(incomingCall.peer, incomingCall.call_type, prefs);
          await updateCallStatus(row.id, { status: 'ringing' }, 'mark ringing');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agora_calls',
        },
        async (payload) => {
          const row = payload.new as any;
          const prev = activeCallRef.current;
          if (!prev || prev.id !== row.id) return;

          const next = { ...prev, status: row.status as CallStatus };
          setActiveCall(next);

          if (row.status === 'accepted') {
            stopIncomingAlerts();
            if (prev.direction === 'outgoing') {
              joinAgoraChannelRef.current?.(next).catch(() => undefined);
            }
          }

          if (row.status === 'rejected' || row.status === 'ended' || row.status === 'missed') {
            stopIncomingAlerts();
            await teardownAgora();
            window.setTimeout(() => setActiveCall(null), 600);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConnectionMessage(null);
        if (status === 'CHANNEL_ERROR') setConnectionMessage('تعذر الاتصال بإشارات المكالمات. يتم إعادة المحاولة...');
      });
    channelRef.current = ch;
  }, [loadPreferences, setActiveCall, startIncomingAlerts, stopIncomingAlerts, teardownAgora, updateCallStatus]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const session = await syncRealtimeAuth();
        const uid = session?.user?.id ?? null;
        if (!uid || !mounted) return;
        currentUserIdRef.current = uid;
        setCurrentUserId(uid);
        await loadPreferences(uid);
        subscribeToIncoming(uid);
      } finally {
        if (mounted) setSessionLoading(false);
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user?.id ?? null;
      if (session?.access_token) {
        (supabase.realtime as unknown as { setAuth?: (token: string) => void }).setAuth?.(session.access_token);
      }
      currentUserIdRef.current = uid;
      setCurrentUserId(uid);
      if (uid) {
        loadPreferences(uid).catch(() => undefined);
        subscribeToIncoming(uid);
      } else {
        channelRef.current?.unsubscribe();
        setActiveCall(null);
      }
      setSessionLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      channelRef.current?.unsubscribe();
      stopIncomingAlerts();
      if (missedTimerRef.current) window.clearTimeout(missedTimerRef.current);
      teardownAgora();
    };
  }, [loadPreferences, setActiveCall, stopIncomingAlerts, subscribeToIncoming, syncRealtimeAuth, teardownAgora]);

  const getAgoraCreds = async (channel: string) => {
    const { data, error } = await supabase.functions.invoke('agora-token', {
      body: { channelName: channel, uid: 0, role: 1 },
    });
    if (error || !data?.ok) {
      throw new Error(data?.error || error?.message || 'Failed to get Agora token');
    }
    return data as { appId: string; token: string | null; uid: number };
  };

  const startQualityMonitor = useCallback((client: IAgoraRTCClient) => {
    if (qualityTimerRef.current) window.clearInterval(qualityTimerRef.current);
    qualityTimerRef.current = window.setInterval(() => {
      try {
        const stats = (client as any).getRTCStats?.() ?? {};
        const localVideoStats = (localVideoRef.current as any)?.getStats?.() ?? {};
        const localAudioStats = (localAudioRef.current as any)?.getStats?.() ?? {};
        const latency = Math.round(stats.RTT ?? stats.rtt ?? localVideoStats.RTT ?? localAudioStats.RTT ?? 0) || null;
        const sendBitrate = Number(stats.SendBitrate ?? stats.sendBitrate ?? localVideoStats.sendBitrate ?? localAudioStats.sendBitrate ?? 0);
        const recvBitrate = Number(stats.RecvBitrate ?? stats.recvBitrate ?? 0);
        const bitrate = Math.round(sendBitrate + recvBitrate) || null;
        const packetLoss = Number(
          localVideoStats.sendPacketsLostRate ??
          localAudioStats.sendPacketsLostRate ??
          stats.PacketLossRate ??
          stats.packetLossRate ??
          0
        );
        setQuality((prev) => ({
          ...prev,
          latency,
          bitrate,
          packetLoss: Number.isFinite(packetLoss) ? Math.round(packetLoss * 100) / 100 : null,
          label: classifyQuality(latency, packetLoss, prev.uplinkLevel, prev.downlinkLevel),
        }));
      } catch (error) {
        console.warn('[Agora calls] Quality stats unavailable:', error);
      }
    }, 2000);
  }, []);

  const joinAgoraChannel = useCallback(async (call: ActiveCall, reconnecting = false) => {
    if (clientRef.current && !reconnecting) return;
    setJoining(true);
    setPermissionError(null);
    setConnectionMessage(reconnecting ? 'جاري إعادة الاتصال بالمكالمة...' : null);
    try {
      const creds = await getAgoraCreds(call.channel_name);
      const client = (await loadAgora()).createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        setRemoteUsers((prev) => {
          if (prev.find((u) => u.uid === user.uid)) return prev.map((u) => (u.uid === user.uid ? user : u));
          return [...prev, user];
        });
        if (mediaType === 'audio') user.audioTrack?.play();
      });
      client.on('user-unpublished', (user) => {
        setRemoteUsers((prev) => prev.map((u) => (u.uid === user.uid ? user : u)));
      });
      client.on('user-left', (user) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });
      client.on('network-quality', (stats: any) => {
        const uplinkLevel = stats.uplinkNetworkQuality ?? null;
        const downlinkLevel = stats.downlinkNetworkQuality ?? null;
        setQuality((prev) => ({
          ...prev,
          uplinkLevel,
          downlinkLevel,
          label: classifyQuality(prev.latency, prev.packetLoss, uplinkLevel, downlinkLevel),
        }));
      });
      client.on('connection-state-change', async (curState, _prevState, reason) => {
        if (curState === 'CONNECTED') {
          reconnectAttemptsRef.current = 0;
          setConnectionMessage(null);
          setQuality((prev) => ({ ...prev, label: classifyQuality(prev.latency, prev.packetLoss, prev.uplinkLevel, prev.downlinkLevel) }));
        }
        if (curState === 'RECONNECTING') {
          setConnectionMessage('الشبكة ضعيفة — نحاول إعادة الاتصال تلقائياً...');
          setQuality((prev) => ({ ...prev, label: 'reconnecting' }));
        }
        if (curState === 'DISCONNECTED' && activeCallRef.current?.status === 'accepted' && reconnectAttemptsRef.current < 3) {
          reconnectAttemptsRef.current += 1;
          setConnectionMessage(`انقطع الاتصال — محاولة إعادة الاتصال ${reconnectAttemptsRef.current}/3...`);
          await teardownAgora(false);
          window.setTimeout(() => {
            const latest = activeCallRef.current;
            if (latest?.status === 'accepted') joinAgoraChannelRef.current?.(latest, true).catch(() => undefined);
          }, 1200 * reconnectAttemptsRef.current);
        }
        console.info('[Agora calls] connection-state-change', { curState, reason });
      });

      await client.join(creds.appId, call.channel_name, creds.token ?? null, creds.uid || null);

      try {
        const audio = await (await loadAgora()).createMicrophoneAudioTrack({
          encoderConfig: 'music_standard',
          AEC: true,
          ANS: true,
        });
        localAudioRef.current = audio;
        await audio.setMuted(preferences.default_mic_muted);
        setIsMuted(preferences.default_mic_muted);
        await client.publish(audio);
      } catch (e: any) {
        setPermissionError(e?.code === 'PERMISSION_DENIED' || e?.name === 'NotAllowedError' ? 'denied' : 'unavailable');
        throw e;
      }

      if (call.call_type === 'video') {
        try {
          const video = await (await loadAgora()).createCameraVideoTrack({
            encoderConfig: '720p_2',
            facingMode: 'user',
          });
          localVideoRef.current = video;
          await video.setMuted(preferences.default_camera_off);
          setIsCameraOff(preferences.default_camera_off);
          await client.publish(video);
        } catch (e: any) {
          setPermissionError(e?.code === 'PERMISSION_DENIED' || e?.name === 'NotAllowedError' ? 'denied' : 'unavailable');
        }
      }

      startQualityMonitor(client);
      setConnectionMessage(null);
    } catch (err: any) {
      console.error('joinAgoraChannel error:', err);
      toast({
        title: 'تعذر الانضمام إلى المكالمة',
        description: err?.message || 'خطأ غير معروف',
        variant: 'destructive',
      });
      await teardownAgora();
      if (activeCallRef.current && !reconnecting) {
        await updateCallStatus(activeCallRef.current.id, {
          status: 'ended',
          ended_at: new Date().toISOString(),
          ended_by: currentUserIdRef.current,
        }, 'end failed join');
      }
    } finally {
      setJoining(false);
    }
  }, [preferences.default_camera_off, preferences.default_mic_muted, startQualityMonitor, teardownAgora, toast, updateCallStatus]);

  useEffect(() => {
    joinAgoraChannelRef.current = joinAgoraChannel;
  }, [joinAgoraChannel]);

  const startCall = useCallback(
    async (peer: CallPeer, callType: 'voice' | 'video') => {
      if (activeCallRef.current) {
        toast({ title: 'لديك مكالمة جارية بالفعل', variant: 'destructive' });
        return;
      }

      let userId: string;
      try {
        const user = await getAuthenticatedUser();
        userId = user.id;
        currentUserIdRef.current = user.id;
        setCurrentUserId(user.id);
        await loadPreferences(user.id);
      } catch (error) {
        console.error('[Agora calls] Missing active session before call insert:', error);
        toast({ title: 'يجب تسجيل الدخول', description: 'أعد فتح التطبيق أو سجل الدخول مرة أخرى قبل بدء المكالمة.', variant: 'destructive' });
        return;
      }

      const channel = `call_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
      try {
        const { data, error } = await supabase
          .from('agora_calls')
          .insert({
            caller_id: userId,
            receiver_id: peer.id,
            call_type: callType,
            channel_name: channel,
            status: 'ringing',
          })
          .select()
          .single();
        if (error || !data) throw error ?? new Error('No call row returned');

        const outgoing: ActiveCall = {
          id: data.id,
          caller_id: userId,
          receiver_id: peer.id,
          call_type: callType,
          channel_name: channel,
          status: 'ringing',
          peer,
          direction: 'outgoing',
        };
        setActiveCall(outgoing);

        if (missedTimerRef.current) window.clearTimeout(missedTimerRef.current);
        missedTimerRef.current = window.setTimeout(() => {
          const latest = activeCallRef.current;
          if (latest?.id === outgoing.id && latest.status !== 'accepted') {
            updateCallStatus(outgoing.id, {
              status: 'missed',
              ended_at: new Date().toISOString(),
              ended_by: userId,
            }, 'mark missed').catch(() => undefined);
          }
        }, 45000);
      } catch (error) {
        notifyDbError('create call', error);
      }
    },
    [getAuthenticatedUser, loadPreferences, notifyDbError, setActiveCall, toast, updateCallStatus]
  );

  const acceptCall = useCallback(async () => {
    const call = activeCallRef.current;
    if (!call || call.direction !== 'incoming') return;
    stopIncomingAlerts();
    const ok = await updateCallStatus(call.id, { status: 'accepted', started_at: new Date().toISOString() }, 'accept call');
    if (!ok) return;
    const next = { ...call, status: 'accepted' as CallStatus };
    setActiveCall(next);
    await joinAgoraChannel(next);
  }, [joinAgoraChannel, setActiveCall, stopIncomingAlerts, updateCallStatus]);

  const rejectCall = useCallback(async () => {
    const call = activeCallRef.current;
    if (!call) return;
    stopIncomingAlerts();
    await updateCallStatus(call.id, {
      status: 'rejected',
      ended_at: new Date().toISOString(),
      ended_by: currentUserIdRef.current,
    }, 'reject call');
    setActiveCall(null);
  }, [setActiveCall, stopIncomingAlerts, updateCallStatus]);

  const endCall = useCallback(async () => {
    const call = activeCallRef.current;
    if (!call) return;
    stopIncomingAlerts();
    await updateCallStatus(call.id, {
      status: call.status === 'accepted' ? 'ended' : 'rejected',
      ended_at: new Date().toISOString(),
      ended_by: currentUserIdRef.current,
    }, 'end call');
    await teardownAgora();
    setActiveCall(null);
  }, [setActiveCall, stopIncomingAlerts, teardownAgora, updateCallStatus]);

  const toggleMute = useCallback(async () => {
    if (!localAudioRef.current) return;
    const next = !isMuted;
    await localAudioRef.current.setMuted(next);
    setIsMuted(next);
  }, [isMuted]);

  const toggleCamera = useCallback(async () => {
    if (!localVideoRef.current) return;
    const next = !isCameraOff;
    await localVideoRef.current.setMuted(next);
    setIsCameraOff(next);
  }, [isCameraOff]);

  const flipCamera = useCallback(async () => {
    if (!localVideoRef.current) return;
    try {
      const devices = await (await loadAgora()).getCameras();
      if (devices.length < 2) {
        toast({ title: 'كاميرا واحدة فقط متاحة' });
        return;
      }
      const current = (localVideoRef.current as any).getTrackLabel?.();
      const next = devices.find((d) => d.label !== current) ?? devices[0];
      await localVideoRef.current.setDevice(next.deviceId);
    } catch (e) {
      console.warn('flipCamera error', e);
    }
  }, [toast]);

  return {
    activeCall,
    remoteUsers,
    localVideoTrack: localVideoRef.current as ILocalVideoTrack | null,
    isMuted,
    isCameraOff,
    joining,
    permissionError,
    quality,
    connectionMessage,
    currentUserId,
    sessionLoading,
    isCallReady: !!currentUserId && !sessionLoading,
    preferences,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    flipCamera,
  };
};
