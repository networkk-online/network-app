import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Check, X, Sparkles, Zap, Crown, Building2, Landmark,
  ChevronDown, ArrowRight, Star, Shield, Coins, Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import BackButton from "@/components/BackButton";
import {
  WhatsAppSubscribeDialog,
  WHATSAPP_PLANS,
  type WhatsAppPlan,
} from "@/components/subscription/WhatsAppSubscribeDialog";


type Plan = {
  id: string;
  name: string;
  tagline: string;
  price: number | "custom";
  icon: React.ElementType;
  gradient: string;
  ring: string;
  glow: string;
  cta: string;
  ctaHref: string;
  popular?: boolean;
  groups: { title?: string; features: string[] }[];
};

const plans: Plan[] = [
  {
    id: "plus",
    name: "Networkk Plus",
    tagline: "Perfect for personal users",
    price: 5,
    icon: Sparkles,
    gradient: "from-emerald-400 via-emerald-500 to-green-600",
    ring: "ring-emerald-500/30",
    glow: "shadow-[0_20px_80px_-20px_rgba(16,185,129,0.45)]",
    cta: "Upgrade to Plus",
    ctaHref: "/add-funds?plan=plus",
    groups: [
      {
        features: [
          "Remove Ads",
          "Plus Badge",
          "4K Upload",
          "Premium Themes",
          "Animated Profile Background",
          "100 R Coins every month",
          "More Cloud Storage",
          "Edit Posts after publishing",
          "Profile Visitor History",
          "Standard Support",
        ],
      },
    ],
  },
  {
    id: "creator",
    name: "Networkk Creator",
    tagline: "Perfect for creators",
    price: 15,
    icon: Zap,
    gradient: "from-sky-400 via-blue-500 to-indigo-600",
    ring: "ring-blue-500/40",
    glow: "shadow-[0_20px_80px_-20px_rgba(59,130,246,0.55)]",
    cta: "Become Creator",
    ctaHref: "/add-funds?plan=creator",
    popular: true,
    groups: [
      { title: "Everything in Plus", features: [] },
      {
        title: "Analytics",
        features: [
          "Audience Insights",
          "Engagement Rate",
          "Best Posting Time",
          "Reach Analytics",
          "Watch Time",
        ],
      },
      {
        title: "AI Tools",
        features: [
          "AI Caption Generator",
          "AI Hashtags",
          "AI Translation",
          "AI Background Removal",
          "AI Thumbnail Creator",
        ],
      },
      {
        title: "Creator Tools",
        features: [
          "Schedule Posts",
          "Comment Manager",
          "Quick Replies",
          "Early Access Features",
          "500 R Coins monthly",
          "Advertising Discounts",
        ],
      },
    ],
  },
  {
    id: "business",
    name: "Networkk Business",
    tagline: "For companies and brands",
    price: 30,
    icon: Building2,
    gradient: "from-fuchsia-400 via-purple-500 to-violet-600",
    ring: "ring-purple-500/40",
    glow: "shadow-[0_20px_80px_-20px_rgba(168,85,247,0.55)]",
    cta: "Start Business",
    ctaHref: "/add-funds?plan=business",
    groups: [
      { title: "Everything in Creator", features: [] },
      {
        title: "Business Features",
        features: [
          "Business Verification",
          "Business Dashboard",
          "Team Members",
          "Employee Permissions",
          "Product Catalog",
          "Shop",
          "Order Management",
        ],
      },
      {
        title: "Marketing Tools",
        features: [
          "Campaign Manager",
          "PDF Reports",
          "Excel Reports",
          "Priority Support",
          "1500 R Coins monthly",
        ],
      },
    ],
  },
  {
    id: "government",
    name: "Networkk Government",
    tagline: "For official institutions",
    price: "custom",
    icon: Landmark,
    gradient: "from-amber-300 via-yellow-500 to-amber-600",
    ring: "ring-amber-500/40",
    glow: "shadow-[0_20px_80px_-20px_rgba(245,158,11,0.5)]",
    cta: "Contact Sales",
    ctaHref: "mailto:enterprise@networkk.online",
    groups: [
      { title: "Everything in Business", features: [] },
      {
        title: "Government Features",
        features: [
          "Official Government Verification",
          "Unlimited Employees",
          "Department Management",
          "Emergency Broadcast System",
          "Public Announcements",
          "Citizen Requests",
          "Complaints Management",
          "Appointment Booking",
          "Government Dashboard",
          "AI Official Statement Generator",
          "Audit Logs",
          "Military Grade Encryption",
          "Dedicated Account Manager",
          "24/7 Premium Support",
        ],
      },
    ],
  },
];

const comparisonRows: { label: string; values: (string | boolean)[] }[] = [
  { label: "Ads", values: ["Shown", false, false, false, false] },
  { label: "Storage", values: ["2 GB", "50 GB", "250 GB", "1 TB", "Unlimited"] },
  { label: "AI Tools", values: [false, "Basic", true, true, "Advanced"] },
  { label: "Analytics", values: [false, "Basic", true, true, true] },
  { label: "Upload Quality", values: ["1080p", "4K", "4K HDR", "4K HDR", "4K HDR"] },
  { label: "R Coins / month", values: ["0", "100", "500", "1500", "Unlimited"] },
  { label: "Verification", values: [false, "Plus", "Creator", "Business", "Government"] },
  { label: "Shop", values: [false, false, false, true, true] },
  { label: "Employees", values: ["—", "—", "—", "25", "Unlimited"] },
  { label: "API Access", values: [false, false, true, true, true] },
  { label: "Priority Support", values: [false, false, false, true, true] },
  { label: "Government Dashboard", values: [false, false, false, false, true] },
  { label: "Emergency Broadcast", values: [false, false, false, false, true] },
  { label: "Dedicated Manager", values: [false, false, false, false, true] },
];

const faqs = [
  {
    q: "What happens after I subscribe?",
    a: "Your premium features unlock instantly. You'll get your badge, R Coins allowance, and access to all plan tools within seconds of successful payment.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your subscription dashboard at any time. You keep access until the end of your current billing period — no questions asked.",
  },
  {
    q: "Can I upgrade or downgrade later?",
    a: "Absolutely. Upgrades apply immediately with a prorated charge. Downgrades take effect at the start of your next billing cycle.",
  },
  {
    q: "Do I lose my data if I cancel?",
    a: "Never. Your posts, followers, messages, and profile stay intact. Only premium-only features become unavailable.",
  },
  {
    q: "How are payments processed?",
    a: "We support Visa, Mastercard, Apple Pay, Google Pay, Zain Cash, Fastpay, and bank transfers. All transactions are secured with end-to-end encryption.",
  },
];

const Subscriptions = () => {
  const [yearly, setYearly] = useState(false);
  const [waPlan, setWaPlan] = useState<WhatsAppPlan | null>(null);

  const formatPrice = (p: number | "custom") => {
    if (p === "custom") return "Custom";
    const value = yearly ? Math.round(p * 12 * 0.8) : p;
    return `$${value}`;
  };
  const suffix = (p: number | "custom") =>
    p === "custom" ? "" : yearly ? "/year" : "/month";

  const currentPlanId = "plus";


  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-emerald-500/20 blur-[140px]" />
        <div className="absolute top-1/3 -right-40 h-[560px] w-[560px] rounded-full bg-purple-500/20 blur-[160px]" />
        <div className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full bg-blue-500/15 blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.35) 1px, transparent 0)",
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      {/* Floating icons */}
      {[Sparkles, Crown, Star, Rocket, Shield, Coins].map((Icon, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute text-foreground/10"
          style={{
            top: `${10 + i * 13}%`,
            left: `${(i * 17) % 90}%`,
          }}
          animate={{ y: [0, -18, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
        >
          <Icon className="h-8 w-8" />
        </motion.div>
      ))}

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-24">
        <div className="flex items-center justify-between">
          <BackButton />
          <Link
            to="/subscriptions/manage"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Manage subscription →
          </Link>
        </div>

        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="pt-14 pb-12 text-center"
        >
          <Badge className="mb-5 rounded-full bg-white/5 border border-white/10 backdrop-blur px-4 py-1.5 text-xs font-medium text-foreground/80 hover:bg-white/10">
            <Sparkles className="h-3 w-3 mr-1.5 text-emerald-400" />
            Networkk Premium
          </Badge>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60">
            Choose the perfect plan
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-sky-400 to-purple-400">
              for your Networkk experience
            </span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground">
            Unlock premium features for personal users, creators, businesses and
            government organizations.
          </p>

          {/* Billing toggle */}
          <div className="mt-10 inline-flex items-center gap-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-3 shadow-lg">
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                !yearly ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Monthly
            </span>
            <Switch checked={yearly} onCheckedChange={setYearly} />
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                yearly ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Yearly
            </span>
            <AnimatePresence>
              {yearly && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="ml-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-1 text-xs font-semibold text-white"
                >
                  Save 20%
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* Plans */}
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const isCurrent = plan.id === currentPlanId;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                className={cn(
                  "group relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-6 flex flex-col",
                  "ring-1 ring-white/5 hover:ring-2 transition-all",
                  plan.ring,
                  plan.glow
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 px-3 py-1 text-[11px] font-semibold text-white shadow-lg">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <span className="rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-semibold text-white shadow-lg">
                      CURRENT
                    </span>
                  </div>
                )}

                <div
                  className={cn(
                    "inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                    plan.gradient
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="mt-5 text-xl font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    {formatPrice(plan.price)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {suffix(plan.price)}
                  </span>
                </div>

                <Button
                  onClick={() => setWaPlan(WHATSAPP_PLANS[plan.id] ?? null)}
                  className={cn(
                    "mt-6 w-full rounded-2xl bg-gradient-to-r text-white font-semibold shadow-lg hover:opacity-95 transition",
                    plan.gradient
                  )}
                >
                  {plan.cta} <ArrowRight className="ml-1 h-4 w-4" />
                </Button>


                <div className="mt-6 space-y-4 text-sm">
                  {plan.groups.map((g, gi) => (
                    <div key={gi}>
                      {g.title && (
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {g.title}
                        </p>
                      )}
                      <ul className="space-y-2">
                        {g.features.map((f) => (
                          <li key={f} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                            <span className="text-foreground/85">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </section>

        {/* Comparison */}
        <section className="mt-28">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Compare every plan
            </h2>
            <p className="mt-3 text-muted-foreground">
              Everything you need — side by side.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">
                      Feature
                    </th>
                    {["Free", "Plus", "Creator", "Business", "Government"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-4 text-center font-semibold"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr
                      key={row.label}
                      className={cn(
                        "border-b border-white/5 last:border-0",
                        i % 2 === 0 ? "bg-white/[0.01]" : ""
                      )}
                    >
                      <td className="px-6 py-4 font-medium text-foreground/90">
                        {row.label}
                      </td>
                      {row.values.map((v, vi) => (
                        <td key={vi} className="px-4 py-4 text-center">
                          {typeof v === "boolean" ? (
                            v ? (
                              <Check className="mx-auto h-5 w-5 text-emerald-400" />
                            ) : (
                              <X className="mx-auto h-5 w-5 text-muted-foreground/40" />
                            )
                          ) : (
                            <span className="text-foreground/85">{v}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-28 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Frequently asked questions
            </h2>
            <p className="mt-3 text-muted-foreground">
              Everything you need to know before subscribing.
            </p>
          </div>
          <Accordion
            type="single"
            collapsible
            className="space-y-3"
          >
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-5 data-[state=open]:bg-white/[0.06]"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5 font-medium">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Enterprise CTA */}
        <section className="mt-28">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 p-10 sm:p-14 text-center bg-gradient-to-br from-emerald-500/10 via-sky-500/10 to-purple-500/10 backdrop-blur-2xl">
            <div className="absolute inset-0 -z-10">
              <div className="absolute -top-20 left-1/3 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl" />
              <div className="absolute -bottom-20 right-1/3 h-72 w-72 rounded-full bg-purple-500/25 blur-3xl" />
            </div>
            <Crown className="mx-auto h-10 w-10 text-amber-400" />
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
              Need a custom solution?
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Our Enterprise team crafts bespoke plans for governments, large
              brands, and mission-critical organizations.
            </p>
            <Button
              onClick={() => setWaPlan(WHATSAPP_PLANS.government)}
              size="lg"
              className="mt-8 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-600 text-black font-semibold hover:opacity-95"
            >
              Contact Government Sales <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </section>
      </div>

      <WhatsAppSubscribeDialog
        plan={waPlan}
        open={!!waPlan}
        onOpenChange={(o) => !o && setWaPlan(null)}
      />
    </div>
  );
};

export default Subscriptions;
