// Reduce Transparency (HIG §11) — the single source of truth glass surfaces read
// so they fall back to a solid opaque background (no blur) when the user asks for
// it. Reads AccessibilityInfo.isReduceTransparencyEnabled() + live subscription.
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReduceTransparency(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceTransparencyEnabled().then((v) => {
      if (active) setReduce(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduce);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  return reduce;
}
