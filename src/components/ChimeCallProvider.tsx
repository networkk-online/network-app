import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useChimeMeeting } from '@/hooks/useChimeMeeting';
import IncomingCall from '@/components/IncomingCall';
import OngoingCall from '@/components/OngoingCall';
import OutgoingCall from '@/components/OutgoingCall';
import { AnimatePresence } from 'framer-motion';

interface ChimeCallParticipant {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

interface ChimeCallContextType {
  isInitialized: boolean;
  isInCall: boolean;
  isConnecting: boolean;
  callType: 'voice' | 'video';
  participant: ChimeCallParticipant | null;
  startCall: (participant: ChimeCallParticipant, callType: 'voice' | 'video') => Promise<void>;
  acceptCall: (meetingId: string, attendeeInfo: any) => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => Promise<void>;
  isMuted: boolean;
  isVideoOff: boolean;
}

const ChimeCallContext = createContext<ChimeCallContextType | null>(null);

export const useChimeCall = () => {
  const context = useContext(ChimeCallContext);
  if (!context) {
    throw new Error('useChimeCall must be used within ChimeCallProvider');
  }
  return context;
};

interface ChimeCallProviderProps {
  children: ReactNode;
}

interface IncomingCallData {
  meetingId: string;
  callType: 'voice' | 'video';
  caller: ChimeCallParticipant;
  attendeeInfo: any;
}

export const ChimeCallProvider = ({ children }: ChimeCallProviderProps) => {
  const chimeMeeting = useChimeMeeting();
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);

  // Listen for incoming Chime calls
  useEffect(() => {
    const handleIncomingCall = (event: CustomEvent<IncomingCallData>) => {
      setIncomingCall(event.detail);
    };

    window.addEventListener('chime-incoming-call', handleIncomingCall as EventListener);
    return () => {
      window.removeEventListener('chime-incoming-call', handleIncomingCall as EventListener);
    };
  }, []);

  const handleAcceptCall = async () => {
    if (incomingCall) {
      await chimeMeeting.acceptCall(incomingCall.meetingId, incomingCall.attendeeInfo);
      setIncomingCall(null);
    }
  };

  const handleRejectCall = async () => {
    await chimeMeeting.rejectCall();
    setIncomingCall(null);
  };

  const handleDeclineWithMessage = async (message: string) => {
    console.log('Decline with message:', message);
    await handleRejectCall();
  };

  // Determine if we should show outgoing call screen
  const showOutgoing = chimeMeeting.isConnecting && !chimeMeeting.isInCall && !incomingCall;

  return (
    <ChimeCallContext.Provider
      value={{
        isInitialized: chimeMeeting.isInitialized,
        isInCall: chimeMeeting.isInCall,
        isConnecting: chimeMeeting.isConnecting,
        callType: chimeMeeting.callType,
        participant: chimeMeeting.participant,
        startCall: chimeMeeting.startCall,
        acceptCall: chimeMeeting.acceptCall,
        rejectCall: chimeMeeting.rejectCall,
        endCall: chimeMeeting.endCall,
        toggleMute: chimeMeeting.toggleMute,
        toggleVideo: chimeMeeting.toggleVideo,
        isMuted: chimeMeeting.isMuted,
        isVideoOff: chimeMeeting.isVideoOff,
      }}
    >
      {children}

      <AnimatePresence mode="wait">
        {/* Outgoing Call Screen */}
        {showOutgoing && chimeMeeting.participant && (
          <OutgoingCall
            key="outgoing"
            participant={chimeMeeting.participant}
            callType={chimeMeeting.callType}
            callStatus="ringing"
            onCancel={chimeMeeting.endCall}
          />
        )}

        {/* Incoming Call Screen */}
        {incomingCall && !chimeMeeting.isInCall && (
          <IncomingCall
            key="incoming"
            caller={incomingCall.caller}
            callType={incomingCall.callType}
            onAccept={handleAcceptCall}
            onDecline={handleRejectCall}
            onDeclineWithMessage={handleDeclineWithMessage}
          />
        )}

        {/* Ongoing Call Screen */}
        {chimeMeeting.isInCall && chimeMeeting.participant && chimeMeeting.startTime && (
          <OngoingCall
            key="ongoing"
            participant={chimeMeeting.participant}
            callType={chimeMeeting.callType}
            startTime={chimeMeeting.startTime}
            onEndCall={chimeMeeting.endCall}
            localStream={null}
            remoteStream={null}
          />
        )}
      </AnimatePresence>
    </ChimeCallContext.Provider>
  );
};
