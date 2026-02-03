import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LinkPreviewProps {
  url: string;
  className?: string;
}

interface LinkMetadata {
  title: string;
  description: string;
  image?: string;
  siteName?: string;
  favicon?: string;
}

export const LinkPreview = ({ url, className }: LinkPreviewProps) => {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // In production, use a link preview API (e.g., microlink.io, linkpreview.net)
    // For now, simulate with placeholder data
    const fetchMetadata = async () => {
      setLoading(true);
      try {
        // Simulated metadata - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const domain = new URL(url).hostname;
        setMetadata({
          title: 'عنوان الرابط',
          description: 'وصف مختصر للمحتوى الموجود في هذا الرابط. هذا نص توضيحي.',
          image: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
          siteName: domain,
          favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
        });
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [url]);

  if (error) return null;

  if (loading) {
    return (
      <div className={cn(
        'flex items-center gap-2 p-3 rounded-xl bg-white/5',
        className
      )}>
        <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
        <span className="text-xs text-white/40">جاري تحميل المعاينة...</span>
      </div>
    );
  }

  if (!metadata) return null;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        'block rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm',
        'hover:border-white/20 transition-all',
        className
      )}
    >
      {/* Image */}
      {metadata.image && (
        <div className="w-full h-32 bg-white/5">
          <img
            src={metadata.image}
            alt={metadata.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        {/* Site info */}
        <div className="flex items-center gap-2 mb-2">
          {metadata.favicon && (
            <img
              src={metadata.favicon}
              alt=""
              className="w-4 h-4 rounded"
            />
          )}
          <span className="text-[10px] text-white/50 uppercase tracking-wide">
            {metadata.siteName}
          </span>
          <ExternalLink className="w-3 h-3 text-white/30 ml-auto" />
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium text-white line-clamp-2 mb-1">
          {metadata.title}
        </h4>

        {/* Description */}
        <p className="text-xs text-white/60 line-clamp-2">
          {metadata.description}
        </p>
      </div>
    </motion.a>
  );
};
