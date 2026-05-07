import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISS_KEY = 'networkk_pwa_install_dismissed';

const InstallPWAButton = () => {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    // Hide if already installed / standalone
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-ignore iOS Safari
      window.navigator.standalone === true;
    if (standalone) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(ua) && !/crios|fxios/.test(ua);
    setIsIOS(iOS);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    // Show iOS hint manually since iOS doesn't fire beforeinstallprompt
    if (iOS) setVisible(true);

    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
    setShowIOSHint(false);
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSHint(true);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm z-[80] animate-in slide-in-from-bottom-4 fade-in duration-300"
      dir="rtl"
    >
      <div
        className="relative rounded-2xl border border-[#19e05b]/30 bg-black/85 backdrop-blur-2xl p-4 shadow-2xl"
        style={{ boxShadow: '0 0 28px rgba(25,224,91,0.18), inset 0 1px 0 rgba(255,255,255,0.05)' }}
      >
        <button
          onClick={dismiss}
          aria-label="إغلاق"
          className="absolute top-2 left-2 text-white/40 hover:text-white/80 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="shrink-0 h-10 w-10 rounded-xl bg-[#19e05b]/15 border border-[#19e05b]/30 flex items-center justify-center">
            <Download className="h-5 w-5 text-[#19e05b]" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white text-sm font-semibold">ثبّت Networkk</h4>
            <p className="text-white/55 text-xs mt-0.5 leading-relaxed">
              {isIOS
                ? 'أضف التطبيق لشاشتك الرئيسية لتجربة أسرع وبدون شريط متصفح.'
                : 'تطبيق سريع ومستقل على جهازك — بدون متجر تطبيقات.'}
            </p>

            {showIOSHint && isIOS && (
              <p className="mt-2 text-[11px] text-[#19e05b]/90 leading-relaxed">
                اضغط زر المشاركة <span className="font-bold">⎋</span> ثم اختر «إضافة إلى الشاشة الرئيسية».
              </p>
            )}

            <div className="mt-3 flex gap-2">
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#19e05b] text-black hover:bg-[#19e05b]/90 transition-colors"
              >
                {isIOS ? 'كيف أثبّت؟' : 'تثبيت الآن'}
              </button>
              <button
                onClick={dismiss}
                className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              >
                لاحقاً
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPWAButton;
