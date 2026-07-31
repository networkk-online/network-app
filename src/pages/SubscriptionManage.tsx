import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Sparkles, Check, Download, CreditCard, Coins, ArrowUpRight,
  ArrowDownRight, X, Plus, Calendar, Zap, Shield, TrendingUp,
  CheckCircle2, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import BackButton from "@/components/BackButton";
import { toast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";

const staticSub = {
  plan: "Networkk",
  tagline: "Your Networkk plan",
  price: 0,
  billing: "monthly" as const,
  renews: "—",
  status: "active" as const,
  rCoins: 342,
  rCoinsMonthly: 500,
  gradient: "from-sky-400 via-blue-500 to-indigo-600",
};

const FEATURE_LABELS: Record<string, string> = {
  verification_badge: "شارة التوثيق",
  analytics: "الإحصائيات المتقدمة",
  business_dashboard: "لوحة الأعمال",
  government_features: "الميزات الحكومية",
  priority_support: "الدعم ذو الأولوية",
  advanced_privacy: "الخصوصية المتقدمة",
  promotion_tools: "أدوات الترويج",
  extended_uploads: "حدود رفع موسعة",
  ad_free: "بدون إعلانات",
  team_members: "أعضاء الفريق",
};


const invoices = [
  { id: "INV-20260712", date: "Jul 12, 2026", amount: 15, status: "Paid" },
  { id: "INV-20260612", date: "Jun 12, 2026", amount: 15, status: "Paid" },
  { id: "INV-20260512", date: "May 12, 2026", amount: 15, status: "Paid" },
  { id: "INV-20260412", date: "Apr 12, 2026", amount: 15, status: "Paid" },
];

const paymentMethods = [
  { id: "pm_1", brand: "Visa", last4: "4242", exp: "08/28", primary: true },
  { id: "pm_2", brand: "Mastercard", last4: "8712", exp: "02/27", primary: false },
];

const SubscriptionManage = () => {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const sub = useSubscription();

  // Live, server-resolved plan state (falls back to the static shell while loading)
  const currentSub = useMemo(() => ({
    ...staticSub,
    plan: `${sub.planNameAr} · ${sub.planName}`,
    status: sub.status as typeof staticSub.status,
    renews: sub.expiresAt
      ? new Date(sub.expiresAt).toLocaleDateString("ar-IQ")
      : "—",
  }), [sub.planNameAr, sub.planName, sub.status, sub.expiresAt]);

  const benefits = useMemo(
    () => Object.keys(sub.features).map((k) => FEATURE_LABELS[k] ?? k),
    [sub.features]
  );

  const coinsPct = Math.round((currentSub.rCoins / currentSub.rCoinsMonthly) * 100);


  const handleCancel = () => {
    setCancelled(true);
    setCancelOpen(false);
    toast({
      title: "Subscription cancelled",
      description: `Your ${currentSub.plan} plan stays active until ${currentSub.renews}.`,
    });
  };

  const downloadInvoice = (id: string) => {
    toast({ title: "Invoice downloading", description: `${id}.pdf` });
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/4 h-[480px] w-[480px] rounded-full bg-sky-500/15 blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 h-[420px] w-[420px] rounded-full bg-purple-500/15 blur-[140px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-6 pb-24">
        <div className="flex items-center justify-between">
          <BackButton />
          <Link
            to="/subscriptions"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all plans →
          </Link>
        </div>

        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 mb-10"
        >
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Subscription
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your plan, billing, and R Coins in one place.
          </p>
        </motion.header>

        <AnimatePresence>
          {cancelled && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl p-4"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <div className="text-sm">
                <p className="font-semibold">Cancellation scheduled.</p>
                <p className="text-muted-foreground">
                  You keep Creator benefits until {currentSub.renews}.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Current plan */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-8"
          >
            <div
              className={cn(
                "absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-40 bg-gradient-to-br",
                currentSub.gradient
              )}
            />
            <div className="flex items-start justify-between gap-4 relative">
              <div>
                <Badge className="rounded-full bg-white/5 border border-white/10 text-foreground/80">
                  <span
                    className={cn(
                      "mr-1.5 h-1.5 w-1.5 rounded-full",
                      cancelled ? "bg-amber-400" : "bg-emerald-400"
                    )}
                  />
                  {cancelled ? "Cancels soon" : "Active"}
                </Badge>
                <h2 className="mt-3 text-2xl sm:text-3xl font-bold">
                  {currentSub.plan}
                </h2>
                <p className="text-sm text-muted-foreground">{currentSub.tagline}</p>
              </div>
              <div
                className={cn(
                  "inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                  currentSub.gradient
                )}
              >
                <Zap className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-6 text-sm relative">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  Price
                </p>
                <p className="mt-1 text-lg font-semibold">
                  ${currentSub.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    /month
                  </span>
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  Renews
                </p>
                <p className="mt-1 text-lg font-semibold flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {currentSub.renews}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  Billing
                </p>
                <p className="mt-1 text-lg font-semibold capitalize">
                  {currentSub.billing}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 relative">
              <Button
                asChild
                className="rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white"
              >
                <Link to="/subscriptions">
                  <ArrowUpRight className="mr-1.5 h-4 w-4" /> Upgrade
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-2xl border-white/15 bg-white/5 hover:bg-white/10"
              >
                <Link to="/subscriptions">
                  <ArrowDownRight className="mr-1.5 h-4 w-4" /> Downgrade
                </Link>
              </Button>
              {!cancelled && (
                <Button
                  variant="ghost"
                  onClick={() => setCancelOpen(true)}
                  className="rounded-2xl text-muted-foreground hover:text-destructive"
                >
                  <X className="mr-1.5 h-4 w-4" /> Cancel subscription
                </Button>
              )}
            </div>
          </motion.section>

          {/* R Coins */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-8"
          >
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-black shadow-lg">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  R Coins
                </p>
                <p className="text-lg font-semibold">Remaining this month</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{currentSub.rCoins}</span>
                <span className="text-sm text-muted-foreground">
                  / {currentSub.rCoinsMonthly}
                </span>
              </div>
              <Progress value={coinsPct} className="mt-3 h-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                Resets on {currentSub.renews}
              </p>
            </div>

            <Button
              asChild
              variant="outline"
              className="mt-6 w-full rounded-2xl border-white/15 bg-white/5 hover:bg-white/10"
            >
              <Link to="/store">
                <Plus className="mr-1.5 h-4 w-4" /> Buy more coins
              </Link>
            </Button>
          </motion.section>
        </div>

        {/* Benefits */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-8"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg font-semibold">Your benefits</h3>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => (
              <div
                key={b}
                className="flex items-start gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-sm"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Payment methods + Billing history */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Payment methods</h3>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl border-white/15 bg-white/5 hover:bg-white/10"
              >
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>

            <div className="mt-5 space-y-3">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-14 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-[10px] font-bold text-white">
                      {pm.brand.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">
                        {pm.brand} •••• {pm.last4}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires {pm.exp}
                      </p>
                    </div>
                  </div>
                  {pm.primary && (
                    <Badge className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Primary
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-8"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Billing history</h3>
            </div>

            <div className="mt-5 divide-y divide-white/5">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{inv.id}</p>
                      <p className="text-xs text-muted-foreground">{inv.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold">${inv.amount}.00</p>
                      <p className="text-xs text-emerald-400">{inv.status}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-xl hover:bg-white/10"
                      onClick={() => downloadInvoice(inv.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="rounded-3xl border-white/10 bg-background/95 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Cancel subscription?</DialogTitle>
            <DialogDescription>
              You'll keep {currentSub.plan} benefits until{" "}
              <span className="text-foreground font-medium">
                {currentSub.renews}
              </span>
              . After that, your account switches to the free plan. Your data
              stays safe.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="rounded-2xl border-white/15"
              onClick={() => setCancelOpen(false)}
            >
              Keep my plan
            </Button>
            <Button
              variant="destructive"
              className="rounded-2xl"
              onClick={handleCancel}
            >
              Cancel subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionManage;
