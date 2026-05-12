import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, MicOff, UserX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface ModViewer {
  uid: string | number;
  username: string;
  isMuted?: boolean;
}

interface Props {
  isHost: boolean;
  channel: string | null;
  viewers: ModViewer[];
  onKick: (uid: string | number) => void;
  onMute: (uid: string | number) => void;
}

export const ModeratorPanel = ({ isHost, channel, viewers, onKick, onMute }: Props) => {
  const [open, setOpen] = useState(false);

  if (!isHost) return null;

  const log = async (action: 'kick' | 'mute', uid: string | number, username: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Best-effort audit log; ignore if table not present
      await supabase.from('admin_audit_log' as any).insert({
        actor_id: user?.id ?? null,
        action: `live_${action}`,
        target_id: String(uid),
        metadata: { channel, username },
      } as any);
    } catch {/* ignore */}
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="absolute top-28 right-3 z-40 w-10 h-10 rounded-full bg-black/60 backdrop-blur-xl border border-[#39FF14]/40 flex items-center justify-center text-[#39FF14]"
        title="Moderator Panel"
      >
        <Shield className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-black/85 backdrop-blur-2xl border border-[#39FF14]/30 rounded-3xl p-5 shadow-[0_0_40px_rgba(57,255,20,0.2)]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#39FF14]" /> لوحة المشرف
                </h3>
                <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto space-y-2">
                {viewers.length === 0 && (
                  <p className="text-white/40 text-sm text-center py-6">لا يوجد مشاهدون حالياً</p>
                )}
                {viewers.map(v => (
                  <div
                    key={v.uid}
                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#39FF14]/20 flex items-center justify-center text-[#39FF14] text-xs font-bold">
                        {v.username.slice(0, 1).toUpperCase()}
                      </div>
                      <span className="text-white text-sm">{v.username}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { onMute(v.uid); log('mute', v.uid, v.username); }}
                        className={`p-2 rounded-lg border transition ${
                          v.isMuted
                            ? 'bg-[#39FF14]/20 border-[#39FF14]/50 text-[#39FF14]'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                        title="كتم"
                      >
                        <MicOff className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { onKick(v.uid); log('kick', v.uid, v.username); }}
                        className="p-2 rounded-lg bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25"
                        title="طرد"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
