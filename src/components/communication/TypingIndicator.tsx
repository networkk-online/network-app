import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  username?: string;
  avatarUrl?: string;
}

export const TypingIndicator = ({ username, avatarUrl }: TypingIndicatorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="flex items-end gap-2 px-4 py-2"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={username || 'user'}
          className="w-7 h-7 rounded-full object-cover border border-white/10 shadow-[0_0_8px_rgba(0,255,0,0.15)]"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-white/10 border border-white/10" />
      )}
      <div
        className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-sm bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
        aria-label={username ? `${username} يكتب` : 'يكتب'}
      >
        {[0, 0.15, 0.3].map((delay, i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 0.9, delay, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 rounded-full bg-[#00FF00] shadow-[0_0_8px_rgba(0,255,0,0.8)]"
          />
        ))}
      </div>
    </motion.div>
  );
};
