import { Brain } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ScreenshotOverlayProps {
  show: boolean;
  onHide: () => void;
}

export const ScreenshotOverlay = ({ show, onHide }: ScreenshotOverlayProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onHide();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-primary to-primary-glow p-6 rounded-2xl shadow-2xl animate-in zoom-in duration-300">
        <div className="flex flex-col items-center gap-4 text-white">
          <div className="animate-bounce">
            <Brain className="w-16 h-16" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold mb-1">تم اكتشاف لقطة شاشة!</h3>
            <p className="text-sm opacity-90">Network - AI Powered</p>
          </div>
        </div>
      </div>
    </div>
  );
};