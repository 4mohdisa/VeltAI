// V2 — the shared way into Profile. Pins its behaviour (initials or the person
// glyph, pushes /profile) and the design's values, so Summary, Food and Gym
// cannot drift apart again.
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ProfileAvatarButton as Bare, PROFILE_GLYPH } from '@/components/navigation/ProfileAvatarButton';
import { useUserStore } from '@/lib/data/userStore';
import { layout, space } from '@/lib/design/tokens';
import { act, allText, findAll, renderScreen } from './helpers';

// An iPhone 17 Pro's safe area, so the offset is a real number, not zero.
const TOP_INSET = 59;
const METRICS = {
  frame: { x: 0, y: 0, width: 402, height: 874 },
  insets: { top: TOP_INSET, left: 0, right: 0, bottom: 34 },
};
function ProfileAvatarButton() {
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <Bare />
    </SafeAreaProvider>
  );
}

const button = (tree: ReturnType<typeof renderScreen>) =>
  findAll(tree, (p) => p.accessibilityLabel === 'Profile and settings')[0];

beforeEach(() => {
  (router.push as jest.Mock).mockClear();
});

test('shows the initials when the user has a name, and pushes Profile', () => {
  act(() => useUserStore.setState((s) => ({ profile: { ...s.profile, name: 'Aisha Khan' } })));
  const tree = renderScreen(<ProfileAvatarButton />);
  expect(allText(tree)).toContain('AK');
  act(() => (button(tree).props.onPress as () => void)());
  expect(router.push).toHaveBeenCalledWith('/profile');
});

test('falls back to the person glyph at the design size when there is no name', () => {
  act(() => useUserStore.setState((s) => ({ profile: { ...s.profile, name: '' } })));
  const tree = renderScreen(<ProfileAvatarButton />);
  // The person symbol at the design's 22pt, and no initials anywhere.
  const glyph = findAll(tree, (p) => p.name === 'person.fill')[0];
  expect(glyph.props.size).toBe(PROFILE_GLYPH);
  expect(PROFILE_GLYPH).toBe(22);
  expect(allText(tree)).not.toContain('AK');
});

test('sits where the design puts it: top-right, level with the eyebrow, a 44pt circle', () => {
  act(() => useUserStore.setState((s) => ({ profile: { ...s.profile, name: 'Aisha Khan' } })));
  const style = StyleSheet.flatten(button(renderScreen(<ProfileAvatarButton />)).props.style);
  // insets.top + space.xs — 63pt on this phone, the design's 64 on its 60pt frame.
  expect(style).toMatchObject({ position: 'absolute', top: TOP_INSET + space.xs, right: space.lg });
  expect(layout.tapTarget).toBe(44);
});
