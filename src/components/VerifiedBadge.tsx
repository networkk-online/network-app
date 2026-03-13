import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAffiliation } from '@/hooks/useAffiliation';

interface VerifiedBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  username?: string;
  userId?: string;
}

export const VerifiedBadge = ({ className, size = 'md', username, userId }: VerifiedBadgeProps) => {
  const [open, setOpen] = useState(false);
  const company = useAffiliation(userId);

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
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
            'text-primary fill-primary/20 flex-shrink-0',
            className
          )}
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden border-border/50 bg-background">
          <DialogTitle className="sr-only">حساب موثّق</DialogTitle>

          {/* Header accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/70 to-primary/40" />

          <div className="flex flex-col items-center gap-4 px-6 pt-6 pb-5">
            {/* Badge icon */}
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <BadgeCheck className="w-8 h-8 text-primary fill-primary/20" />
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
            <h3 className="text-base font-bold text-foreground">حساب موثّق</h3>

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
