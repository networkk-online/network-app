import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);

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
    // Clean up any previously-registered worker in preview/iframe
    navigator.serviceWorker.getRegistrations?.().then((rs) => rs.forEach((r) => r.unregister()));
  }
}
