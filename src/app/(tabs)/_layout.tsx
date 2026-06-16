// Four-tab main app: Dashboard, Food, Gym, Profile.
// Native iOS tab bar via expo-router's NativeTabs. On the iOS 26 SDK this renders
// as the inset Liquid Glass capsule automatically — we set NO custom background/
// blur so the system glass material shows through (content scrolls under it).
// Active glyph/label = black; inactive = system grey (≈ secondary). SF Symbols.
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { color } from '@/lib/design/tokens';

export default function TabsLayout() {
  return (
    <NativeTabs tintColor={color.black}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="food">
        <NativeTabs.Trigger.Icon sf="fork.knife" />
        <NativeTabs.Trigger.Label>Food</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="gym">
        <NativeTabs.Trigger.Icon sf={{ default: 'dumbbell', selected: 'dumbbell.fill' }} />
        <NativeTabs.Trigger.Label>Gym</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
