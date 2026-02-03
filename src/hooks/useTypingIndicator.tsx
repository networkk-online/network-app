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

  // Clear typing status after timeout (2 seconds of no typing)
  const TYPING_TIMEOUT = 2000;
  const DEBOUNCE_DELAY = 300;

  // Broadcast typing status
  const broadcastTyping = useCallback(async (typing: boolean) => {
    if (!conversationId || !currentUserId) return;

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

  // Subscribe to typing events
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const channel = supabase.channel(`typing-${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
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
            setTypingUsers(prev => prev.filter(id => id !== userId));
          }, TYPING_TIMEOUT + 1000);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  return {
    typingUsers,
    isTyping,
    handleInputChange,
    stopTyping
  };
};
