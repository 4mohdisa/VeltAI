// Entry gate. Decides between the main tabs and the onboarding flow:
//   1. If the persisted onboarding store (or the legacy secure-store flag) says
//      completed → main app.
//   2. Otherwise ask the backend (GET /api/onboarding). completed=true → mark
//      the store and proceed; completed=false or a network/401 error → onboarding.
// The onboarding flow lives at /onboarding (a stack above the tabs); once
// completed it never shows again.
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, type Href } from 'expo-router';

import { color } from '@/lib/design/tokens';
import { api } from '@/lib/api';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { getHasCompletedOnboarding } from '@/lib/storage/secureStore';

type Destination = '/(tabs)' | '/onboarding';

export default function Index() {
  const [destination, setDestination] = useState<Destination | null>(null);

  useEffect(() => {
    let active = true;
    const decide = async () => {
      const store = useOnboardingStore.getState();

      // Wait for the persisted store to finish hydrating so we don't flash
      // onboarding at a returning user whose `completed` hasn't loaded yet.
      if (!useOnboardingStore.persist.hasHydrated()) {
        await new Promise<void>((resolve) => {
          const unsub = useOnboardingStore.persist.onFinishHydration(() => {
            unsub?.();
            resolve();
          });
        });
      }

      if (useOnboardingStore.getState().completed || (await getHasCompletedOnboarding())) {
        if (active) setDestination('/(tabs)');
        return;
      }

      try {
        const onboarding = await api.onboarding.get();
        if (onboarding.completed) {
          store.markCompleted();
          if (active) setDestination('/(tabs)');
          return;
        }
      } catch {
        // Backend unreachable / not signed in → treat as not onboarded.
      }
      if (active) setDestination('/onboarding');
    };
    void decide();
    return () => {
      active = false;
    };
  }, []);

  if (destination === null) {
    return (
      <View style={{ flex: 1, backgroundColor: color.white, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={color.black} />
      </View>
    );
  }

  // Cast: /onboarding is resolved by expo-router at runtime but isn't in the
  // generated typed-route union (same seam as @/lib/nav's string→Href cast).
  return <Redirect href={destination as Href} />;
}
