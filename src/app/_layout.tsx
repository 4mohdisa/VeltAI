// Root navigator. We own all chrome — headers are off everywhere and screens
// render their own NavBar. Wraps the tree in the providers the app needs:
// Clerk (when a key is configured), app state, gesture handler and safe-area.
// Server state lives in the zustand stores behind @/lib/data.
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { AppState as RNAppState, Text as RNText, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppStateProvider } from '@/lib/auth/appState';
import { ClerkBridge } from '@/lib/auth/ClerkBridge';
import { DebugOverlay } from '@/debug/DebugOverlay';
import { CLERK_PUBLISHABLE_KEY, clerkTokenCache, isClerkEnabled } from '@/lib/auth/clerkEnv';
import { configurationErrors } from '@/lib/config/requiredEnv';
import { configurePurchases } from '@/lib/billing/purchases';
import { ToastHost } from '@/components/display/ToastHost';
import { color, sheet } from '@/lib/design/tokens';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { flush as flushOfflineQueue, loadQueue } from '@/lib/offline/queue';
import { flushAnalytics, initAnalytics, track } from '@/lib/analytics';
import '@/lib/i18n'; // initialise i18next before any screen renders

// AuthGate mounts ClerkProvider only when a publishable key exists. With no key
// in a DEV build (Expo Go, keys not yet issued) the app runs in local dev auth
// mode and the tree renders directly — no crash, everything navigable. With no
// key in a RELEASE build this is a packaging mistake, and silently treating the
// user as an authenticated dev session would be an auth bypass — fail loudly
// instead. ClerkLoaded gates the initial render so no screen flashes before
// auth status is known.
function AuthGate({ children }: { children: ReactNode }) {
  // ONE gate for every required variable, naming each one. Previously this
  // checked the API URL and the Clerk key separately and said only "without a
  // server address" / "without its authentication keys" — which does not tell
  // whoever packaged the build WHICH variable to set, and did not cover
  // RevenueCat at all, so a build with no purchase path shipped silently
  // (audit 2026-08-09).
  const problems = configurationErrors();
  if (problems.length > 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 32, backgroundColor: color.white }}>
        <RNText style={{ fontSize: 17, fontWeight: '600', marginBottom: 8 }}>Configuration error</RNText>
        <RNText style={{ fontSize: 15, color: '#666', marginBottom: 12 }}>
          This build is missing configuration and cannot run. Rebuild with these set:
        </RNText>
        {problems.map((p) => (
          <RNText key={p} style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>
            {`• ${p}`}
          </RNText>
        ))}
      </View>
    );
  }
  if (!isClerkEnabled()) {
    // Only reachable in a DEV build now — a distributable one was stopped
    // above. Local dev auth mode keeps Expo Go navigable.
    return <>{children}</>;
  }
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={clerkTokenCache}>
      <ClerkLoaded>{children}</ClerkLoaded>
    </ClerkProvider>
  );
}

// Native detented sheet: white, grabber visible, 28px corners (UI & Design System).
const sheetOptions = {
  presentation: 'formSheet' as const,
  sheetGrabberVisible: sheet.grabberVisible,
  sheetCornerRadius: sheet.cornerRadius,
  sheetAllowedDetents: [0.6, 1] as number[],
  contentStyle: { backgroundColor: color.white },
};

export default function RootLayout() {
  // SF Pro Rounded — powers the rounded stat numbers (textStyle resolver maps
  // family:'rounded' → these faces by weight). Render regardless; text swaps to
  // the rounded face the moment it loads (no blank-screen gate).
  useFonts({
    'SFProRounded-Semibold': require('../../assets/fonts/SF-Pro-Rounded-Semibold.otf'),
    'SFProRounded-Bold': require('../../assets/fonts/SF-Pro-Rounded-Bold.otf'),
    'SFProRounded-Heavy': require('../../assets/fonts/SF-Pro-Rounded-Heavy.otf'),
  });

  // Reduce Motion (HIG §7.3): replace slide push transitions with a fade.
  const reduceMotion = useReduceMotion();

  // Rehydrate + attempt to flush any offline-queued writes on launch, and
  // initialize RevenueCat (no-op in billing-disabled dev mode).
  //
  // The flush used to run EXACTLY ONCE per launch, and the comment here claimed
  // "screens can also trigger one on mount" — no screen ever did, and there is
  // no NetInfo dependency. So a user who lost signal, logged meals, and walked
  // back into coverage sat on "N changes waiting to sync" until they force-quit
  // and relaunched. Foregrounding is the cheap, dependency-free reconnect proxy:
  // it catches the walk-back-into-coverage case and the overnight case without
  // adding a connectivity library.
  useEffect(() => {
    configurePurchases();
    // Analytics rides the same reconnect moment: after the offline queue's
    // opportunistic flush, send any buffered/persisted product events too.
    //
    // session_started is fired AFTER initAnalytics resolves, not beside it:
    // initAnalytics is what re-applies the persisted consent, and firing before
    // it means the very first event of a launch is written while the store
    // still holds the default. Under opt-in that default is false, so the event
    // would simply be dropped and every session would go uncounted.
    void initAnalytics().then(() => track('session_started'));
    const sync = () =>
      void loadQueue()
        .then(() => flushOfflineQueue())
        .then(() => flushAnalytics());
    sync();
    const sub = RNAppState.addEventListener('change', (next) => {
      if (next === 'active') sync();
    });
    return () => sub.remove();
  }, []);

  return (
    <ErrorBoundary>
      <AuthGate>
        <AppStateProvider>
          {isClerkEnabled() ? <ClerkBridge /> : null}
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
        <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: color.white },
              animation: reduceMotion ? 'fade' : 'default',
            }}
          >
            <Stack.Screen name="index" />
            {/* Backend-wired onboarding flow (its own stack); gated by app/index.tsx. */}
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" />
            {/* Full-screen camera flows — present as full-screen modals so they
                cover completely (no torn-sheet / content bleeding through the
                top). NOTE: expo-camera is NOT in the current dev binary, so these
                cannot render until a native rebuild — visual QA is deferred. */}
            <Stack.Screen name="food/photo-capture" options={{ presentation: 'fullScreenModal', animation: reduceMotion ? 'fade' : 'slide_from_bottom' }} />
            <Stack.Screen name="food/barcode-scan" options={{ presentation: 'fullScreenModal', animation: reduceMotion ? 'fade' : 'slide_from_bottom' }} />
            <Stack.Screen name="food/label-scan" options={{ presentation: 'fullScreenModal', animation: reduceMotion ? 'fade' : 'slide_from_bottom' }} />
            {/* Native detented sheets */}
            {/* Log session sizes to its content: at the default [0.6, 1] detents the
                design's save pill (V1) sat below the fold. 'fitToContents' is the
                same rule food/add already uses. */}
            <Stack.Screen name="gym/log-session" options={{ ...sheetOptions, sheetAllowedDetents: 'fitToContents' }} />
            <Stack.Screen name="gym/freeze" options={{ ...sheetOptions, sheetAllowedDetents: [0.5] }} />
            {/* Add-meal: size to the content so all five tiles show fully. */}
            <Stack.Screen name="food/add" options={{ ...sheetOptions, sheetAllowedDetents: 'fitToContents' }} />
            {/* Quick Add calories — compact sheet (calories + meal). */}
            <Stack.Screen name="food/quick-add" options={{ ...sheetOptions, sheetAllowedDetents: 'fitToContents' }} />
            <Stack.Screen name="food/custom-food" options={{ ...sheetOptions, sheetAllowedDetents: [0.95] }} />
            {/* The ONE food-detail sheet: a search hit, a barcode product, a
                saved dish, a logged row and a scan rename all land here. Tall
                enough for the fields + keyboard, expandable to full. */}
            <Stack.Screen name="food/detail" options={{ ...sheetOptions, sheetAllowedDetents: [0.75, 1] }} />
            <Stack.Screen name="food/saved" options={{ ...sheetOptions, sheetAllowedDetents: [0.7, 1] }} />
            {/* Month day-picker for the food log — tall enough for a 6-row grid. */}
            <Stack.Screen name="food/calendar" options={{ ...sheetOptions, sheetAllowedDetents: [0.75] }} />
        </Stack>
            <ToastHost />
            {/* Debug capture overlay. Renders nothing unless
                EXPO_PUBLIC_DEBUG_CAPTURE=1, and metro.config.js keeps the whole
                implementation out of the bundle graph when it is off. */}
            <DebugOverlay />
          </SafeAreaProvider>
        </GestureHandlerRootView>
        </AppStateProvider>
      </AuthGate>
    </ErrorBoundary>
  );
}
