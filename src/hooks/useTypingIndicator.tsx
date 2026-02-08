import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TypingState {
  [conversationId: string]: {
    [userId: string]: {
      isTyping: boolean;
      timestamp: number;
    };
  };
}

export const useTypingIndicator = (conversationId?: string, currentUserId?: string) => {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const connectionStateRef = useRef<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Clear typing status after timeout (2 seconds of no typing)
  const TYPING_TIMEOUT = 2000;
  const DEBOUNCE_DELAY = 300;
  const RECONNECT_DELAY = 1000;

  // Broadcast typing status
  const broadcastTyping = useCallback(async (typing: boolean) => {
    if (!conversationId || !currentUserId) return;
    if (connectionStateRef.current !== 'connected') return;

    try {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: currentUserId,
          conversationId,
          isTyping: typing,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error('Error broadcasting typing status:', error);
    }
  }, [conversationId, currentUserId]);

  // Handle input change with debounce
  const handleInputChange = useCallback(() => {
    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set typing to true immediately
    if (!isTyping) {
      setIsTyping(true);
      broadcastTyping(true);
    }

    // Clear existing typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new typing timeout - will trigger stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      broadcastTyping(false);
    }, TYPING_TIMEOUT);
  }, [isTyping, broadcastTyping]);

  // Stop typing immediately (called when message is sent)
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    setIsTyping(false);
    broadcastTyping(false);
  }, [broadcastTyping]);

  // Subscribe to typing events with stable connection
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    let isUnmounting = false;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const setupChannel = () => {
      if (isUnmounting) return;
      
      connectionStateRef.current = 'connecting';
      
      const channel = supabase.channel(`typing-${conversationId}`, {
        config: {
          broadcast: {
            self: false // Don't receive own broadcasts
          },
          presence: {
            key: currentUserId
          }
        }
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (isUnmounting) return;
        
        const { userId, isTyping: userTyping, timestamp } = payload.payload;
        
        // Ignore own typing events
        if (userId === currentUserId) return;

        // Check if event is recent (within last 5 seconds)
        if (Date.now() - timestamp > 5000) return;

        setTypingUsers(prev => {
          if (userTyping) {
            return prev.includes(userId) ? prev : [...prev, userId];
          } else {
            return prev.filter(id => id !== userId);
          }
        });

        // Auto-remove after timeout
        if (userTyping) {
          setTimeout(() => {
            if (!isUnmounting) {
              setTypingUsers(prev => prev.filter(id => id !== userId));
            }
          }, TYPING_TIMEOUT + 1000);
        }
      })
      .subscribe((status) => {
        if (isUnmounting) return;
        
        if (status === 'SUBSCRIBED') {
          connectionStateRef.current = 'connected';
          reconnectAttemptsRef.current = 0;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          connectionStateRef.current = 'disconnected';
          
          // Attempt to reconnect with exponential backoff
          if (reconnectAttemptsRef.current < maxReconnectAttempts && !isUnmounting) {
            const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current);
            reconnectAttemptsRef.current++;
            
            reconnectTimeout = setTimeout(() => {
              if (!isUnmounting) {
                supabase.removeChannel(channel);
                setupChannel();
              }
            }, delay);
          }
        }
      });

      channelRef.current = channel;
    };

    setupChannel();

    return () => {
      isUnmounting = true;
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [conversationId, currentUserId]);

  return {
    typingUsers,
    isTyping,
    handleInputChange,
    stopTyping,
    isConnected: connectionStateRef.current === 'connected'
  };
};
