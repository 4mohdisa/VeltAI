// Energy-balance data hooks — the seam between the dashboard card / energy screen
// and GET /api/energy-balance[/week]. Both degrade to null on any failure (no
// throws), so the UI renders its empty state with or without a backend. loading
// starts true and only clears asynchronously (in .finally), so there's no
// synchronous setState inside a useEffect body.
import { useCallback, useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { todayISO } from './mappers';
import type { EnergyBalance, WeeklyEnergyBalance } from '@/lib/types';

function useApi<T>(fetcher: () => Promise<T>, deps: readonly unknown[] = []): {
  data: T | null;
  loading: boolean;
  refetch: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    fetcher()
      .then((d) => {
        if (active) setData(d);
      })
      .catch(() => {
        if (active) setData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // fetcher is intentionally excluded — deps + nonce control re-runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const refetch = useCallback(() => {
    setLoading(true);
    setNonce((n) => n + 1);
  }, []);
  return { data, loading, refetch };
}

export function useEnergyBalance(date?: string): {
  balance: EnergyBalance | null;
  loading: boolean;
  refetch: () => void;
} {
  // Default to the DEVICE-local date: food logs are stamped with todayISO(),
  // so the balance must ask for the same day — near midnight the server's
  // calendar (LUMO_TIMEZONE) can be a day off from the user's.
  const day = date ?? todayISO();
  const { data, loading, refetch } = useApi<EnergyBalance>(() => api.energy.getBalance(day), [day]);
  return { balance: data, loading, refetch };
}

export function useEnergyWeek(): { week: WeeklyEnergyBalance | null; loading: boolean; refetch: () => void } {
  // Same local-calendar anchoring for the 7-day window.
  const end = todayISO();
  const { data, loading, refetch } = useApi<WeeklyEnergyBalance>(() => api.energy.getWeek(end), [end]);
  return { week: data, loading, refetch };
}
