import { createContext, useContext, ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAgoraCall } from '@/hooks/useAgoraCall';
import { IncomingCallScreen } from './IncomingCallScreen';
import { ActiveCallScreen } from './ActiveCallScreen';

type AgoraCallContextValue = ReturnType<typeof useAgoraCall>;

const AgoraCallContext = createContext<AgoraCallContextValue | null>(null);

export const useAgoraCallContext = () => {
  const ctx = useContext(AgoraCallContext);
  if (!ctx) throw new Error('useAgoraCallContext must be used inside <AgoraCallProvider>');
  return ctx;
};

export const AgoraCallProvider = ({ children }: { children: ReactNode }) => {
  const api = useAgoraCall();
  const { activeCall, remoteUsers, localVideoTrack, isMuted, isCameraOff, joining,
    permissionError, acceptCall, rejectCall, endCall, toggleMute, toggleCamera, flipCamera } = api;

  const showIncoming =
    activeCall && activeCall.direction === 'incoming' &&
    (activeCall.status === 'initiated' || activeCall.status === 'ringing');

  const showActive =
    activeCall && (
      activeCall.direction === 'outgoing' ||
      activeCall.status === 'accepted'
    ) && !showIncoming;

  return (
    <AgoraCallContext.Provider value={api}>
      {children}
      <AnimatePresence>
        {showIncoming && (
          <IncomingCallScreen
            key="incoming"
            peer={activeCall.peer}
            callType={activeCall.call_type}
            onAccept={acceptCall}
            onDecline={rejectCall}
          />
        )}
        {showActive && (
          <ActiveCallScreen
            key="active"
            call={activeCall}
            remoteUsers={remoteUsers}
            localVideoTrack={localVideoTrack as any}
            isMuted={isMuted}
            isCameraOff={isCameraOff}
            joining={joining}
            permissionError={permissionError}
            onToggleMute={toggleMute}
            onToggleCamera={toggleCamera}
            onFlipCamera={flipCamera}
            onEndCall={endCall}
          />
        )}
      </AnimatePresence>
    </AgoraCallContext.Provider>
  );
};
