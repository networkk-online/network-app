import { motion } from 'framer-motion';
import { Plus, Mic, MicOff, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GuestSlot {
  slot_index: number;
  guest_user_id: string | null;
  username?: string;
  avatarUrl?: string;
  status: 'empty' | 'requested' | 'accepted' | 'muted' | 'removed';
}

export type GuestLayout = 1 | 2 | 4 | 9;

const gridClass: Record<GuestLayout, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  4: 'grid-cols-2 grid-rows-2',
  9: 'grid-cols-3 grid-rows-3',
};

export const GuestSlots = ({
  layout,
  slots,
  isHost,
  onInvite,
  onKick,
  onToggleMute,
}: {
  layout: GuestLayout;
  slots: GuestSlot[];
  isHost: boolean;
  onInvite?: (slotIndex: number) => void;
  onKick?: (slotIndex: number) => void;
  onToggleMute?: (slotIndex: number) => void;
}) => {
  const total = layout;
  const items = Array.from({ length: total }, (_, i) => slots.find((s) => s.slot_index === i));
  if (layout === 1) return null;
  return (
    <div className={cn('grid gap-1 w-full h-full', gridClass[layout])}>
      {items.map((s, i) => {
        const filled = s && s.guest_user_id;
        return (
          <div
            key={i}
            className="relative rounded-2xl border border-white/10 bg-black/40 overflow-hidden flex items-center justify-center"
            style={{
              boxShadow: filled ? '0 0 20px hsl(var(--live-emerald) / 0.25)' : undefined,
            }}
          >
            {filled ? (
              <>
                {s.avatarUrl ? (
                  <img src={s.avatarUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-xl">
                    {s.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between px-2 py-1 rounded-full bg-black/60 backdrop-blur-md">
                  <span className="text-[10px] text-white truncate">{s.username || 'ضيف'}</span>
                  {isHost && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => onToggleMute?.(i)} className="text-white/70 hover:text-white">
                        {s.status === 'muted' ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                      </button>
                      <button onClick={() => onKick?.(i)} className="text-red-400 hover:text-red-300">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => isHost && onInvite?.(i)}
                disabled={!isHost}
                className="w-full h-full flex flex-col items-center justify-center gap-1 text-white/40 hover:text-white/70 transition-colors"
              >
                <div className="w-10 h-10 rounded-full border border-dashed border-white/20 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[10px]">{isHost ? 'إضافة ضيف' : 'مقعد فارغ'}</span>
              </motion.button>
            )}
          </div>
        );
      })}
    </div>
  );
};
