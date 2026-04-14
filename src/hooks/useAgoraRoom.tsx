import { useState, useCallback, useRef, useEffect } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
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

export const useAgoraRoom = () => {
  const { toast } = useToast();
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoRef = useRef<ICameraVideoTrack | null>(null);

  const [isInRoom, setIsInRoom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [channelName, setChannelName] = useState<string | null>(null);
  const [participants, setParticipants] = useState<AgoraParticipant[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const getAgoraCredentials = async (channel: string) => {
    const { data, error } = await supabase.functions.invoke('agora-token', {
      body: { channelName: channel, uid: 0, role: 1 },
    });
    if (error || !data?.ok) {
      throw new Error(data?.error || error?.message || 'Failed to get Agora credentials');
    }
    return data;
  };

  const createRoom = useCallback(async (title?: string) => {
    setIsLoading(true);
    try {
      const channel = `network-live-${Date.now()}`;
      const creds = await getAgoraCredentials(channel);

      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      client.setClientRole('host');
      clientRef.current = client;

      // Event handlers
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

      await client.join(creds.appId, channel, creds.token, 0);

      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
        {},
        { encoderConfig: '720p_2' }
      );
      localAudioRef.current = audioTrack;
      localVideoRef.current = videoTrack;

      await client.publish([audioTrack, videoTrack]);

      setChannelName(channel);
      setIsHost(true);
      setIsInRoom(true);
      setViewerCount(0);

      updateParticipants(client);
      return channel;
    } catch (err: any) {
      console.error('Agora createRoom error:', err);
      toast({ title: 'خطأ في البث', description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const joinRoom = useCallback(async (channel: string) => {
    setIsLoading(true);
    try {
      const creds = await getAgoraCredentials(channel);

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

      await client.join(creds.appId, channel, creds.token, 0);

      setChannelName(channel);
      setIsHost(false);
      setIsInRoom(true);
      updateParticipants(client);
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
      // Get available cameras and switch
      const cameras = await AgoraRTC.getCameras();
      if (cameras.length > 1) {
        const currentLabel = localVideoRef.current.getMediaStreamTrack().label;
        const nextCamera = cameras.find(c => c.label !== currentLabel) || cameras[0];
        await localVideoRef.current.setDevice(nextCamera.deviceId);
      }
    }
  }, []);

  const updateParticipants = (client: IAgoraRTCClient) => {
    const remoteUsers = client.remoteUsers;
    const parts: AgoraParticipant[] = [];

    // Add local user if host
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

  // Cleanup on unmount
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
