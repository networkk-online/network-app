import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Sparkles } from 'lucide-react';
import { useSubscription, type FeatureKey } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';

interface FeatureGateProps {
  feature: FeatureKey;
  children: ReactNode;
  /** Render nothing instead of the upgrade card */
  silent?: boolean;
  title?: string;
  description?: string;
}

/**
 * Renders children only when the signed-in user's active plan unlocks `feature`.
 * The entitlement itself is resolved server-side (my_entitlements RPC).
 */
const FeatureGate = ({ feature, children, silent, title, description }: FeatureGateProps) => {
  const { has, loading } = useSubscription();

  if (loading) return null;
  if (has(feature)) return <>{children}</>;
  if (silent) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 text-center space-y-3">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Lock className="w-5 h-5 text-primary" />
      </div>
      <h3 className="font-bold text-foreground">{title ?? 'ميزة مدفوعة'}</h3>
      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
        {description ?? 'هذه الميزة متاحة ضمن باقات الاشتراك. قم بالترقية لتفعيلها فورًا.'}
      </p>
      <Button asChild size="sm" className="gap-2">
        <Link to="/subscriptions"><Sparkles className="w-4 h-4" /> عرض الباقات</Link>
      </Button>
    </div>
  );
};

export default FeatureGate;
