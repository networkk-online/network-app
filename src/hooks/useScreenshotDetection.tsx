import { useEffect } from 'react';

export const useScreenshotDetection = (onScreenshot: () => void) => {
  useEffect(() => {
    // Detect screenshot on mobile devices (visibility change)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User might be taking screenshot
        // Mobile browsers typically hide when screenshot is taken
        setTimeout(() => {
          if (!document.hidden) {
            onScreenshot();
          }
        }, 100);
      }
    };

    // Detect print screen key on desktop
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrtScn key or Cmd+Shift+3/4/5 (Mac) or Win+Shift+S
      if (
        e.key === 'PrintScreen' ||
        (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) ||
        (e.key === 's' && e.shiftKey && (e.metaKey || e.ctrlKey))
      ) {
        onScreenshot();
      }
    };

    // Detect copy to clipboard (some screenshot tools use this)
    const handleCopy = (e: ClipboardEvent) => {
      if (!window.getSelection()?.toString()) {
        // No text selected, might be screenshot
        onScreenshot();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
    };
  }, [onScreenshot]);
};