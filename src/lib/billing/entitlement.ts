// useEntitlement — the ONE way the app asks "is this user pro?".
//
// Real mode: reads Purchases.getCustomerInfo() and stays live via the
// customerInfo update listener. Billing-disabled dev mode: returns the dev flag
// (default entitled) so Expo Go stays fully usable.
//
// Gate example (the pattern for any paid feature):
//   const { isEntitled } = useEntitlement();
//   if (!isEntitled) return <UpgradePrompt />;   // or presentPaywall()
import { useCallback, useEffect, useState } from 'react';

import {
  getCustomerInfo,
  hasProEntitlement,
  isBillingEnabled,
  isDevEntitled,
  subscribeCustomerInfo,
} from './purchases';

export function useEntitlement(): { isEntitled: boolean; loading: boolean; refresh: () => void } {
  const [isEntitled, setIsEntitled] = useState(() => (isBillingEnabled() ? false : isDevEntitled()));
  const [loading, setLoading] = useState(isBillingEnabled());
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!isBillingEnabled()) {
      // Dev mode: the flag IS the entitlement; stay live on flag flips.
      return subscribeCustomerInfo(() => setIsEntitled(isDevEntitled()));
    }
    let alive = true;
    getCustomerInfo()
      .then((info) => {
        if (alive) setIsEntitled(hasProEntitlement(info));
      })
      .catch(() => {
        if (alive) setIsEntitled(false);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    const unsub = subscribeCustomerInfo((info) => {
      if (alive && info) setIsEntitled(hasProEntitlement(info));
    });
    return () => {
      alive = false;
      unsub();
    };
  }, [nonce]);

  const refresh = useCallback(() => {
    setLoading(isBillingEnabled());
    setNonce((n) => n + 1);
  }, []);

  return { isEntitled, loading, refresh };
}
