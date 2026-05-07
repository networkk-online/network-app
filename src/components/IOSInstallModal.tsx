import { X, Share, Plus } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const IOSInstallModal = ({ open, onClose }: Props) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      dir="rtl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-sm mx-0 sm:mx-4 mb-0 sm:mb-0 rounded-t-3xl sm:rounded-3xl border border-[#19e05b]/30 bg-black/95 backdrop-blur-2xl p-6 animate-in slide-in-from-bottom-6 duration-300"
        style={{
          boxShadow: '0 0 40px rgba(25,224,91,0.18), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <button
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute top-3 left-3 text-white/40 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="h-12 w-12 rounded-2xl bg-[#19e05b]/15 border border-[#19e05b]/30 flex items-center justify-center shrink-0">
            <img src="/logo192.png" alt="Networkk" className="h-8 w-8 rounded-lg" />
          </div>
          <div>
            <h3 className="text-white text-base font-bold">ثبّت Networkk على iPhone</h3>
            <p className="text-white/50 text-xs mt-0.5">خطوتان فقط لإضافته للشاشة الرئيسية</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Step 1 */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
            <div className="shrink-0 h-7 w-7 rounded-full bg-[#19e05b] text-black text-xs font-bold flex items-center justify-center">
              1
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium flex items-center gap-1.5">
                اضغط زر المشاركة
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-white/10 border border-white/15">
                  <Share className="h-3.5 w-3.5 text-[#19e05b]" />
                </span>
              </p>
              <p className="text-white/50 text-xs mt-1 leading-relaxed">
                في شريط أدوات Safari بأسفل الشاشة (أو أعلاها على iPad).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
            <div className="shrink-0 h-7 w-7 rounded-full bg-[#19e05b] text-black text-xs font-bold flex items-center justify-center">
              2
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium flex items-center gap-1.5">
                اختر «إضافة إلى الشاشة الرئيسية»
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-white/10 border border-white/15">
                  <Plus className="h-3.5 w-3.5 text-[#19e05b]" />
                </span>
              </p>
              <p className="text-white/50 text-xs mt-1 leading-relaxed">
                ثم اضغط «إضافة» في الأعلى — وسيظهر التطبيق على شاشتك الرئيسية.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2 p-3 rounded-xl bg-[#19e05b]/[0.06] border border-[#19e05b]/20">
          <span className="text-[#19e05b] text-base leading-none mt-0.5">ⓘ</span>
          <p className="text-[11px] text-white/65 leading-relaxed">
            هذه الميزة متوفرة فقط في متصفّح <span className="text-white font-semibold">Safari</span> على iPhone وiPad.
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-3 rounded-2xl bg-[#19e05b] text-black text-sm font-bold hover:bg-[#19e05b]/90 transition-colors"
        >
          فهمت
        </button>
      </div>
    </div>
  );
};

export default IOSInstallModal;
