import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface ShareData {
  title: string;
  text: string;
  url: string;
}

interface PremiumShareButtonProps {
  shareData: ShareData;
  className?: string;
  iconSize?: number;
  variant?: 'inline' | 'fab' | 'icon-only';
  showLabel?: boolean;
  label?: string;
}

/**
 * PremiumShareButton — Native Web Share API with clipboard fallback.
 * 
 * - Uses navigator.share() on mobile/devices that support it.
 * - Falls back to navigator.clipboard.writeText() on desktop.
 * - Shows a beautiful Glassmorphism toast on copy.
 * - Icon morphs: Share → Neon Green Checkmark → Share.
 * - Styled for the Network app's Dark/Neon Green Glassmorphism design.
 */
export const PremiumShareButton = ({
  shareData,
  className,
  iconSize = 22,
  variant = 'icon-only',
  showLabel = false,
  label = 'Share'
}: PremiumShareButtonProps) => {
  const [justCopied, setJustCopied] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const absoluteUrl = shareData.url.startsWith('http')
    ? shareData.url
    : `${window.location.origin}${shareData.url.startsWith('/') ? '' : '/'}${shareData.url}`;

  const handleShare = useCallback(async () => {
    if (justCopied) return;

    // Prefer native Web Share API (mobile / PWA)
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: absoluteUrl,
        });
        // On native share success, briefly show checkmark
        setJustCopied(true);
        setTimeout(() => setJustCopied(false), 2000);
        return;
      } catch (err: any) {
        // User cancelled share sheet — silently ignore
        if (err.name === 'AbortError') return;
        // Fall through to clipboard fallback
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(absoluteUrl);

      // Haptic feedback
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20);
      }

      // Trigger morph state
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2200);

      // Glassmorphism toast
      toast.success('Link copied to clipboard!', {
        description: absoluteUrl,
        duration: 2500,
        className: cn(
          'bg-[#0D0D0D]/90 backdrop-blur-2xl border border-white/10',
          'text-white shadow-[0_8px_32px_rgba(0,255,0,0.15)]',
          'rounded-2xl'
        ),
        icon: (
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#00FF00]/20 animate-ping" />
            <Check className="w-5 h-5 text-[#00FF00]" strokeWidth={2.5} />
          </div>
        ),
      });
    } catch (err) {
      console.error('Clipboard write failed:', err);
      toast.error('Failed to copy link', {
        description: 'Please copy the URL manually.',
        className: 'bg-[#0D0D0D]/90 backdrop-blur-2xl border border-white/10 text-white rounded-2xl',
      });
    }
  }, [shareData, absoluteUrl, justCopied]);

  const isFab = variant === 'fab';

  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      onClick={handleShare}
      disabled={justCopied}
      className={cn(
        // Base
        'relative flex items-center justify-center shrink-0',
        'transition-all duration-300 ease-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF00]/40',
        
        // Variants
        isFab && [
          'w-14 h-14 rounded-full',
          'bg-white/[0.06] backdrop-blur-xl border border-white/10',
          'shadow-[0_4px_24px_rgba(0,0,0,0.4)]',
          'hover:bg-white/[0.10] hover:border-[#00FF00]/30',
          'hover:shadow-[0_4px_32px_rgba(0,255,0,0.12)]',
        ],
        
        !isFab && variant === 'inline' && [
          'px-4 py-2.5 rounded-2xl gap-2',
          'bg-white/[0.05] backdrop-blur-md border border-white/10',
          'hover:bg-white/[0.08] hover:border-[#00FF00]/25',
          'text-white/80 text-sm font-medium',
        ],
        
        !isFab && variant === 'icon-only' && [
          'w-10 h-10 rounded-full p-0',
          'bg-transparent hover:bg-white/[0.04]',
          'interactive-element',
        ],

        // Copied state glow ring
        justCopied && !isFab && 'shadow-[0_0_20px_rgba(0,255,0,0.3)]',
        
        className
      )}
      aria-label={justCopied ? 'Link copied' : 'Share'}
    >
      {/* Neon glow ring for FAB when copied */}
      <AnimatePresence>
        {justCopied && isFab && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 rounded-full border-2 border-[#00FF00]/60"
            style={{ boxShadow: '0 0 20px rgba(0,255,0,0.3), inset 0 0 20px rgba(0,255,0,0.1)' }}
          />
        )}
      </AnimatePresence>

      {/* Icon morph container */}
      <div className="relative w-[22px] h-[22px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {justCopied ? (
            <motion.div
              key="check"
              initial={{ opacity: 0, scale: 0.3, rotate: -45 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Check
                className="text-[#00FF00]"
                style={{
                  width: iconSize,
                  height: iconSize,
                  filter: 'drop-shadow(0 0 6px rgba(0,255,0,0.6))',
                }}
                strokeWidth={2.5}
              />
            </motion.div>
          ) : (
            <motion.div
              key="share"
              initial={{ opacity: 0, scale: 0.5, rotate: 45 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.3, rotate: -45 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Share2
                className={cn(
                  'transition-colors duration-200',
                  isHovering && !isFab ? 'text-[#00FF00]' : 'text-white/50'
                )}
                style={{ width: iconSize, height: iconSize }}
                strokeWidth={1.4}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Label */}
      {showLabel && variant === 'inline' && (
        <span className="text-sm font-medium">{justCopied ? 'Copied!' : label}</span>
      )}
    </motion.button>
  );
};

export default PremiumShareButton;
