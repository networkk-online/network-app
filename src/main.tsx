import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'

// Mark <html> as running inside Capacitor so CSS can apply native-only rules
try {
  // @ts-ignore
  const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
  if (isNative) document.documentElement.classList.add('capacitor-native');
} catch {}

// Block browser pull-to-refresh & rubber-band overscroll at document level
document.addEventListener('touchmove', (e) => {
  // Only prevent when the target isn't inside a scrollable region
  const t = e.target as HTMLElement | null;
  if (!t) return;
  const scrollable = t.closest('[data-scrollable],.overflow-auto,.overflow-y-auto,.overflow-scroll,.overflow-y-scroll,textarea,input');
  if (!scrollable && document.scrollingElement && document.scrollingElement.scrollTop <= 0) {
    // At top of page — prevent PTR
    if ((e as TouchEvent).touches[0]?.clientY > 10) e.preventDefault();
  }
}, { passive: false });

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);


// PWA: register service worker (skip in iframe / Lovable preview to avoid stale-cache issues)
if ('serviceWorker' in navigator) {
  const inIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
  const host = window.location.hostname;
  const isPreview = host.includes('lovableproject.com') || host.includes('id-preview--') || host === 'localhost' || host === '127.0.0.1';
  if (!inIframe && !isPreview) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('SW registration failed', err));
    });
  } else {
    navigator.serviceWorker.getRegistrations?.().then((rs) => rs.forEach((r) => r.unregister()));
  }
}
