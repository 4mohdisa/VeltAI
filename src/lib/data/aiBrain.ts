// AI brain data hooks — the seam between the AI screens and the backend. Every
// hook tries the API on mount and degrades to an empty/null state on any
// failure (no throws), so the screens render their empty/loading/not-enough-data
// states with or without a backend. See src/lib/api ai.* for the endpoint
// reconciliation (anomalies + PATCH mark-shown/engaged have no server route and
// resolve to empty/no-op).
import { useCallback, useEffect, useRef, useState } from 'react';

import { api, ApiError } from '@/lib/api';
import { hasAiConsent } from '@/lib/ai/consent';
import type { AIAnomaly, AIBrainProfile, AIInsight, MorningBrief } from '@/lib/types';
import { handleUpgradeRequired } from '@/lib/billing/upgradePrompt';

/** Today's morning brief, or null when there's none / not enough data. Marks it
 *  shown (best-effort) once fetched. Fetches NOTHING until the one-time
 *  third-party-AI consent has been given (5.1.2(i)) — the card renders null. */
export function useMorningBrief(): { brief: MorningBrief | null; loading: boolean } {
  const [brief, setBrief] = useState<MorningBrief | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    hasAiConsent()
      .then((ok) => {
        if (!ok || !active) return null;
        return api.ai.getMorningBrief();
      })
      .then((b) => {
        if (!active || !b) return;
        setBrief(b);
        void api.ai.markBriefShown(b.id); // best-effort, no-op today
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { brief, loading };
}

type DismissType = 'insight' | 'anomaly';

/** The combined insights + anomalies feed with optimistic dismissal. */
export function useInsights(): {
  insights: AIInsight[];
  anomalies: AIAnomaly[];
  loading: boolean;
  dismiss: (id: string, type: DismissType) => void;
} {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [anomalies, setAnomalies] = useState<AIAnomaly[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([api.ai.getInsights(), api.ai.getAnomalies()])
      .then(([ins, ano]) => {
        if (!active) return;
        setInsights(ins);
        setAnomalies(ano);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const dismiss = useCallback((id: string, type: DismissType) => {
    // Optimistic local removal, then fire the API call (swallowing failures).
    if (type === 'insight') {
      setInsights((prev) => prev.filter((i) => i.id !== id));
      void api.ai.dismissInsight(id).catch(() => undefined);
    } else {
      setAnomalies((prev) => prev.filter((a) => a.id !== id));
      void api.ai.dismissAnomaly(id).catch(() => undefined);
    }
  }, []);

  return { insights, anomalies, loading, dismiss };
}

/** The learned brain profile, with an explicit not-enough-data flag. */
export function useBrainProfile(): {
  profile: AIBrainProfile | null;
  loading: boolean;
  notEnoughData: boolean;
} {
  const [profile, setProfile] = useState<AIBrainProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.ai
      .getProfile()
      .then((p) => {
        if (active) setProfile(p);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const notEnoughData = profile === null || profile.not_enough_data === true;
  return { profile, loading, notEnoughData };
}

/** One-shot AI query. `ask` resolves the answer text (or a friendly message);
 *  `unavailable` becomes true on a 503 (ANTHROPIC_API_KEY unset) or any error. */
export function useAIQuery(): {
  ask: (question: string) => Promise<string>;
  loading: boolean;
  unavailable: boolean;
} {
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const ask = useCallback(async (question: string): Promise<string> => {
    if (mounted.current) {
      setLoading(true);
      setUnavailable(false);
    }
    try {
      const res = await api.ai.query(question, 'ai-query');
      if (res.state === 'not_enough_data') {
        return 'Keep logging for a few days and I can answer questions about your data.';
      }
      return res.answer ?? '';
    } catch (e) {
      // 402 = the server's entitlement gate refused: present the paywall rather
      // than the "AI unavailable" state, which would be a lie.
      if (await handleUpgradeRequired(e)) return '';
      // 503 = AI unavailable; any other error also surfaces the unavailable UI.
      if (mounted.current) setUnavailable(true);
      if (e instanceof ApiError && e.status === 503) return '';
      return '';
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  return { ask, loading, unavailable };
}
