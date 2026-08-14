import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { loadAgora } from '@/lib/lazySdk';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AgoraParticipant {
  uid: number | string;
  videoTrack?: any;
  audioTrack?: any;
  isLocal: boolean;
}

export interface AgoraStats {
  bitrateKbps: number;
  fps: number;
  packetLoss: number; // percentage
  rtt: number; // ms
}

export type AgoraConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTING';

export const useAgoraRoom = () => {
  const { toast } = useToast();
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoRef = useRef<ICameraVideoTrack | null>(null);
  const statsIntervalRef = useRef<number | null>(null);
  const currentChannelRef = useRef<string | null>(null);
  const currentRoleRef = useRef<'host' | 'audience' | null>(null);

  const [isInRoom, setIsInRoom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [channelName, setChannelName] = useState<string | null>(null);
  const [participants, setParticipants] = useState<AgoraParticipant[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [connectionState, setConnectionState] = useState<AgoraConnectionState>('DISCONNECTED');
  const [stats, setStats] = useState<AgoraStats>({ bitrateKbps: 0, fps: 0, packetLoss: 0, rtt: 0 });

  const getAgoraCredentials = async (channel: string) => {
    const { data, error } = await supabase.functions.invoke('agora-token', {
      body: { channelName: channel, uid: 0, role: 1 },
    });
    if (error || !data?.ok) {
      throw new Error(data?.error || error?.message || 'Failed to get Agora credentials');
    }
    return data;
  };

  const preflightGateway = async () => {
    // Lightweight reachability check to Agora's web gateway. Fails fast on firewalls.
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      // no-cors so we don't fail on CORS — we only care that the network resolves
      await fetch('https://webrtc2-ap-web-1.agora.io/', { mode: 'no-cors', signal: ctrl.signal });
      clearTimeout(t);
    } catch {
      throw new Error('تعذر الوصول إلى خوادم البث. تحقق من اتصالك بالإنترنت أو الجدار الناري.');
    }
  };

  const startStatsPolling = (client: IAgoraRTCClient) => {
    if (statsIntervalRef.current) window.clearInterval(statsIntervalRef.current);
    statsIntervalRef.current = window.setInterval(() => {
      try {
        const rtc = client.getRTCStats();
        let bitrateKbps = 0;
        let fps = 0;
        let packetLoss = 0;

        if (localVideoRef.current) {
          const v = client.getLocalVideoStats() as any;
          bitrateKbps = Math.round((v.sendBitrate || 0) / 1000);
          fps = Math.round(v.sendFrameRate || 0);
        } else {
          const remote = client.getRemoteVideoStats() as any;
          const ids = Object.keys(remote || {});
          if (ids.length) {
            const first = remote[ids[0]];
            bitrateKbps = Math.round((first.receiveBitrate || 0) / 1000);
            fps = Math.round(first.receiveFrameRate || 0);
            packetLoss = Math.round((first.packetLossRate || 0) * 100);
          }
        }

        setStats({
          bitrateKbps,
          fps,
          packetLoss,
          rtt: Math.round((rtc as any).RTT || 0),
        });
      } catch {
        // ignore transient stats errors
      }
    }, 1500);
  };

  const stopStatsPolling = () => {
    if (statsIntervalRef.current) {
      window.clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
    setStats({ bitrateKbps: 0, fps: 0, packetLoss: 0, rtt: 0 });
  };

  const updateParticipants = (client: IAgoraRTCClient) => {
    const remoteUsers = client.remoteUsers;
    const parts: AgoraParticipant[] = [];

    if (localVideoRef.current) {
      parts.push({
        uid: 'local',
        videoTrack: localVideoRef.current,
        audioTrack: localAudioRef.current,
        isLocal: true,
      });
    }

    remoteUsers.forEach(user => {
      parts.push({
        uid: user.uid,
        videoTrack: user.videoTrack,
        audioTrack: user.audioTrack,
        isLocal: false,
      });
    });

    setParticipants(parts);
  };

  const attachClientHandlers = (client: IAgoraRTCClient, role: 'host' | 'audience') => {
    client.on('user-published', async (user, mediaType) => {
      try {
        await client.subscribe(user, mediaType);
      } catch (e) {
        // Ignore transient subscribe races (user unpublished before subscribe completed)
      }
      updateParticipants(client);
    });
    client.on('user-unpublished', () => updateParticipants(client));
    client.on('user-joined', () => {
      // NOTE: In 'live' mode, user-joined only fires for HOSTS joining, not audience.
      // Real viewer count is tracked via Supabase presence in LiveScreenV3.
      if (role === 'host') setViewerCount((prev) => prev + 1);
      updateParticipants(client);
    });
    client.on('user-left', () => {
      if (role === 'host') setViewerCount((prev) => Math.max(0, prev - 1));
      updateParticipants(client);
    });
    client.on('connection-state-change', (cur) => {
      setConnectionState(cur as AgoraConnectionState);
    });
    // Token renewal ~30s before expiry — critical for streams >1hr
    client.on('token-privilege-will-expire', async () => {
      try {
        const channel = currentChannelRef.current;
        if (!channel) return;
        const creds = await getAgoraCredentials(channel);
        if (creds?.token) {
          await client.renewToken(creds.token);
        }
      } catch (e) {
        console.warn('Agora token renewal failed', e);
      }
    });
    client.on('token-privilege-did-expire', async () => {
      // Full rejoin as last resort
      const channel = currentChannelRef.current;
      if (!channel) return;
      try {
        const creds = await getAgoraCredentials(channel);
        if (creds?.appId && creds?.token) {
          await client.join(String(creds.appId), channel, creds.token, Number(creds.uid) || 0);
        }
      } catch (e) {
        toast({ title: 'انقطع البث', description: 'يرجى إعادة الانضمام', variant: 'destructive' });
      }
    });
  };

  const createRoom = useCallback(async (title?: string) => {
    // Prevent concurrent createRoom calls that would leak a second client
    if (clientRef.current || isLoading) {
      return currentChannelRef.current;
    }
    setIsLoading(true);
    try {
      // 1. Request camera/mic FIRST (preserves user gesture context)
      let audioTrack: IMicrophoneAudioTrack;
      let videoTrack: ICameraVideoTrack;
      try {
        [audioTrack, videoTrack] = await (await loadAgora()).createMicrophoneAndCameraTracks(
          {},
          { encoderConfig: '720p_2' }
        );
      } catch (mediaErr: any) {
        const code = mediaErr?.code || mediaErr?.name || '';
        if (code === 'DEVICE_NOT_FOUND' || code === 'NotFoundError' || code === 'PERMISSION_DENIED' || code === 'NotAllowedError') {
          throw new Error('يرجى التأكد من توصيل الكاميرا والمايكروفون وإعطاء الصلاحية للمتصفح');
        }
        throw mediaErr;
      }
      localAudioRef.current = audioTrack;
      localVideoRef.current = videoTrack;

      // 2. Network preflight + credentials
      await preflightGateway();
      const channel = `network-live-${Date.now()}`;
      currentChannelRef.current = channel;
      currentRoleRef.current = 'host';
      const creds = await getAgoraCredentials(channel);
      if (!creds.appId) throw new Error('Missing Agora App ID');

      // 3. Create client and join
      const client = (await loadAgora()).createClient({ mode: 'live', codec: 'vp8' });
      client.setClientRole('host');
      clientRef.current = client;
      attachClientHandlers(client, 'host');

      // If certificate is enabled the edge function returns a token; in testing mode token is null.
      await client.join(String(creds.appId), channel, creds.token ?? null, Number(creds.uid) || 0);

      // 4. Publish tracks
      await client.publish([audioTrack, videoTrack]);

      setChannelName(channel);
      setIsHost(true);
      setIsInRoom(true);
      setViewerCount(0);
      updateParticipants(client);
      startStatsPolling(client);
      return channel;
    } catch (err: any) {
      console.error('Agora createRoom error:', err);
      // Clean up tracks on failure
      localAudioRef.current?.close();
      localVideoRef.current?.close();
      localAudioRef.current = null;
      localVideoRef.current = null;
      currentChannelRef.current = null;
      currentRoleRef.current = null;
      toast({ title: 'خطأ في البث', description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const joinRoom = useCallback(async (channel: string) => {
    // Idempotent: same channel + already in room = no-op
    if (clientRef.current && currentChannelRef.current === channel) return;
    // Different channel or leaked client: leave first
    if (clientRef.current) {
      try { await clientRef.current.leave(); } catch {}
      clientRef.current = null;
    }
    setIsLoading(true);
    try {
      await preflightGateway();
      currentChannelRef.current = channel;
      currentRoleRef.current = 'audience';
      const creds = await getAgoraCredentials(channel);
      if (!creds.appId) throw new Error('Missing Agora App ID');

      const client = (await loadAgora()).createClient({ mode: 'live', codec: 'vp8' });
      client.setClientRole('audience', { level: 1 } as any);
      clientRef.current = client;
      attachClientHandlers(client, 'audience');

      await client.join(String(creds.appId), channel, creds.token ?? null, Number(creds.uid) || 0);

      setChannelName(channel);
      setIsHost(false);
      setIsInRoom(true);
      updateParticipants(client);
      startStatsPolling(client);
    } catch (err: any) {
      console.error('Agora joinRoom error:', err);
      currentChannelRef.current = null;
      currentRoleRef.current = null;
      toast({ title: 'خطأ في الانضمام', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const leaveRoom = useCallback(async () => {
    stopStatsPolling();
    localAudioRef.current?.close();
    localVideoRef.current?.close();
    localAudioRef.current = null;
    localVideoRef.current = null;

    if (clientRef.current) {
      try { clientRef.current.removeAllListeners(); } catch {}
      try { await clientRef.current.leave(); } catch {}
      clientRef.current = null;
    }
    currentChannelRef.current = null;
    currentRoleRef.current = null;

    setIsInRoom(false);
    setIsHost(false);
    setChannelName(null);
    setParticipants([]);
    setViewerCount(0);
    setIsMuted(false);
    setIsCameraOff(false);
    setConnectionState('DISCONNECTED');
  }, []);

  const toggleMute = useCallback(async () => {
    if (localAudioRef.current) {
      const newState = !isMuted;
      await localAudioRef.current.setEnabled(!newState);
      setIsMuted(newState);
    }
  }, [isMuted]);

  const toggleCamera = useCallback(async () => {
    if (localVideoRef.current) {
      const newState = !isCameraOff;
      await localVideoRef.current.setEnabled(!newState);
      setIsCameraOff(newState);
    }
  }, [isCameraOff]);

  const switchCamera = useCallback(async () => {
    if (localVideoRef.current) {
      const cameras = await (await loadAgora()).getCameras();
      if (cameras.length > 1) {
        const currentLabel = localVideoRef.current.getMediaStreamTrack().label;
        const nextCamera = cameras.find(c => c.label !== currentLabel) || cameras[0];
        await localVideoRef.current.setDevice(nextCamera.deviceId);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      localAudioRef.current?.close();
      localVideoRef.current?.close();
      clientRef.current?.leave();
    };
  }, []);

  return {
    isInRoom,
    isLoading,
    isHost,
    channelName,
    participants,
    viewerCount,
    isMuted,
    isCameraOff,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleMute,
    toggleCamera,
    switchCamera,
    stats,
    connectionState,
  };
};
