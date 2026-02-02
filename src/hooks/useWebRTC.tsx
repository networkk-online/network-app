import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { webRTCService } from '@/services/webrtc';
import { toast } from '@/hooks/use-toast';

interface CallParticipant {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

interface WebRTCState {
  isInitialized: boolean;
  isInCall: boolean;
  isIncoming: boolean;
  callType: 'voice' | 'video';
  participant: CallParticipant | null;
  callId: string | null;
  startTime: Date | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionState: RTCPeerConnectionState | null;
  isMuted: boolean;
  isVideoOff: boolean;
}

export const useWebRTC = () => {
  const [state, setState] = useState<WebRTCState>({
    isInitialized: false,
    isInCall: false,
    isIncoming: false,
    callType: 'voice',
    participant: null,
    callId: null,
    startTime: null,
    localStream: null,
    remoteStream: null,
    connectionState: null,
    isMuted: false,
    isVideoOff: false,
  });

  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  // Initialize WebRTC service
  useEffect(() => {
    const initializeWebRTC = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await webRTCService.initialize(user.id);

      // Set up callbacks
      webRTCService.onLocalStream = (stream) => {
        setState(prev => ({ ...prev, localStream: stream }));
      };

      webRTCService.onRemoteStream = (stream) => {
        setState(prev => ({ ...prev, remoteStream: stream }));
      };

      webRTCService.onConnectionStateChange = (connectionState) => {
        setState(prev => ({ ...prev, connectionState }));
        
        if (connectionState === 'connected') {
          setState(prev => ({ ...prev, startTime: new Date() }));
        }
      };

      webRTCService.onCallEnded = () => {
        stopRingtone();
        setState(prev => ({
          ...prev,
          isInCall: false,
          isIncoming: false,
          participant: null,
          callId: null,
          startTime: null,
          localStream: null,
          remoteStream: null,
          connectionState: null,
          isMuted: false,
          isVideoOff: false,
        }));
      };

      webRTCService.onIncomingCall = async (callerId, callId, callType) => {
        // Fetch caller info
        const { data: callerProfile } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .eq('id', callerId)
          .single();

        if (callerProfile) {
          playRingtone();
          setState(prev => ({
            ...prev,
            isIncoming: true,
            callId,
            callType,
            participant: callerProfile as CallParticipant,
          }));
        }
      };

      setState(prev => ({ ...prev, isInitialized: true }));
    };

    initializeWebRTC();

    return () => {
      webRTCService.destroy();
    };
  }, []);

  const playRingtone = () => {
    try {
      ringtoneRef.current = new Audio('/ringtone.mp3');
      ringtoneRef.current.loop = true;
      ringtoneRef.current.play().catch(() => {
        // Audio autoplay blocked
      });
    } catch (error) {
      console.error('Error playing ringtone:', error);
    }
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current = null;
    }
  };

  const startCall = useCallback(async (participant: CallParticipant, callType: 'voice' | 'video') => {
    try {
      const callId = await webRTCService.startCall(participant.id, callType);
      
      setState(prev => ({
        ...prev,
        isInCall: true,
        isIncoming: false,
        callType,
        participant,
        callId,
      }));

      // Record call in history
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('call_history').insert({
          caller_id: user.id,
          receiver_id: participant.id,
          call_type: callType,
          status: 'calling',
        });

        // Get caller profile for notification
        const { data: callerProfile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();

        // Send push notification to receiver
        try {
          await supabase.functions.invoke('send-call-notification', {
            body: {
              receiverId: participant.id,
              callerId: user.id,
              callerName: callerProfile?.full_name || 'مستخدم',
              callerAvatar: callerProfile?.avatar_url,
              callType,
              callId,
            },
          });
        } catch (notifError) {
          console.log('Push notification not sent:', notifError);
        }
      }
    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في بدء المكالمة',
        variant: 'destructive',
      });
    }
  }, []);

  const acceptCall = useCallback(async () => {
    try {
      stopRingtone();
      await webRTCService.acceptCall(state.callType);
      
      setState(prev => ({
        ...prev,
        isInCall: true,
        isIncoming: false,
        startTime: new Date(),
      }));

      // Update call history
      const { data: { user } } = await supabase.auth.getUser();
      if (user && state.participant) {
        await supabase.from('call_history').insert({
          caller_id: state.participant.id,
          receiver_id: user.id,
          call_type: state.callType,
          status: 'answered',
        });
      }
    } catch (error) {
      console.error('Error accepting call:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في قبول المكالمة',
        variant: 'destructive',
      });
    }
  }, [state.callType, state.participant]);

  const rejectCall = useCallback(async () => {
    try {
      stopRingtone();
      await webRTCService.rejectCall();

      // Update call history
      const { data: { user } } = await supabase.auth.getUser();
      if (user && state.participant) {
        await supabase.from('call_history').insert({
          caller_id: state.participant.id,
          receiver_id: user.id,
          call_type: state.callType,
          status: 'declined',
        });
      }

      setState(prev => ({
        ...prev,
        isIncoming: false,
        participant: null,
        callId: null,
      }));
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  }, [state.callType, state.participant]);

  const endCall = useCallback(async () => {
    try {
      const duration = state.startTime 
        ? Math.floor((Date.now() - state.startTime.getTime()) / 1000) 
        : 0;

      await webRTCService.endCall();

      // Update call history with duration
      const { data: { user } } = await supabase.auth.getUser();
      if (user && state.participant && state.startTime) {
        await supabase
          .from('call_history')
          .update({
            ended_at: new Date().toISOString(),
            duration,
            status: 'answered',
          })
          .or(`and(caller_id.eq.${user.id},receiver_id.eq.${state.participant.id}),and(caller_id.eq.${state.participant.id},receiver_id.eq.${user.id})`)
          .is('ended_at', null);
      }

      setState(prev => ({
        ...prev,
        isInCall: false,
        isIncoming: false,
        participant: null,
        callId: null,
        startTime: null,
        localStream: null,
        remoteStream: null,
        connectionState: null,
        isMuted: false,
        isVideoOff: false,
      }));
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }, [state.startTime, state.participant]);

  const toggleMute = useCallback(() => {
    const isMuted = webRTCService.toggleMute();
    setState(prev => ({ ...prev, isMuted }));
    return isMuted;
  }, []);

  const toggleVideo = useCallback(() => {
    const isVideoOff = webRTCService.toggleVideo();
    setState(prev => ({ ...prev, isVideoOff }));
    return isVideoOff;
  }, []);

  const switchCamera = useCallback(async () => {
    await webRTCService.switchCamera();
  }, []);

  return {
    ...state,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
  };
};
