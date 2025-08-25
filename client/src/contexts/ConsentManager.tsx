import React, { createContext, useContext, useEffect, useState } from 'react';

type ConsentCategories = 'necessary' | 'analytics' | 'marketing';
export type ConsentState = Record<ConsentCategories, boolean> & { region?: 'US'|'EU'|'Other' };

const DEFAULT_CONSENT: ConsentState = { necessary: true, analytics: false, marketing: false, region: 'US' };

const STORAGE_KEY = 'cookie_consent_v1';

const ConsentContext = createContext<{
  consent: ConsentState;
  setConsent: (c: ConsentState) => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  showBanner: boolean;
  setShowBanner: (v: boolean) => void;
} | null>(null);

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider');
  return ctx;
}

// Simple region detection stub; could be improved by server-provided header
function detectRegion(): 'US'|'EU'|'Other' {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (/Europe\//.test(tz)) return 'EU';
    if (/America\//.test(tz)) return 'US';
  } catch {}
  return 'Other';
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [consent, setConsentState] = useState<ConsentState>(() => {
    if (typeof window === 'undefined') return DEFAULT_CONSENT;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return { ...DEFAULT_CONSENT, region: detectRegion() };
  });

  const setConsent = (c: ConsentState) => {
    setConsentState(c);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch {}
    // Persist to backend for logging (best-effort)
    fetch('/api/cookie-consent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(c) }).catch(()=>{});
  };

  useEffect(() => {
  const onOpen = () => setSettingsOpen(true);
    document.addEventListener('open-cookie-settings', onOpen as any);
    return () => document.removeEventListener('open-cookie-settings', onOpen as any);
  }, []);

  // Script gating example: window.dataLayer/analytics only if analytics consent true
  useEffect(() => {
    if (consent.analytics) {
      // Initialize your analytics here, e.g., gtag/gtm with Consent Mode if included
      // This is intentionally left minimal to avoid loading third-party scripts in code.
    }
  }, [consent.analytics]);

  // Banner visibility: show when no stored consent and region requires opt-in
  const [showBanner, setShowBanner] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    return !stored && detectRegion() === 'EU';
  });

  return (
    <ConsentContext.Provider value={{ consent, setConsent, settingsOpen, setSettingsOpen, showBanner, setShowBanner }}>
      {children}
      <CookieBanner />
      <CookieSettingsModal />
    </ConsentContext.Provider>
  );
}

function CookieBanner() {
  const { showBanner, setShowBanner, consent, setConsent, setSettingsOpen } = useConsent();
  if (!showBanner) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-4">
      <div className="max-w-3xl mx-auto bg-white border rounded-lg shadow-xl p-4 flex flex-col md:flex-row md:items-center gap-4 dark:bg-slate-900 dark:border-slate-800">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          We use cookies to make this site work and to improve your experience. You can accept, reject, or customize.
        </p>
        <div className="flex gap-2 ml-auto">
          <button className="px-3 py-2 text-sm border rounded hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-700 dark:text-slate-100" onClick={() => setShowBanner(false)}>Reject</button>
          <button className="px-3 py-2 text-sm border rounded hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-700 dark:text-slate-100" onClick={() => { setConsent({ ...consent, analytics: true, marketing: true }); setShowBanner(false); }}>Accept All</button>
          <button className="px-3 py-2 text-sm bg-slate-900 text-white rounded dark:bg-slate-100 dark:text-slate-900" onClick={() => { setSettingsOpen(true); setShowBanner(false); }}>Customize</button>
        </div>
      </div>
    </div>
  );
}

function CookieSettingsModal() {
  const { settingsOpen, setSettingsOpen, consent, setConsent, setShowBanner } = useConsent();
  const [local, setLocal] = useState(consent);

  useEffect(() => setLocal(consent), [settingsOpen]);

  return !settingsOpen ? null : (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-6 border dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800">
        <h2 className="text-lg font-semibold mb-1">Cookie Settings</h2>
        <p className="text-sm text-slate-600 mb-4 dark:text-slate-400">Manage your preferences. Necessary cookies are always on.</p>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span>Analytics</span>
            <input type="checkbox" checked={local.analytics} onChange={e => setLocal({ ...local, analytics: e.target.checked })} />
          </label>
          <label className="flex items-center justify-between">
            <span>Marketing</span>
            <input type="checkbox" checked={local.marketing} onChange={e => setLocal({ ...local, marketing: e.target.checked })} />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button className="px-3 py-2 text-sm border rounded hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-700" onClick={() => setSettingsOpen(false)}>Cancel</button>
          <button className="px-3 py-2 text-sm bg-slate-900 text-white rounded dark:bg-slate-100 dark:text-slate-900" onClick={() => { setConsent(local); setSettingsOpen(false); setShowBanner(false); }}>Save</button>
        </div>
      </div>
    </div>
  );
}
