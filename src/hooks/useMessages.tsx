import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MessageReaction {
  emoji: string;
  userId: string;
  username?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  is_read: boolean;
  deleted_for_sender?: boolean;
  deleted_for_receiver?: boolean;
  deleted_for_everyone?: boolean;
  reactions?: MessageReaction[];
  sender?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  participants?: any[];
  last_message?: Message;
  unread_count?: number;
  pinned_by?: string[];
  archived_by?: string[];
}

export const useMessages = (conversationId?: string) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [localReactions, setLocalReactions] = useState<Record<string, MessageReaction[]>>({});
  const [deletedMessages, setDeletedMessages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const callBackendFunction = async <T,>(path: string, body: unknown): Promise<T> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('يجب تسجيل الدخول');

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${path}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      }
    );

    const json = await res.json();
    if (!res.ok || json?.success === false) {
      throw new Error(json?.error || json?.details || 'حدث خطأ غير متوقع');
    }
    return json as T;
  };

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser]);

  useEffect(() => {
    if (conversationId && currentUser) {
      loadMessages(conversationId);
      subscribeToMessages(conversationId);
    }
  }, [conversationId, currentUser]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadConversations = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Get user's conversations
      const { data: participations, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUser.id);

      if (partError) throw partError;

      const conversationIds = participations?.map(p => p.conversation_id) || [];

      if (conversationIds.length === 0) {
        setConversations([]);
        return;
      }

      // Get conversation details (paginated — most recent 30 threads)
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false })
        .limit(30);

      if (convError) throw convError;

      const convIds = (convData || []).map(c => c.id);
      if (convIds.length === 0) {
        setConversations([]);
        return;
      }

      // --- Batched fetches (no N+1): 3 queries total instead of 3 per thread ---
      const [{ data: allParts }, { data: recentMsgs }, { data: unreadRows }] = await Promise.all([
        supabase
          .from('conversation_participants')
          .select('conversation_id, user_id')
          .in('conversation_id', convIds),
        supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey ( username, full_name, avatar_url )
          `)
          .in('conversation_id', convIds)
          .order('created_at', { ascending: false })
          .limit(convIds.length * 5),
        supabase
          .from('messages')
          .select('conversation_id')
          .in('conversation_id', convIds)
          .eq('is_read', false)
          .neq('sender_id', currentUser.id),
      ]);

      const otherIds = Array.from(new Set(
        (allParts || []).filter(p => p.user_id !== currentUser.id).map(p => p.user_id)
      ));

      let profileMap = new Map<string, any>();
      if (otherIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, is_verified')
          .in('id', otherIds);
        profileMap = new Map((profiles || []).map(p => [p.id, p]));
      }

      const lastMsgMap = new Map<string, any>();
      for (const m of recentMsgs || []) {
        if (!lastMsgMap.has(m.conversation_id)) lastMsgMap.set(m.conversation_id, m);
      }

      const unreadMap = new Map<string, number>();
      for (const r of unreadRows || []) {
        unreadMap.set(r.conversation_id, (unreadMap.get(r.conversation_id) || 0) + 1);
      }

      const partsByConv = new Map<string, string[]>();
      for (const p of allParts || []) {
        const arr = partsByConv.get(p.conversation_id) || [];
        arr.push(p.user_id);
        partsByConv.set(p.conversation_id, arr);
      }

      const conversationsWithDetails = (convData || []).map((conv) => ({
        ...conv,
        participants: (partsByConv.get(conv.id) || [])
          .filter(id => id !== currentUser.id)
          .map(id => profileMap.get(id))
          .filter(Boolean),
        last_message: lastMsgMap.get(conv.id) || null,
        unread_count: unreadMap.get(conv.id) || 0,
      }));

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('conversation_id', convId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetched newest-first for an indexed, bounded read; render oldest-first.
      setMessages((data || []).slice().reverse());

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', convId)
        .neq('sender_id', currentUser.id)
        .eq('is_read', false);

      // Update last_read_at so badge counts clear in Header/BottomNav
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', convId)
        .eq('user_id', currentUser.id);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToMessages = (convId: string) => {
    const channel = supabase
      .channel(`messages-${convId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${convId}`
        },
        async (payload) => {
          const { data: newMessage } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey (
                username,
                full_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (newMessage) {
            setMessages(prev => [...prev, newMessage]);
            
            // Mark as read if not from current user
            if (newMessage.sender_id !== currentUser?.id) {
              await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', newMessage.id);
              
              // Update last_read_at for badge clearing
              await supabase
                .from('conversation_participants')
                .update({ last_read_at: new Date().toISOString() })
                .eq('conversation_id', convId)
                .eq('user_id', currentUser.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Sync message to DynamoDB
  const syncMessageToDynamoDB = async (message: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-messages-dynamodb`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'sync_single',
            message: message
          }),
        }
      );

      const result = await response.json();
      if (!result.success) {
        console.warn('DynamoDB sync warning:', result.error);
      } else {
        console.log('✅ Message synced to DynamoDB:', message.id);
      }
    } catch (error) {
      console.error('DynamoDB sync error (non-blocking):', error);
      // Non-blocking - message is already saved in Supabase
    }
  };

  const sendMessage = async (
    convId: string,
    content: string | null,
    mediaFile?: File,
    settings?: { replyToId?: string }
  ) => {
    if (!currentUser) return null;

    try {
      let mediaUrl = null;
      let mediaType = null;

      // Upload media if provided (message-media is a PRIVATE bucket → use signed URL)
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('message-media')
          .upload(fileName, mediaFile, { contentType: mediaFile.type, upsert: false });

        if (uploadError) throw uploadError;

        // 1 year signed URL so recipients (participants per RLS) can render it
        const { data: signed, error: signErr } = await supabase.storage
          .from('message-media')
          .createSignedUrl(fileName, 60 * 60 * 24 * 365);
        if (signErr) throw signErr;

        mediaUrl = signed.signedUrl;
        mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';
      }

      // Send message to Supabase (primary storage)
      const insertData: any = {
        conversation_id: convId,
        sender_id: currentUser.id,
        content,
        media_url: mediaUrl,
        media_type: mediaType
      };
      if (settings?.replyToId) {
        insertData.reply_to_message_id = settings.replyToId;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Sync to DynamoDB in background (non-blocking)
      syncMessageToDynamoDB(data);

      return { success: true, data };
    } catch (error: any) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  };

  const createConversation = async (otherUserId: string) => {
    if (!currentUser) return null;

    try {
      // Check if conversation already exists
      const { data: existingParticipations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUser.id);

      if (existingParticipations) {
        for (const part of existingParticipations) {
          const { data: otherPart } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('conversation_id', part.conversation_id)
            .eq('user_id', otherUserId)
            .maybeSingle();

          if (otherPart) {
            return { success: true, conversationId: part.conversation_id };
          }
        }
      }

      // Create conversation via backend function (avoids client-side RLS edge cases)
      const result = await callBackendFunction<{ success: boolean; conversationId: string }>(
        'create-conversation',
        { otherUserId }
      );

      await loadConversations();

      return { success: true, conversationId: result.conversationId };
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      return { success: false, error: error.message };
    }
  };

  // Delete message handler
  const deleteMessage = useCallback(async (messageId: string, forEveryone: boolean) => {
    if (!currentUser) return;

    try {
      if (forEveryone) {
        // Update in database - mark as deleted for everyone
        await supabase
          .from('messages')
          .update({ deleted_for_everyone: true, content: null, media_url: null })
          .eq('id', messageId)
          .eq('sender_id', currentUser.id); // Only sender can delete for everyone
      } else {
        // Mark as deleted only for current user
        const message = messages.find(m => m.id === messageId);
        if (message?.sender_id === currentUser.id) {
          await supabase
            .from('messages')
            .update({ deleted_for_sender: true })
            .eq('id', messageId);
        } else {
          await supabase
            .from('messages')
            .update({ deleted_for_receiver: true })
            .eq('id', messageId);
        }
      }

      // Update local state immediately for optimistic UI
      setDeletedMessages(prev => new Set([...prev, messageId]));
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }, [currentUser, messages]);

  // Add/toggle reaction handler
  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!currentUser) return;

    setLocalReactions(prev => {
      const messageReactions = prev[messageId] || [];
      const existingReaction = messageReactions.find(
        r => r.userId === currentUser.id && r.emoji === emoji
      );

      if (existingReaction) {
        // Remove reaction
        return {
          ...prev,
          [messageId]: messageReactions.filter(
            r => !(r.userId === currentUser.id && r.emoji === emoji)
          )
        };
      } else {
        // Add reaction
        return {
          ...prev,
          [messageId]: [
            ...messageReactions.filter(r => r.userId !== currentUser.id), // Remove other reactions from same user
            { emoji, userId: currentUser.id, username: currentUser.email?.split('@')[0] }
          ]
        };
      }
    });

    // Update message state with new reaction
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;
      
      const currentReactions = msg.reactions || [];
      const existingReaction = currentReactions.find(
        r => r.userId === currentUser.id && r.emoji === emoji
      );

      if (existingReaction) {
        return {
          ...msg,
          reactions: currentReactions.filter(
            r => !(r.userId === currentUser.id && r.emoji === emoji)
          )
        };
      } else {
        return {
          ...msg,
          reactions: [
            ...currentReactions.filter(r => r.userId !== currentUser.id),
            { emoji, userId: currentUser.id, username: currentUser.email?.split('@')[0] }
          ]
        };
      }
    }));
  }, [currentUser]);

  // Get filtered messages (excluding deleted ones)
  const filteredMessages = messages.filter(m => {
    if (deletedMessages.has(m.id)) return false;
    if (m.deleted_for_everyone) return false;
    if (m.sender_id === currentUser?.id && m.deleted_for_sender) return false;
    if (m.sender_id !== currentUser?.id && m.deleted_for_receiver) return false;
    return true;
  }).map(m => ({
    ...m,
    reactions: [...(m.reactions || []), ...(localReactions[m.id] || [])]
  }));

  return {
    conversations,
    messages: filteredMessages,
    loading,
    currentUser,
    loadConversations,
    sendMessage,
    createConversation,
    deleteMessage,
    toggleReaction
  };
};
