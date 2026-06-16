// Root navigator. We own all chrome — headers are off everywhere and screens
// render their own NavBar. Wraps the tree in the providers the app needs:
// gesture handler (sheets), safe-area, and React Query (server state, mocked tonight).
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ToastHost } from '@/components/display/ToastHost';
import { color, sheet } from '@/lib/design/tokens';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: color.white },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
            {/* Lightweight overlays */}
            <Stack.Screen
              name="modals/nudge"
              options={{ presentation: 'transparentModal', animation: 'fade' }}
            />
            {/* Native detented sheets */}
            <Stack.Screen name="gym/log-session" options={sheetOptions} />
            <Stack.Screen name="gym/freeze" options={{ ...sheetOptions, sheetAllowedDetents: [0.5] }} />
            <Stack.Screen name="food/add" options={{ ...sheetOptions, sheetAllowedDetents: [0.5, 1] }} />
            <Stack.Screen name="food/custom-food" options={{ ...sheetOptions, sheetAllowedDetents: [0.95] }} />
            <Stack.Screen name="food/barcode-confirm" options={{ ...sheetOptions, sheetAllowedDetents: [0.6] }} />
            <Stack.Screen name="food/serving" options={{ ...sheetOptions, sheetAllowedDetents: [0.45] }} />
            <Stack.Screen name="food/saved" options={{ ...sheetOptions, sheetAllowedDetents: [0.7, 1] }} />
            <Stack.Screen name="food/uncertainty" options={sheetOptions} />
            <Stack.Screen name="modals/confirm" options={{ ...sheetOptions, sheetAllowedDetents: [0.4] }} />
          </Stack>
          <ToastHost />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
