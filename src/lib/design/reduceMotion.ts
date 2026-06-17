// Reduce Motion (HIG §7.3 / §9B) — the single source of truth the whole app reads
// so animated components can tighten/disable motion when the user asks for it.
// Reads AccessibilityInfo.isReduceMotionEnabled() and subscribes to live changes.
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (active) setReduce(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  return reduce;
}
