import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration,
  AudioVideoFacade,
  MeetingSessionStatus,
  MeetingSessionStatusCode,
} from 'amazon-chime-sdk-js';

interface ChimeMeetingState {
  isInitialized: boolean;
  isInCall: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  meetingId: string | null;
  callType: 'voice' | 'video';
  participant: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  startTime: Date | null;
}

export const useChimeMeeting = () => {
  const { toast } = useToast();
  const [state, setState] = useState<ChimeMeetingState>({
    isInitialized: true,
    isInCall: false,
    isConnecting: false,
    isMuted: false,
    isVideoOff: false,
    meetingId: null,
    callType: 'voice',
    participant: null,
    startTime: null,
  });

  const meetingSessionRef = useRef<DefaultMeetingSession | null>(null);
  const audioVideoRef = useRef<AudioVideoFacade | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  // Get current user on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        currentUserIdRef.current = user.id;
      }
    };
    getCurrentUser();
  }, []);

  // Listen for incoming calls
  useEffect(() => {
    if (!currentUserIdRef.current) return;

    const channel = supabase
      .channel('chime-calls')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signals',
          filter: `to_user_id=eq.${currentUserIdRef.current}`,
        },
        async (payload) => {
          const signal = payload.new as any;
          
          if (signal.signal_type === 'chime_offer') {
            // Incoming call
            const signalData = signal.signal_data as any;
            
            // Get caller info
            const { data: callerProfile } = await supabase
              .from('profiles')
              .select('id, username, full_name, avatar_url')
              .eq('id', signal.from_user_id)
              .single();

            if (callerProfile) {
              setState(prev => ({
                ...prev,
                isInCall: false,
                isConnecting: false,
                meetingId: signalData.meetingId,
                callType: signalData.callType,
                participant: {
                  id: callerProfile.id,
                  username: callerProfile.username || '',
                  full_name: callerProfile.full_name || '',
                  avatar_url: callerProfile.avatar_url,
                },
              }));

              // Trigger incoming call UI
              window.dispatchEvent(new CustomEvent('chime-incoming-call', {
                detail: {
                  meetingId: signalData.meetingId,
                  callType: signalData.callType,
                  caller: callerProfile,
                  attendeeInfo: signalData.attendeeInfo,
                }
              }));
            }
          } else if (signal.signal_type === 'rejected') {
            // Call was rejected
            toast({
              title: 'تم رفض المكالمة',
              description: 'المستخدم غير متاح حالياً',
              variant: 'destructive',
            });
            await endCall();
          } else if (signal.signal_type === 'ended') {
            // Call was ended by other party
            await endCall();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const startCall = useCallback(async (
    participant: { id: string; username: string; full_name: string; avatar_url: string | null },
    callType: 'voice' | 'video'
  ) => {
    if (!currentUserIdRef.current) {
      toast({
        title: 'خطأ',
        description: 'يجب تسجيل الدخول أولاً',
        variant: 'destructive',
      });
      return;
    }

    setState(prev => ({
      ...prev,
      isConnecting: true,
      callType,
      participant,
    }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      // Create Chime meeting via Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chime-meeting`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'create_meeting',
            callerId: currentUserIdRef.current,
            receiverId: participant.id,
            callType,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create meeting');
      }

      // Initialize Chime meeting session
      const logger = new ConsoleLogger('ChimeMeeting', LogLevel.WARN);
      const deviceController = new DefaultDeviceController(logger);

      const configuration = new MeetingSessionConfiguration(
        data.meeting,
        data.attendee
      );

      const meetingSession = new DefaultMeetingSession(
        configuration,
        logger,
        deviceController
      );

      meetingSessionRef.current = meetingSession;
      audioVideoRef.current = meetingSession.audioVideo;

      // Set up audio/video observers
      meetingSession.audioVideo.addObserver({
        audioVideoDidStart: () => {
          console.log('✅ Chime audio/video started');
          setState(prev => ({
            ...prev,
            isInCall: true,
            isConnecting: false,
            startTime: new Date(),
            meetingId: data.meeting.MeetingId,
          }));
        },
        audioVideoDidStop: (sessionStatus: MeetingSessionStatus) => {
          console.log('Chime audio/video stopped:', sessionStatus.statusCode());
          // Handle disconnection
          const statusCode = sessionStatus.statusCode();
          if (statusCode === MeetingSessionStatusCode.Left || 
              statusCode === MeetingSessionStatusCode.MeetingEnded) {
            endCall();
          }
        },
      });

      // Start audio/video
      const audioInputDevices = await meetingSession.audioVideo.listAudioInputDevices();
      if (audioInputDevices.length > 0) {
        await meetingSession.audioVideo.startAudioInput(audioInputDevices[0].deviceId);
      }

      const audioOutputDevices = await meetingSession.audioVideo.listAudioOutputDevices();
      if (audioOutputDevices.length > 0) {
        await meetingSession.audioVideo.chooseAudioOutput(audioOutputDevices[0].deviceId);
      }

      if (callType === 'video') {
        const videoInputDevices = await meetingSession.audioVideo.listVideoInputDevices();
        if (videoInputDevices.length > 0) {
          await meetingSession.audioVideo.startVideoInput(videoInputDevices[0].deviceId);
        }
      }

      meetingSession.audioVideo.start();

      if (callType === 'video') {
        meetingSession.audioVideo.startLocalVideoTile();
      }

      toast({
        title: 'جاري الاتصال...',
        description: `جاري الاتصال بـ ${participant.full_name || participant.username}`,
      });

    } catch (error: any) {
      console.error('Error starting Chime call:', error);
      toast({
        title: 'فشل بدء المكالمة',
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
      setState(prev => ({
        ...prev,
        isConnecting: false,
        participant: null,
      }));
    }
  }, [toast]);

  const acceptCall = useCallback(async (meetingId: string, attendeeInfo: any) => {
    setState(prev => ({ ...prev, isConnecting: true }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      // Join the meeting
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chime-meeting`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'join_meeting',
            meetingId,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to join meeting');
      }

      // Get meeting info
      const meetingInfo = {
        MeetingId: meetingId,
        MediaPlacement: attendeeInfo.MediaPlacement || {},
      };

      // Initialize Chime session
      const logger = new ConsoleLogger('ChimeMeeting', LogLevel.WARN);
      const deviceController = new DefaultDeviceController(logger);

      const configuration = new MeetingSessionConfiguration(
        meetingInfo,
        data.attendee
      );

      const meetingSession = new DefaultMeetingSession(
        configuration,
        logger,
        deviceController
      );

      meetingSessionRef.current = meetingSession;
      audioVideoRef.current = meetingSession.audioVideo;

      // Start audio
      const audioInputDevices = await meetingSession.audioVideo.listAudioInputDevices();
      if (audioInputDevices.length > 0) {
        await meetingSession.audioVideo.startAudioInput(audioInputDevices[0].deviceId);
      }

      const audioOutputDevices = await meetingSession.audioVideo.listAudioOutputDevices();
      if (audioOutputDevices.length > 0) {
        await meetingSession.audioVideo.chooseAudioOutput(audioOutputDevices[0].deviceId);
      }

      meetingSession.audioVideo.start();

      setState(prev => ({
        ...prev,
        isInCall: true,
        isConnecting: false,
        startTime: new Date(),
        meetingId,
      }));

    } catch (error: any) {
      console.error('Error accepting call:', error);
      toast({
        title: 'فشل قبول المكالمة',
        description: error.message,
        variant: 'destructive',
      });
      setState(prev => ({ ...prev, isConnecting: false }));
    }
  }, [toast]);

  const rejectCall = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chime-meeting`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'reject_call',
            meetingId: state.meetingId,
            callerId: state.participant?.id,
          }),
        }
      );

      setState(prev => ({
        ...prev,
        isInCall: false,
        isConnecting: false,
        meetingId: null,
        participant: null,
      }));

    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  }, [state.meetingId, state.participant]);

  const endCall = useCallback(async () => {
    try {
      // Stop Chime session
      if (audioVideoRef.current) {
        audioVideoRef.current.stop();
      }

      meetingSessionRef.current = null;
      audioVideoRef.current = null;

      // Notify server
      const { data: { session } } = await supabase.auth.getSession();
      if (session && state.meetingId) {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chime-meeting`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              action: 'end_meeting',
              meetingId: state.meetingId,
            }),
          }
        );
      }

      setState(prev => ({
        ...prev,
        isInCall: false,
        isConnecting: false,
        meetingId: null,
        participant: null,
        startTime: null,
        isMuted: false,
        isVideoOff: false,
      }));

    } catch (error) {
      console.error('Error ending call:', error);
    }
  }, [state.meetingId]);

  const toggleMute = useCallback(() => {
    if (audioVideoRef.current) {
      if (state.isMuted) {
        audioVideoRef.current.realtimeUnmuteLocalAudio();
      } else {
        audioVideoRef.current.realtimeMuteLocalAudio();
      }
      setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    }
  }, [state.isMuted]);

  const toggleVideo = useCallback(async () => {
    if (audioVideoRef.current) {
      if (state.isVideoOff) {
        const videoInputDevices = await audioVideoRef.current.listVideoInputDevices();
        if (videoInputDevices.length > 0) {
          await audioVideoRef.current.startVideoInput(videoInputDevices[0].deviceId);
          audioVideoRef.current.startLocalVideoTile();
        }
      } else {
        audioVideoRef.current.stopVideoInput();
        audioVideoRef.current.stopLocalVideoTile();
      }
      setState(prev => ({ ...prev, isVideoOff: !prev.isVideoOff }));
    }
  }, [state.isVideoOff]);

  return {
    ...state,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
};
