import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import './lib/theme';
import App from './App.tsx';
import './index.css';

// In production, register Service Worker for offline PWA caching.
// In development, unregister any stale service workers that might cache mismatched Vite module chunks.
if (import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.info('PWA: New content available, updating service worker cache.');
    },
    onOfflineReady() {
      console.info('PWA: Application offline cache ready for mobile network resilience.');
    },
  });
} else if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().catch(() => {});
    }
  }).catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
