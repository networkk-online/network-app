import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import IncomingCall from '@/components/IncomingCall';
import OngoingCall from '@/components/OngoingCall';
import { AnimatePresence } from 'framer-motion';

interface CallParticipant {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

interface CallContextType {
  isInitialized: boolean;
  isInCall: boolean;
  isIncoming: boolean;
  callType: 'voice' | 'video';
  participant: CallParticipant | null;
  startCall: (participant: CallParticipant, callType: 'voice' | 'video') => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => boolean;
  toggleVideo: () => boolean;
  switchCamera: () => Promise<void>;
  isMuted: boolean;
  isVideoOff: boolean;
}

const CallContext = createContext<CallContextType | null>(null);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within CallProvider');
  }
  return context;
};

interface CallProviderProps {
  children: ReactNode;
}

export const CallProvider = ({ children }: CallProviderProps) => {
  // Initialize push notifications
  const { isRegistered: pushRegistered, token: pushToken } = usePushNotifications();

  const {
    isInitialized,
    isInCall,
    isIncoming,
    callType,
    participant,
    startTime,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
  } = useWebRTC();

  useEffect(() => {
    if (pushRegistered) {
      console.log('Push notifications registered, token:', pushToken?.substring(0, 20) + '...');
    }
  }, [pushRegistered, pushToken]);

  const handleAcceptVoice = async () => {
    await acceptCall();
  };

  const handleAcceptVideo = async () => {
    await acceptCall();
  };

  const handleDecline = async () => {
    await rejectCall();
  };

  const handleDeclineWithMessage = async (message: string) => {
    // Send message to caller via messaging system
    console.log('Decline with message:', message);
    await rejectCall();
  };

  return (
    <CallContext.Provider
      value={{
        isInitialized,
        isInCall,
        isIncoming,
        callType,
        participant,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        switchCamera,
        isMuted,
        isVideoOff,
      }}
    >
      {children}

      <AnimatePresence>
        {/* Incoming Call Screen */}
        {isIncoming && participant && !isInCall && (
          <IncomingCall
            caller={participant}
            callType={callType}
            onAccept={handleAcceptVoice}
            onDecline={handleDecline}
            onDeclineWithMessage={handleDeclineWithMessage}
          />
        )}

        {/* Ongoing Call Screen */}
        {isInCall && participant && startTime && (
          <OngoingCall
            participant={participant}
            callType={callType}
            startTime={startTime}
            onEndCall={endCall}
            localStream={localStream}
            remoteStream={remoteStream}
          />
        )}
      </AnimatePresence>
    </CallContext.Provider>
  );
};
