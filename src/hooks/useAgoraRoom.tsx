import { useState, useCallback, useRef, useEffect } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
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

export const useAgoraRoom = () => {
  const { toast } = useToast();
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoRef = useRef<ICameraVideoTrack | null>(null);
  const statsIntervalRef = useRef<number | null>(null);

  const [isInRoom, setIsInRoom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [channelName, setChannelName] = useState<string | null>(null);
  const [participants, setParticipants] = useState<AgoraParticipant[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
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

  const createRoom = useCallback(async (title?: string) => {
    setIsLoading(true);
    try {
      // 1. Request camera/mic FIRST (preserves user gesture context)
      let audioTrack: IMicrophoneAudioTrack;
      let videoTrack: ICameraVideoTrack;
      try {
        [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
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

      // 2. Get credentials from edge function
      // 2. Network preflight + credentials
      await preflightGateway();
      const channel = `network-live-${Date.now()}`;
      const creds = await getAgoraCredentials(channel);
      if (!creds.appId) throw new Error('Missing Agora App ID');

      // 3. Create client and join
      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      client.setClientRole('host');
      clientRef.current = client;

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        updateParticipants(client);
      });
      client.on('user-unpublished', () => updateParticipants(client));
      client.on('user-joined', () => {
        setViewerCount(prev => prev + 1);
        updateParticipants(client);
      });
      client.on('user-left', () => {
        setViewerCount(prev => Math.max(0, prev - 1));
        updateParticipants(client);
      });

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
      toast({ title: 'خطأ في البث', description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const joinRoom = useCallback(async (channel: string) => {
    setIsLoading(true);
    try {
      await preflightGateway();
      const creds = await getAgoraCredentials(channel);
      if (!creds.appId) throw new Error('Missing Agora App ID');

      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      client.setClientRole('audience');
      clientRef.current = client;

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        updateParticipants(client);
      });
      client.on('user-unpublished', () => updateParticipants(client));
      client.on('user-joined', () => updateParticipants(client));
      client.on('user-left', () => updateParticipants(client));

      await client.join(String(creds.appId), channel, creds.token ?? null, Number(creds.uid) || 0);

      setChannelName(channel);
      setIsHost(false);
      setIsInRoom(true);
      updateParticipants(client);
      startStatsPolling(client);
    } catch (err: any) {
      console.error('Agora joinRoom error:', err);
      toast({ title: 'خطأ في الانضمام', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const leaveRoom = useCallback(async () => {
    localAudioRef.current?.close();
    localVideoRef.current?.close();
    localAudioRef.current = null;
    localVideoRef.current = null;

    if (clientRef.current) {
      await clientRef.current.leave();
      clientRef.current = null;
    }

    setIsInRoom(false);
    setIsHost(false);
    setChannelName(null);
    setParticipants([]);
    setViewerCount(0);
    setIsMuted(false);
    setIsCameraOff(false);
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
      const cameras = await AgoraRTC.getCameras();
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
  };
};
