import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  is_read: boolean;
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

      // Get conversation details
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      // Get conversation details with participants
      const conversationsWithDetails = await Promise.all(
        (convData || []).map(async (conv) => {
          // Get ALL participants for this conversation (not filtered by user)
          const { data: allParts } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conv.id);

          const participantIds = allParts?.map(p => p.user_id) || [];
          const otherUserIds = participantIds.filter(id => id !== currentUser.id);

          // Get profiles for other users
          let participants: any[] = [];
          if (otherUserIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, username, full_name, avatar_url, is_verified')
              .in('id', otherUserIds);
            participants = profiles || [];
          }

          // Get last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey (
                username,
                full_name,
                avatar_url
              )
            `)
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', currentUser.id);

          return {
            ...conv,
            participants,
            last_message: lastMsg,
            unread_count: unreadCount || 0
          };
        })
      );

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
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', convId)
        .neq('sender_id', currentUser.id)
        .eq('is_read', false);
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
    mediaFile?: File
  ) => {
    if (!currentUser) return null;

    try {
      let mediaUrl = null;
      let mediaType = null;

      // Upload media if provided
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('message-media')
          .upload(fileName, mediaFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('message-media')
          .getPublicUrl(fileName);

        mediaUrl = publicUrl;
        mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';
      }

      // Send message to Supabase (primary storage)
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: convId,
          sender_id: currentUser.id,
          content,
          media_url: mediaUrl,
          media_type: mediaType
        })
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

  return {
    conversations,
    messages,
    loading,
    currentUser,
    loadConversations,
    sendMessage,
    createConversation
  };
};
