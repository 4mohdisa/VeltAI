// Root navigator. We own all chrome — headers are off everywhere and screens
// render their own NavBar. Wraps the tree in the providers the app needs:
// gesture handler (sheets), safe-area, and React Query (server state, mocked tonight).
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { color } from '@/lib/design/tokens';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function RootLayout() {
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
            {/* Full-screen celebratory / blocking modals */}
            <Stack.Screen name="modals/rank-up" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="modals/milestone" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen
              name="modals/lockout-blocked"
              options={{ presentation: 'fullScreenModal' }}
            />
            {/* Lightweight overlays */}
            <Stack.Screen
              name="modals/nudge"
              options={{ presentation: 'transparentModal', animation: 'fade' }}
            />
            <Stack.Screen name="modals/confirm" options={{ presentation: 'modal' }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
