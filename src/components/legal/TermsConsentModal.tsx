import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Check, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const TERMS_VERSION = '2026-05-13';

interface Props {
  open: boolean;
  context: string; // 'live_stream' | 'apple_signin' | 'google_signin'
  onAccept: () => void;
  onCancel: () => void;
}

export const TermsConsentModal = ({ open, context, onAccept, onCancel }: Props) => {
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);

  const accept = async () => {
    if (!checked || busy) return;
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (u?.user?.id) {
        await supabase.from('compliance_logs').insert({
          user_id: u.user.id,
          document_type: 'terms_of_use',
          document_version: TERMS_VERSION,
          context,
          user_agent: navigator.userAgent.slice(0, 255),
        });
      }
      onAccept();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.96 }}
            className="w-full max-w-md bg-white/[0.05] backdrop-blur-2xl border border-[#39FF14]/30 rounded-3xl p-6 shadow-[0_0_60px_rgba(57,255,20,0.15)]"
            dir="rtl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#39FF14]/15 flex items-center justify-center border border-[#39FF14]/40">
                <Shield className="w-5 h-5 text-[#39FF14]" />
              </div>
              <h3 className="text-white font-bold text-lg">شروط الاستخدام</h3>
            </div>

            <div className="text-white/80 text-sm leading-relaxed space-y-3 mb-5 max-h-64 overflow-y-auto pr-1">
              <p>
                بالمتابعة، أنت توافق على{' '}
                <a href="/terms" target="_blank" className="text-[#39FF14] underline inline-flex items-center gap-1">
                  شروط الاستخدام <ExternalLink className="w-3 h-3" />
                </a>{' '}
                و{' '}
                <a href="/privacy" target="_blank" className="text-[#39FF14] underline inline-flex items-center gap-1">
                  سياسة الخصوصية <ExternalLink className="w-3 h-3" />
                </a>{' '}
                الخاصة بمنصة Network.
              </p>
              <ul className="list-disc pr-5 space-y-1.5 text-white/70 text-xs">
                <li>تخصم المنصة عمولة 20% على هدايا البث المباشر.</li>
                <li>الجواهر (Gems) أصول رقمية داخل المنصة وغير قابلة للاسترداد النقدي.</li>
                <li>سياسة عدم تسامح مطلق مع الابتزاز الإلكتروني — يتم التحقيق في جميع البلاغات.</li>
                <li>قد يُسجَّل عنوان IP وبصمة الجهاز لأغراض الأمان.</li>
              </ul>
            </div>

            <label className="flex items-start gap-3 mb-5 cursor-pointer select-none">
              <span
                onClick={() => setChecked(c => !c)}
                className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${
                  checked ? 'bg-[#39FF14] border-[#39FF14]' : 'border-white/30 bg-white/5'
                }`}
              >
                {checked && <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />}
              </span>
              <span className="text-white/85 text-sm">
                قرأت ووافقت على شروط الاستخدام وسياسة الخصوصية
              </span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
              >
                إلغاء
              </button>
              <button
                disabled={!checked || busy}
                onClick={accept}
                className="flex-1 py-3 rounded-xl bg-[#39FF14] text-black font-black text-sm shadow-[0_0_25px_rgba(57,255,20,0.4)] disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {busy ? '...' : 'موافق ومتابعة'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const TERMS_VERSION_CURRENT = TERMS_VERSION;
