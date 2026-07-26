// Root navigator. We own all chrome — headers are off everywhere and screens
// render their own NavBar. Wraps the tree in the providers the app needs:
// Clerk (when a key is configured), app state, gesture handler and safe-area.
// Server state lives in the zustand stores behind @/lib/data.
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Text as RNText, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppStateProvider } from '@/lib/auth/appState';
import { ClerkBridge } from '@/lib/auth/ClerkBridge';
import { CLERK_PUBLISHABLE_KEY, clerkTokenCache, isClerkEnabled } from '@/lib/auth/clerkEnv';
import { isDevBuild } from '@/lib/env';
import { configurePurchases } from '@/lib/billing/purchases';
import { ToastHost } from '@/components/display/ToastHost';
import { color, sheet } from '@/lib/design/tokens';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { flush as flushOfflineQueue, loadQueue } from '@/lib/offline/queue';
import '@/lib/i18n'; // initialise i18next before any screen renders

// AuthGate mounts ClerkProvider only when a publishable key exists. With no key
// in a DEV build (Expo Go, keys not yet issued) the app runs in local dev auth
// mode and the tree renders directly — no crash, everything navigable. With no
// key in a RELEASE build this is a packaging mistake, and silently treating the
// user as an authenticated dev session would be an auth bypass — fail loudly
// instead. ClerkLoaded gates the initial render so no screen flashes before
// auth status is known.
function AuthGate({ children }: { children: ReactNode }) {
  if (!isClerkEnabled()) {
    if (!isDevBuild()) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 32, backgroundColor: color.white }}>
          <RNText style={{ fontSize: 17, fontWeight: '600', marginBottom: 8 }}>Configuration error</RNText>
          <RNText style={{ fontSize: 15, color: '#666' }}>
            This build was packaged without its authentication keys and cannot sign you in.
            Please update the app; if the problem persists, contact support.
          </RNText>
        </View>
      );
    }
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
  // initialize RevenueCat (no-op in billing-disabled dev mode). No NetInfo dep —
  // the flush is opportunistic; screens can also trigger one on mount.
  useEffect(() => {
    configurePurchases();
    void loadQueue().then(() => flushOfflineQueue());
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
            <Stack.Screen name="food/photo-capture" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="food/barcode-scan" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="food/label-scan" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
            {/* Native detented sheets */}
            <Stack.Screen name="gym/log-session" options={sheetOptions} />
            <Stack.Screen name="gym/freeze" options={{ ...sheetOptions, sheetAllowedDetents: [0.5] }} />
            {/* Add-meal: size to the 2×2 grid so all four options show fully. */}
            <Stack.Screen name="food/add" options={{ ...sheetOptions, sheetAllowedDetents: 'fitToContents' }} />
            {/* Quick Add calories — compact sheet (calories + optional label + meal). */}
            <Stack.Screen name="food/quick-add" options={{ ...sheetOptions, sheetAllowedDetents: [0.6] }} />
            <Stack.Screen name="food/custom-food" options={{ ...sheetOptions, sheetAllowedDetents: [0.95] }} />
            <Stack.Screen name="food/barcode-confirm" options={{ ...sheetOptions, sheetAllowedDetents: [0.6] }} />
            <Stack.Screen name="food/serving" options={{ ...sheetOptions, sheetAllowedDetents: [0.45] }} />
            <Stack.Screen name="food/saved" options={{ ...sheetOptions, sheetAllowedDetents: [0.7, 1] }} />
        </Stack>
            <ToastHost />
          </SafeAreaProvider>
        </GestureHandlerRootView>
        </AppStateProvider>
      </AuthGate>
    </ErrorBoundary>
  );
}
