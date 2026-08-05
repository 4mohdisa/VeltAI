'use client';

// Google Analytics, the privacy-forward way:
//   * loads ONLY when NEXT_PUBLIC_GA_ID is set at build time,
//   * AND the visitor's browser doesn't send Do Not Track / GPC,
//   * AND the visitor accepted the one-line consent note (stored locally).
// No GA id → this renders nothing and logs nothing (clean dev).
import { useEffect, useState } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CONSENT_KEY = 'lume-analytics-consent'; // 'yes' | 'no'

function dntEnabled(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
  return nav.doNotTrack === '1' || nav.msDoNotTrack === '1' || nav.globalPrivacyControl === true;
}

export function ConsentAnalytics() {
  // 'pending' until we read localStorage on the client (avoids hydration mismatch).
  const [consent, setConsent] = useState<'pending' | 'ask' | 'yes' | 'no'>('pending');

  useEffect(() => {
    if (!GA_ID || dntEnabled()) {
      setConsent('no');
      return;
    }
    const stored = window.localStorage.getItem(CONSENT_KEY);
    setConsent(stored === 'yes' ? 'yes' : stored === 'no' ? 'no' : 'ask');
  }, []);

  const choose = (value: 'yes' | 'no') => {
    try {
      window.localStorage.setItem(CONSENT_KEY, value);
    } catch {
      // private mode — session-only choice is fine
    }
    setConsent(value);
  };

  if (!GA_ID) return null;

  return (
    <>
      {consent === 'yes' ? <GoogleAnalytics gaId={GA_ID} /> : null}
      {consent === 'ask' ? (
        <div className="consent" role="region" aria-label="Analytics consent">
          <span>
            We&apos;d like to count page visits with Google Analytics — anonymous stats, nothing
            else. OK?
          </span>
          <span style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={() => choose('no')}>
              No thanks
            </button>
            <button type="button" className="primary" onClick={() => choose('yes')}>
              OK
            </button>
          </span>
        </div>
      ) : null}
    </>
  );
}
