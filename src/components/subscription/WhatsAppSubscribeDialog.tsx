import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Check, Copy, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type WhatsAppPlan = {
  id: string;
  name: string;
  price: number | "custom";
  description: string;
  message: string;
};

const PHONE = "9647737318706";
const DISPLAY_PHONE = "+964 773 731 8706";

interface Props {
  plan: WhatsAppPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WhatsAppSubscribeDialog = ({ plan, open, onOpenChange }: Props) => {
  const [loading, setLoading] = useState(false);

  const openWhatsApp = async () => {
    if (!plan) return;
    setLoading(true);

    // Best-effort log
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user?.id) {
        await supabase.from("notifications").insert({
          user_id: auth.user.id,
          actor_id: auth.user.id,
          type: "subscription_request",
          content: `Subscription request via WhatsApp: ${plan.name}`,
        });
      }
      const logs = JSON.parse(
        localStorage.getItem("networkk_subscription_requests") || "[]"
      );
      logs.push({ planId: plan.id, planName: plan.name, at: new Date().toISOString() });
      localStorage.setItem(
        "networkk_subscription_requests",
        JSON.stringify(logs.slice(-25))
      );
    } catch (e) {
      console.warn("subscription log failed", e);
    }

    const text = encodeURIComponent(plan.message);
    const deepLink = `whatsapp://send?phone=${PHONE}&text=${text}`;
    const webLink = `https://wa.me/${PHONE}?text=${text}`;

    try {
      // Try native deep link first via hidden iframe (mobile), then fallback to web
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      let opened = false;

      if (isMobile) {
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = deepLink;
        document.body.appendChild(iframe);
        setTimeout(() => document.body.removeChild(iframe), 800);
      }

      const win = window.open(webLink, "_blank", "noopener,noreferrer");
      if (win) opened = true;

      if (!opened) throw new Error("popup blocked");
      toast.success("Opening WhatsApp…", { description: plan.name });
      onOpenChange(false);
    } catch (err) {
      try {
        await navigator.clipboard.writeText(PHONE.replace(/^964/, "+964 "));
        toast.error("WhatsApp is unavailable. The phone number has been copied.");
      } catch {
        toast.error("WhatsApp is unavailable. Please contact " + DISPLAY_PHONE);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyNumber = async () => {
    await navigator.clipboard.writeText(DISPLAY_PHONE);
    toast.success("Phone number copied");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900 p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {plan && (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header banner */}
              <div className="relative px-6 pt-8 pb-6 bg-gradient-to-br from-emerald-500/20 via-emerald-500/5 to-transparent">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
                  <MessageCircle className="h-7 w-7 text-emerald-400" />
                </div>
                <DialogHeader className="mt-4 text-center">
                  <DialogTitle className="text-xl font-semibold text-white">
                    Continue on WhatsApp
                  </DialogTitle>
                  <DialogDescription className="text-white/60">
                    Our team will confirm your subscription in minutes.
                  </DialogDescription>
                </DialogHeader>
              </div>

              {/* Plan summary */}
              <div className="px-6 pb-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-white/50">
                        Selected plan
                      </p>
                      <p className="mt-0.5 text-base font-semibold text-white">
                        {plan.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/50">Monthly</p>
                      <p className="text-lg font-bold text-emerald-400">
                        {plan.price === "custom" ? "Custom" : `$${plan.price}`}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-white/70">{plan.description}</p>
                </div>

                <button
                  onClick={copyNumber}
                  className="mt-3 flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5 text-sm text-white/70 hover:bg-white/[0.05] transition"
                >
                  <span className="flex items-center gap-2">
                    <Copy className="h-3.5 w-3.5" />
                    {DISPLAY_PHONE}
                  </span>
                  <span className="text-xs text-white/40">tap to copy</span>
                </button>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 p-6 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="rounded-2xl text-white/80 hover:bg-white/5 hover:text-white"
                >
                  <X className="mr-1 h-4 w-4" /> Cancel
                </Button>
                <Button
                  onClick={openWhatsApp}
                  disabled={loading}
                  className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-semibold text-white shadow-lg hover:opacity-95"
                >
                  {loading ? (
                    <Check className="mr-1 h-4 w-4" />
                  ) : (
                    <MessageCircle className="mr-1 h-4 w-4" />
                  )}
                  Continue to WhatsApp
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export const WHATSAPP_PLANS: Record<string, WhatsAppPlan> = {
  plus: {
    id: "plus",
    name: "Networkk Plus",
    price: 5,
    description: "Ad-free experience, Plus badge, 4K uploads and premium themes.",
    message: "Hello, I would like to subscribe to Networkk Plus.",
  },
  creator: {
    id: "creator",
    name: "Networkk Creator",
    price: 15,
    description: "Monetization, analytics, and pro creator tools.",
    message: "Hello, I would like to subscribe to Networkk Creator.",
  },
  business: {
    id: "business",
    name: "Networkk Business",
    price: 49,
    description: "Business verification, dashboard, ads and team tools.",
    message: "Hello, I would like to subscribe to Networkk Business.",
  },
  government: {
    id: "government",
    name: "Networkk Government",
    price: "custom",
    description: "Official verification, broadcasts, and government services.",
    message:
      "Hello, I would like to subscribe to Networkk Government.\nPlease contact me with pricing and setup details.",
  },
};
