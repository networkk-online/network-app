import { useCallback, useEffect, useRef, useState } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  ILocalVideoTrack,
} from 'agora-rtc-sdk-ng';
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

type PermissionError = 'denied' | 'unavailable' | null;

export const useAgoraCall = () => {
  const { toast } = useToast();
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoRef = useRef<ICameraVideoTrack | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [permissionError, setPermissionError] = useState<PermissionError>(null);
  const [joining, setJoining] = useState(false);

  // ---- Initialize: track current user + listen for incoming calls ----
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user || !mounted) return;
      currentUserIdRef.current = data.user.id;
      subscribeToIncoming(data.user.id);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user?.id ?? null;
      if (uid !== currentUserIdRef.current) {
        currentUserIdRef.current = uid;
        if (uid) subscribeToIncoming(uid);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      channelRef.current?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subscribeToIncoming = (userId: string) => {
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
          const row: any = payload.new;
          if (row.status !== 'initiated' && row.status !== 'ringing') return;
          // Fetch caller profile
          const { data: prof } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', row.caller_id)
            .maybeSingle();
          if (!prof) return;
          setActiveCall({
            id: row.id,
            caller_id: row.caller_id,
            receiver_id: row.receiver_id,
            call_type: row.call_type,
            channel_name: row.channel_name,
            status: 'ringing',
            peer: prof as CallPeer,
            direction: 'incoming',
          });
          // Mark as ringing
          await supabase
            .from('agora_calls')
            .update({ status: 'ringing' })
            .eq('id', row.id);
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
          const row: any = payload.new;
          setActiveCall((prev) => {
            if (!prev || prev.id !== row.id) return prev;
            return { ...prev, status: row.status as CallStatus };
          });
          if (row.status === 'accepted') {
            // Caller side: join the channel
            setActiveCall((prev) => {
              if (prev && prev.id === row.id && prev.direction === 'outgoing') {
                joinAgoraChannel(prev).catch(() => {});
              }
              return prev;
            });
          }
          if (
            row.status === 'rejected' ||
            row.status === 'ended' ||
            row.status === 'missed'
          ) {
            await teardownAgora();
            setTimeout(() => setActiveCall(null), 800);
          }
        }
      )
      .subscribe();
    channelRef.current = ch;
  };

  // ---- Agora token ----
  const getAgoraCreds = async (channel: string) => {
    const { data, error } = await supabase.functions.invoke('agora-token', {
      body: { channelName: channel, uid: 0, role: 1 },
    });
    if (error || !data?.ok) {
      throw new Error(data?.error || error?.message || 'Failed to get Agora token');
    }
    return data as { appId: string; token: string | null; uid: number };
  };

  // ---- Join Agora channel and publish tracks ----
  const joinAgoraChannel = useCallback(async (call: ActiveCall) => {
    if (clientRef.current) return;
    setJoining(true);
    setPermissionError(null);
    try {
      const creds = await getAgoraCreds(call.channel_name);
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        setRemoteUsers((prev) => {
          if (prev.find((u) => u.uid === user.uid)) return [...prev];
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

      await client.join(creds.appId, call.channel_name, creds.token ?? null, creds.uid || null);

      // Create local tracks based on call type
      try {
        const audio = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioRef.current = audio;
        await client.publish(audio);
      } catch (e: any) {
        setPermissionError(e?.code === 'PERMISSION_DENIED' ? 'denied' : 'unavailable');
        throw e;
      }

      if (call.call_type === 'video') {
        try {
          const video = await AgoraRTC.createCameraVideoTrack();
          localVideoRef.current = video;
          await client.publish(video);
        } catch (e: any) {
          setPermissionError(e?.code === 'PERMISSION_DENIED' ? 'denied' : 'unavailable');
          // Continue with audio-only
        }
      }
    } catch (err: any) {
      console.error('joinAgoraChannel error:', err);
      toast({
        title: 'تعذر الانضمام إلى المكالمة',
        description: err?.message || 'خطأ غير معروف',
        variant: 'destructive',
      });
      await teardownAgora();
      if (activeCall) await endCall();
    } finally {
      setJoining(false);
    }
  }, [activeCall, toast]);

  const teardownAgora = async () => {
    try {
      localAudioRef.current?.stop();
      localAudioRef.current?.close();
      localVideoRef.current?.stop();
      localVideoRef.current?.close();
      localAudioRef.current = null;
      localVideoRef.current = null;
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current.removeAllListeners();
        clientRef.current = null;
      }
      setRemoteUsers([]);
      setIsMuted(false);
      setIsCameraOff(false);
    } catch (e) {
      console.warn('teardown error:', e);
    }
  };

  // ---- Public API ----
  const startCall = useCallback(
    async (peer: CallPeer, callType: 'voice' | 'video') => {
      const uid = currentUserIdRef.current;
      if (!uid) {
        toast({ title: 'يجب تسجيل الدخول', variant: 'destructive' });
        return;
      }
      if (activeCall) {
        toast({ title: 'لديك مكالمة جارية بالفعل', variant: 'destructive' });
        return;
      }
      const channel = `call_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
      const { data, error } = await supabase
        .from('agora_calls')
        .insert({
          caller_id: uid,
          receiver_id: peer.id,
          call_type: callType,
          channel_name: channel,
          status: 'initiated',
        })
        .select()
        .single();
      if (error || !data) {
        toast({ title: 'تعذر بدء المكالمة', description: error?.message, variant: 'destructive' });
        return;
      }
      setActiveCall({
        id: data.id,
        caller_id: uid,
        receiver_id: peer.id,
        call_type: callType,
        channel_name: channel,
        status: 'initiated',
        peer,
        direction: 'outgoing',
      });
    },
    [activeCall, toast]
  );

  const acceptCall = useCallback(async () => {
    if (!activeCall || activeCall.direction !== 'incoming') return;
    await supabase
      .from('agora_calls')
      .update({ status: 'accepted', started_at: new Date().toISOString() })
      .eq('id', activeCall.id);
    setActiveCall((prev) => (prev ? { ...prev, status: 'accepted' } : prev));
    await joinAgoraChannel({ ...activeCall, status: 'accepted' });
  }, [activeCall, joinAgoraChannel]);

  const rejectCall = useCallback(async () => {
    if (!activeCall) return;
    await supabase
      .from('agora_calls')
      .update({
        status: 'rejected',
        ended_at: new Date().toISOString(),
        ended_by: currentUserIdRef.current,
      })
      .eq('id', activeCall.id);
    setActiveCall(null);
  }, [activeCall]);

  const endCall = useCallback(async () => {
    if (!activeCall) return;
    await supabase
      .from('agora_calls')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        ended_by: currentUserIdRef.current,
      })
      .eq('id', activeCall.id);
    await teardownAgora();
    setActiveCall(null);
  }, [activeCall]);

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
      const devices = await AgoraRTC.getCameras();
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
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    flipCamera,
  };
};
