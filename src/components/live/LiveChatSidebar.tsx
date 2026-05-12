import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, X } from 'lucide-react';
import type { LiveComment } from './index';

interface Props {
  comments: LiveComment[];
  onSend: (msg: string) => void;
}

export const LiveChatSidebar = ({ comments, onSend }: Props) => {
  const [open, setOpen] = useState(true);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [comments.length]);

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText('');
  };

  return (
    <>
      {!open && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setOpen(true)}
          className="absolute right-4 bottom-28 z-40 w-12 h-12 rounded-full bg-black/60 backdrop-blur-xl border border-[#39FF14]/40 flex items-center justify-center shadow-[0_0_20px_rgba(57,255,20,0.25)]"
        >
          <MessageCircle className="w-5 h-5 text-[#39FF14]" />
        </motion.button>
      )}

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="absolute top-0 right-0 bottom-0 z-40 w-[320px] max-w-[85vw] bg-black/45 backdrop-blur-2xl border-l border-white/10 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse shadow-[0_0_8px_#39FF14]" />
                <h3 className="text-white font-bold text-sm">الدردشة المباشرة</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-2.5">
              {comments.length === 0 && (
                <p className="text-white/40 text-xs text-center mt-8">كن أول من يكتب رسالة</p>
              )}
              {comments.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`max-w-[88%] rounded-2xl px-3 py-2 backdrop-blur-md border ${
                    c.isHost
                      ? 'bg-[#39FF14]/15 border-[#39FF14]/40 shadow-[0_0_15px_rgba(57,255,20,0.2)] ml-auto'
                      : c.isVIP
                      ? 'bg-yellow-300/10 border-yellow-300/40'
                      : 'bg-white/[0.06] border-white/10'
                  }`}
                >
                  <div
                    className={`text-[10px] font-bold mb-0.5 ${
                      c.isHost ? 'text-[#39FF14]' : c.isVIP ? 'text-yellow-300' : 'text-white/60'
                    }`}
                  >
                    {c.username}
                    {c.isHost && ' · المضيف'}
                  </div>
                  <div className="text-white text-sm leading-snug break-words">{c.message}</div>
                </motion.div>
              ))}
            </div>

            <div className="p-3 border-t border-white/10 flex items-center gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="اكتب رسالة..."
                className="flex-1 bg-white/[0.06] border border-white/10 rounded-full px-4 py-2 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#39FF14]/50"
              />
              <button
                onClick={submit}
                disabled={!text.trim()}
                className="w-10 h-10 rounded-full bg-[#39FF14] flex items-center justify-center disabled:opacity-30 shadow-[0_0_15px_rgba(57,255,20,0.4)]"
              >
                <Send className="w-4 h-4 text-black" />
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
