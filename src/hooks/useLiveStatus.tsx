import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LiveInfo {
  isLive: boolean;
  roomId?: string;
  channelName?: string;
}

const cache = new Map<string, LiveInfo>();
let indicatorsEnabled: boolean | null = null;

async function loadToggle(): Promise<boolean> {
  if (indicatorsEnabled !== null) return indicatorsEnabled;
  try {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'live_indicators_enabled')
      .maybeSingle();
    // default ON unless explicitly disabled
    indicatorsEnabled = (data?.value as any)?.enabled !== false;
  } catch {
    indicatorsEnabled = true;
  }
  return indicatorsEnabled;
}

/** Real-time live-status for a list of user ids. Verified through live_streams/live_rooms (G3142 kill-switch sets status!=live). */
export function useLiveStatus(userIds: string[] | undefined) {
  const [map, setMap] = useState<Record<string, LiveInfo>>({});
  const key = (userIds || []).filter(Boolean).sort().join(',');

  useEffect(() => {
    if (!key) { setMap({}); return; }
    const ids = key.split(',');
    let cancelled = false;

    const fetchAll = async () => {
      const enabled = await loadToggle();
      if (!enabled) { if (!cancelled) setMap({}); return; }

      const [streams, rooms] = await Promise.all([
        supabase.from('live_streams').select('host_id, channel_name, id').in('host_id', ids).eq('status', 'live'),
        supabase.from('live_rooms').select('host_id, id').in('host_id', ids).eq('status', 'live'),
      ]);
      if (cancelled) return;
      const next: Record<string, LiveInfo> = {};
      ids.forEach((id) => { next[id] = { isLive: false }; });
      (streams.data || []).forEach((r: any) => {
        next[r.host_id] = { isLive: true, roomId: r.id, channelName: r.channel_name };
      });
      (rooms.data || []).forEach((r: any) => {
        if (!next[r.host_id]?.isLive) next[r.host_id] = { isLive: true, roomId: r.id };
      });
      Object.entries(next).forEach(([k, v]) => cache.set(k, v));
      setMap(next);
    };
    fetchAll();

    const ch = supabase
      .channel(`live-status-${key.slice(0, 30)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_streams' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_rooms' }, fetchAll)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [key]);

  return map;
}

export function useLiveStatusSingle(userId?: string): LiveInfo {
  const m = useLiveStatus(userId ? [userId] : []);
  return (userId && m[userId]) || cache.get(userId || '') || { isLive: false };
}
