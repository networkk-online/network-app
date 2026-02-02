import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  username?: string;
}

export const TypingIndicator = ({ username }: TypingIndicatorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-3 px-4 py-2"
    >
      <div className="flex items-center gap-1 px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md">
        <motion.span
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
          className="w-2 h-2 rounded-full bg-purple-400"
        />
        <motion.span
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
          className="w-2 h-2 rounded-full bg-purple-400"
        />
        <motion.span
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
          className="w-2 h-2 rounded-full bg-purple-400"
        />
      </div>
      {username && (
        <span className="text-xs text-white/50">
          {username} يكتب...
        </span>
      )}
    </motion.div>
  );
};
