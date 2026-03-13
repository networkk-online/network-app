import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAffiliation } from '@/hooks/useAffiliation';
import { supabase } from '@/integrations/supabase/client';

type VerificationType = 'business' | 'notable' | 'government';

interface VerifiedBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  username?: string;
  userId?: string;
  verificationType?: VerificationType | null;
}

const badgeStyles: Record<VerificationType, { icon: string; fill: string; label: string }> = {
  business: {
    icon: 'text-yellow-500',
    fill: 'fill-yellow-500/20',
    label: 'حساب تجاري موثّق',
  },
  notable: {
    icon: 'text-blue-500',
    fill: 'fill-blue-500/20',
    label: 'حساب بارز موثّق',
  },
  government: {
    icon: 'text-gray-400 dark:text-gray-300',
    fill: 'fill-gray-400/20 dark:fill-gray-300/20',
    label: 'حساب حكومي موثّق',
  },
};

const modalAccent: Record<VerificationType, string> = {
  business: 'from-yellow-500 via-yellow-400 to-yellow-300',
  notable: 'from-blue-500 via-blue-400 to-blue-300',
  government: 'from-gray-500 via-gray-400 to-gray-300',
};

const modalBadgeBg: Record<VerificationType, string> = {
  business: 'bg-yellow-500/10',
  notable: 'bg-blue-500/10',
  government: 'bg-gray-500/10',
};

export const VerifiedBadge = ({ className, size = 'md', username, userId, verificationType: propType }: VerifiedBadgeProps) => {
  const [open, setOpen] = useState(false);
  const [vType, setVType] = useState<VerificationType | null>(propType ?? null);
  const company = useAffiliation(userId);

  // Fetch verification_type if not provided via prop
  useEffect(() => {
    if (propType) { setVType(propType); return; }
    if (!userId) return;

    const fetch = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('verification_type')
        .eq('id', userId)
        .maybeSingle();
      if (data?.verification_type) setVType(data.verification_type as VerificationType);
    };
    fetch();
  }, [userId, propType]);

  const type: VerificationType = vType || 'notable';
  const style = badgeStyles[type];

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="inline-flex items-center focus:outline-none"
        aria-label="Verified account"
      >
        <BadgeCheck
          className={cn(
            sizeClasses[size],
            style.icon,
            style.fill,
            'flex-shrink-0',
            className
          )}
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden border-border/50 bg-background">
          <DialogTitle className="sr-only">{style.label}</DialogTitle>

          {/* Header accent */}
          <div className={cn('h-1.5 w-full bg-gradient-to-r', modalAccent[type])} />

          <div className="flex flex-col items-center gap-4 px-6 pt-6 pb-5">
            {/* Badge icon */}
            <div className={cn('w-14 h-14 rounded-full flex items-center justify-center', modalBadgeBg[type])}>
              <BadgeCheck className={cn('w-8 h-8', style.icon, style.fill)} />
            </div>

            {/* Company logo */}
            {company?.logo_url && (
              <img
                src={company.logo_url}
                alt={company.name}
                className="w-10 h-10 rounded-lg object-cover border border-border/30"
              />
            )}

            {/* Title */}
            <h3 className="text-base font-bold text-foreground">{style.label}</h3>

            {/* Message */}
            <p className="text-sm text-muted-foreground text-center leading-relaxed" dir="rtl">
              هذا الحساب موثَّق نظرًا لأنه تابع لـ{' '}
              <span className="font-semibold text-foreground">@{username || 'unknown'}</span>
            </p>

            {/* Close */}
            <Button
              onClick={() => setOpen(false)}
              className="w-full mt-1 rounded-xl"
              size="sm"
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
