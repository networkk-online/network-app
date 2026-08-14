import { useState, useCallback, useRef, useEffect } from 'react';
import type { DailyCall, DailyParticipant, DailyEventObjectParticipant } from '@daily-co/daily-js';
import { loadDaily } from '@/lib/lazySdk';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Participant {
  id: string;
  user_id: string;
  user_name: string;
  video: boolean;
  audio: boolean;
  isLocal: boolean;
  isOwner: boolean;
  videoTrack?: MediaStreamTrack;
  audioTrack?: MediaStreamTrack;
}

export function useDailyRoom() {
  const { toast } = useToast();
  const callRef = useRef<DailyCall | null>(null);
  const [isInRoom, setIsInRoom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mapParticipant = useCallback((p: DailyParticipant, isLocal: boolean): Participant => ({
    id: p.session_id,
    user_id: p.user_id || p.session_id,
    user_name: p.user_name || 'مشاهد',
    video: !!p.video,
    audio: !!p.audio,
    isLocal,
    isOwner: !!p.owner,
    videoTrack: p.tracks?.video?.persistentTrack || undefined,
    audioTrack: p.tracks?.audio?.persistentTrack || undefined,
  }), []);

  const updateParticipants = useCallback(() => {
    if (!callRef.current) return;
    const all = callRef.current.participants();
    const mapped: Participant[] = [];
    
    if (all.local) {
      mapped.push(mapParticipant(all.local, true));
    }
    
    Object.entries(all).forEach(([key, p]) => {
      if (key !== 'local') {
        mapped.push(mapParticipant(p, false));
      }
    });
    
    setParticipants(mapped);
    setViewerCount(mapped.length);
  }, [mapParticipant]);

  const createRoom = useCallback(async (title?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('daily-room', {
        body: { action: 'create', title },
      });
      if (fnError) throw fnError;

      const call = (await loadDaily()).createCallObject({
        audioSource: true,
        videoSource: true,
      });
      callRef.current = call;

      call.on('participant-joined', () => updateParticipants());
      call.on('participant-left', () => updateParticipants());
      call.on('participant-updated', () => updateParticipants());
      call.on('error', (e) => {
        console.error('Daily error:', e);
        setError('حدث خطأ في البث');
      });

      await call.join({ url: data.url, token: data.token });
      
      setRoomId(data.room.id);
      setIsInRoom(true);
      setIsHost(true);
      updateParticipants();
      
      return data.room;
    } catch (err: any) {
      console.error('Create room error:', err);
      setError(err.message);
      toast({ title: 'خطأ', description: 'تعذر إنشاء غرفة البث', variant: 'destructive' });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast, updateParticipants]);

  const joinRoom = useCallback(async (targetRoomId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('daily-room', {
        body: { action: 'join', roomId: targetRoomId },
      });
      if (fnError) throw fnError;

      const call = (await loadDaily()).createCallObject({
        audioSource: false,
        videoSource: false,
      });
      callRef.current = call;

      call.on('participant-joined', () => updateParticipants());
      call.on('participant-left', () => updateParticipants());
      call.on('participant-updated', () => updateParticipants());

      await call.join({ url: data.url, token: data.token });
      
      setRoomId(targetRoomId);
      setIsInRoom(true);
      setIsHost(false);
      setIsMuted(true);
      setIsCameraOff(true);
      updateParticipants();
    } catch (err: any) {
      console.error('Join room error:', err);
      setError(err.message);
      toast({ title: 'خطأ', description: 'تعذر الانضمام للبث', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast, updateParticipants]);

  const leaveRoom = useCallback(async () => {
    try {
      if (isHost && roomId) {
        await supabase.functions.invoke('daily-room', {
          body: { action: 'end', roomId },
        });
      }
      
      if (callRef.current) {
        await callRef.current.leave();
        callRef.current.destroy();
        callRef.current = null;
      }
      
      setIsInRoom(false);
      setRoomId(null);
      setParticipants([]);
      setViewerCount(0);
      setIsHost(false);
    } catch (err) {
      console.error('Leave room error:', err);
    }
  }, [isHost, roomId]);

  const toggleMute = useCallback(() => {
    if (!callRef.current) return;
    const newMuted = !isMuted;
    callRef.current.setLocalAudio(!newMuted);
    setIsMuted(newMuted);
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    if (!callRef.current) return;
    const newOff = !isCameraOff;
    callRef.current.setLocalVideo(!newOff);
    setIsCameraOff(newOff);
  }, [isCameraOff]);

  const switchCamera = useCallback(async () => {
    if (!callRef.current) return;
    try {
      const devices = await callRef.current.enumerateDevices();
      const videoDevices = devices?.devices?.filter((d: any) => d.kind === 'videoinput') || [];
      if (videoDevices.length > 1) {
        const currentDevice = callRef.current.getInputDevices?.();
        const currentVideoId = (currentDevice as any)?.camera?.deviceId;
        const nextDevice = videoDevices.find((d: any) => d.deviceId !== currentVideoId) || videoDevices[0];
        await callRef.current.setInputDevicesAsync({ videoDeviceId: nextDevice.deviceId });
      }
    } catch (err) {
      console.error('Switch camera error:', err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callRef.current) {
        callRef.current.leave();
        callRef.current.destroy();
      }
    };
  }, []);

  return {
    isInRoom,
    isLoading,
    isHost,
    roomId,
    participants,
    viewerCount,
    isMuted,
    isCameraOff,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleMute,
    toggleCamera,
    switchCamera,
  };
}
