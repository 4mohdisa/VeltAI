// Three-tab main app: Summary, Food, Gym — drawn by our own floating bar.
//
// This used to be `NativeTabs`, which renders the system Liquid Glass capsule and
// hands us safe-area clearance, minimize-on-scroll and scroll-to-top for free.
// The design file's bar is a floating glass pill with a separate black "+" beside
// it, and NativeTabs cannot host a JS-drawn bar at all — so this is the JS `Tabs`
// navigator with a custom `tabBar`. What that trade costs, and why it was made,
// is recorded in DECISIONS.md (architecture item 1).
//
// Profile is deliberately NOT a tab any more: the design reaches it from the
// avatar on Summary, so it lives on the ROOT stack at /profile and covers the
// tab bar when open. `Tabs` auto-injects every file under (tabs)/ as a route, so
// a screen that must not be a tab has to live outside this folder — which is
// exactly where it now is.
import { Tabs } from 'expo-router';

import { LumeTabBar } from '@/components/navigation/LumeTabBar';
import { surface } from '@/lib/design/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      // The bar floats above the scene, so the scene fills the whole screen and
      // each tab screen pads itself with TAB_BAR_CLEARANCE.
      tabBar={(props) => <LumeTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: surface.backgroundAlt },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Summary' }} />
      <Tabs.Screen name="food" options={{ title: 'Food' }} />
      <Tabs.Screen name="gym" options={{ title: 'Gym' }} />
    </Tabs>
  );
}
