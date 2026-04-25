import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BotMessage {
  id: string;
  user_id: string;
  event_type: string;
  title: string | null;
  content: string;
  metadata: Record<string, any> | null;
  severity: string;
  is_read: boolean;
  is_from_bot: boolean;
  created_at: string;
}

export const NETWORKK_BOT_ID = '00000000-0000-0000-0000-000000000b07';

export const useNetworkkBot = () => {
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  const loadMessages = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    const { data } = await supabase
      .from('system_messages')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: true })
      .limit(200);
    setMessages((data ?? []) as BotMessage[]);
    setLoading(false);

    // Mark unread as read
    await supabase
      .from('system_messages')
      .update({ is_read: true })
      .eq('user_id', currentUserId)
      .eq('is_read', false);
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    loadMessages();

    const channel = supabase
      .channel(`bot-${currentUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'system_messages', filter: `user_id=eq.${currentUserId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as BotMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, loadMessages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('networkk-bot', {
        body: { action: 'chat', message: text },
      });
      if (error) throw error;
    } finally {
      setSending(false);
    }
  }, [sending]);

  const triggerWelcome = useCallback(async () => {
    if (!currentUserId) return;
    await supabase.functions.invoke('networkk-bot', {
      body: { action: 'welcome', user_id: currentUserId },
    });
  }, [currentUserId]);

  const unreadCount = messages.filter((m) => m.is_from_bot && !m.is_read).length;

  return { messages, loading, sending, sendMessage, triggerWelcome, unreadCount, currentUserId };
};
