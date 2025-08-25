import { StrictMode } from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Silencer: filter out errors originating from known noisy Chrome extensions in local dev
// This avoids console spam like net::ERR_FILE_NOT_FOUND and undefined length errors from extension scripts
(() => {
  if (typeof window === 'undefined') return;
  const EXT_ORIGINS = [
    'chrome-extension://pejdijmoenmkgeppbflobdenhhabjlaj/'
  ];

  const isFromSilencedOrigin = (msg?: any) => {
    if (!msg || typeof msg !== 'string') return false;
    return EXT_ORIGINS.some((o) => msg.includes(o));
  };

  const origError = console.error.bind(console);
  console.error = (...args: any[]) => {
    try {
      const joined = args.map((a) => (typeof a === 'string' ? a : (a && a.stack) || '')).join(' ');
      if (isFromSilencedOrigin(joined)) return; // swallow extension errors
    } catch {}
    origError(...args);
  };

  const origWarn = console.warn?.bind(console);
  if (origWarn) {
    console.warn = (...args: any[]) => {
      try {
        const joined = args.map((a) => (typeof a === 'string' ? a : (a && a.stack) || '')).join(' ');
        if (isFromSilencedOrigin(joined)) return; // swallow extension warnings
      } catch {}
      origWarn(...args);
    };
  }

  window.addEventListener('error', (e) => {
    try {
      const msg = `${e.message || ''} ${(e.filename || '')}`;
      if (isFromSilencedOrigin(msg)) {
        e.preventDefault();
      }
    } catch {}
  }, true);

  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    const reason: any = e.reason;
    const msg = typeof reason === 'string' ? reason : (reason && (reason.stack || reason.message)) || '';
    if (isFromSilencedOrigin(msg)) {
      e.preventDefault();
    }
  });
})();
