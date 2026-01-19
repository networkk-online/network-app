import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CallParticipant {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

interface CallSettings {
  voice_calls_enabled: boolean;
  video_calls_enabled: boolean;
  who_can_call: string;
  block_unverified: boolean;
  default_mic_muted: boolean;
  default_camera_off: boolean;
  noise_reduction: boolean;
  echo_cancellation: boolean;
}

interface CallState {
  isInCall: boolean;
  isIncoming: boolean;
  callType: 'voice' | 'video';
  participant: CallParticipant | null;
  startTime: Date | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

export const useCalls = () => {
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isIncoming: false,
    callType: 'voice',
    participant: null,
    startTime: null,
    localStream: null,
    remoteStream: null,
  });
  
  const [settings, setSettings] = useState<CallSettings | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

  // Load call settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('call_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setSettings({
          voice_calls_enabled: data.voice_calls_enabled ?? true,
          video_calls_enabled: data.video_calls_enabled ?? true,
          who_can_call: data.who_can_call ?? 'everyone',
          block_unverified: data.block_unverified ?? false,
          default_mic_muted: data.default_mic_muted ?? false,
          default_camera_off: data.default_camera_off ?? true,
          noise_reduction: data.noise_reduction ?? true,
          echo_cancellation: data.echo_cancellation ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading call settings:', error);
    }
  };

  // Check if user can receive calls from caller
  const canReceiveCallFrom = async (callerId: string): Promise<boolean> => {
    if (!settings) return true;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check if caller is blocked
    const { data: blocked } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', callerId)
      .single();

    if (blocked) return false;

    // Check if caller is muted
    const { data: muted } = await supabase
      .from('muted_callers')
      .select('id')
      .eq('user_id', user.id)
      .eq('muted_user_id', callerId)
      .single();

    if (muted) return false;

    // Check who_can_call setting
    switch (settings.who_can_call) {
      case 'nobody':
        return false;
      case 'friends':
        // Check if both follow each other
        const { data: follows } = await supabase
          .from('follows')
          .select('id')
          .or(`and(follower_id.eq.${user.id},following_id.eq.${callerId}),and(follower_id.eq.${callerId},following_id.eq.${user.id})`);
        return (follows?.length ?? 0) >= 2;
      case 'followers':
        // Check if caller follows the user
        const { data: follower } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', callerId)
          .eq('following_id', user.id)
          .single();
        return !!follower;
      default:
        return true;
    }
  };

  // Initialize media stream
  const initializeMediaStream = async (type: 'voice' | 'video'): Promise<MediaStream | null> => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: settings?.echo_cancellation ?? true,
          noiseSuppression: settings?.noise_reduction ?? true,
        },
        video: type === 'video' ? {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Apply default settings
      if (settings?.default_mic_muted) {
        stream.getAudioTracks().forEach(track => track.enabled = false);
      }
      if (settings?.default_camera_off && type === 'video') {
        stream.getVideoTracks().forEach(track => track.enabled = false);
      }

      return stream;
    } catch (error) {
      console.error('Error getting media stream:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في الوصول إلى الكاميرا أو المايكروفون',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Start outgoing call
  const startCall = useCallback(async (participant: CallParticipant, type: 'voice' | 'video') => {
    if (!settings) {
      await loadSettings();
    }

    if (type === 'voice' && !settings?.voice_calls_enabled) {
      toast({
        title: 'غير متاح',
        description: 'المكالمات الصوتية معطلة',
        variant: 'destructive',
      });
      return;
    }

    if (type === 'video' && !settings?.video_calls_enabled) {
      toast({
        title: 'غير متاح',
        description: 'مكالمات الفيديو معطلة',
        variant: 'destructive',
      });
      return;
    }

    const stream = await initializeMediaStream(type);
    if (!stream) return;

    // Record call in history
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('call_history').insert({
        caller_id: user.id,
        receiver_id: participant.id,
        call_type: type,
        status: 'answered',
      });
    }

    setCallState({
      isInCall: true,
      isIncoming: false,
      callType: type,
      participant,
      startTime: new Date(),
      localStream: stream,
      remoteStream: null,
    });

    // Here you would set up WebRTC connection
    // This is a simplified version - real implementation would need signaling server
  }, [settings]);

  // Handle incoming call
  const handleIncomingCall = useCallback(async (caller: CallParticipant, type: 'voice' | 'video') => {
    const canReceive = await canReceiveCallFrom(caller.id);
    if (!canReceive) {
      console.log('Call blocked based on settings');
      return;
    }

    setCallState({
      isInCall: false,
      isIncoming: true,
      callType: type,
      participant: caller,
      startTime: null,
      localStream: null,
      remoteStream: null,
    });
  }, [settings]);

  // Accept incoming call
  const acceptCall = useCallback(async (type: 'voice' | 'video') => {
    if (!callState.participant) return;

    const stream = await initializeMediaStream(type);
    if (!stream) return;

    // Record call in history
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('call_history').insert({
        caller_id: callState.participant.id,
        receiver_id: user.id,
        call_type: type,
        status: 'answered',
      });
    }

    setCallState(prev => ({
      ...prev,
      isInCall: true,
      isIncoming: false,
      callType: type,
      startTime: new Date(),
      localStream: stream,
    }));
  }, [callState.participant]);

  // Decline incoming call
  const declineCall = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && callState.participant) {
      await supabase.from('call_history').insert({
        caller_id: callState.participant.id,
        receiver_id: user.id,
        call_type: callState.callType,
        status: 'declined',
      });
    }

    // Clean up
    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => track.stop());
    }

    setCallState({
      isInCall: false,
      isIncoming: false,
      callType: 'voice',
      participant: null,
      startTime: null,
      localStream: null,
      remoteStream: null,
    });
  }, [callState]);

  // Decline with message
  const declineWithMessage = useCallback(async (message: string) => {
    await declineCall();
    
    // Send message to caller
    if (callState.participant) {
      // Here you would send a message via your messaging system
      console.log('Sending decline message:', message);
    }
  }, [callState.participant, declineCall]);

  // End call
  const endCall = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && callState.participant && callState.startTime) {
      const duration = Math.floor((Date.now() - callState.startTime.getTime()) / 1000);
      
      // Update call history with duration
      await supabase
        .from('call_history')
        .update({
          ended_at: new Date().toISOString(),
          duration,
        })
        .eq('caller_id', user.id)
        .eq('receiver_id', callState.participant.id)
        .is('ended_at', null);
    }

    // Clean up streams
    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => track.stop());
    }
    if (callState.remoteStream) {
      callState.remoteStream.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }

    setCallState({
      isInCall: false,
      isIncoming: false,
      callType: 'voice',
      participant: null,
      startTime: null,
      localStream: null,
      remoteStream: null,
    });
  }, [callState, peerConnection]);

  // Mute caller
  const muteCaller = useCallback(async (userId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('muted_callers').insert({
      user_id: user.id,
      muted_user_id: userId,
    });

    if (!error) {
      toast({
        title: 'تم الكتم',
        description: 'لن تستقبل مكالمات من هذا المستخدم',
      });
    }
  }, []);

  // Unmute caller
  const unmuteCaller = useCallback(async (userId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('muted_callers')
      .delete()
      .eq('user_id', user.id)
      .eq('muted_user_id', userId);

    toast({
      title: 'تم إلغاء الكتم',
      description: 'يمكن لهذا المستخدم الاتصال بك الآن',
    });
  }, []);

  // Get call history
  const getCallHistory = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('call_history')
      .select(`
        *,
        caller:profiles!call_history_caller_id_fkey(id, username, full_name, avatar_url),
        receiver:profiles!call_history_receiver_id_fkey(id, username, full_name, avatar_url)
      `)
      .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching call history:', error);
      return [];
    }

    return data || [];
  }, []);

  return {
    callState,
    settings,
    startCall,
    handleIncomingCall,
    acceptCall,
    declineCall,
    declineWithMessage,
    endCall,
    muteCaller,
    unmuteCaller,
    getCallHistory,
  };
};
