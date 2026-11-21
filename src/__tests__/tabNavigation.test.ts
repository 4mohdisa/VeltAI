/// <reference types="jest" />
/// <reference types="node" />
// The tab bar stopped being the system one (DECISIONS.md, architecture item 1):
// NativeTabs gave us the react-navigation press contract, safe-area clearance and
// the Profile tab for free, and a hand-drawn bar has to re-earn all three. These
// assertions pin the parts that fail SILENTLY — a bar that navigates without
// emitting `tabPress` looks perfect and quietly breaks scroll-to-top and
// pop-to-top, and a screen that forgets the clearance just hides its last row
// under a floating pill.
//
// Source-text assertions rather than a mounted navigator, for the same reason
// designTokensCssParity does it: these modules pull in react-native, which the
// node jest project cannot load.
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const root = join(__dirname, '..', '..');
const src = (p: string) => readFileSync(join(root, p), 'utf8');

const TAB_LAYOUT = 'src/app/(tabs)/_layout.tsx';
const TAB_BAR = 'src/components/navigation/LumeTabBar.tsx';

describe('the custom tab bar keeps what NativeTabs used to guarantee', () => {
  test('the navigator is the JS Tabs with our own bar, not NativeTabs', () => {
    const layout = src(TAB_LAYOUT);
    expect(layout).toContain('LumeTabBar');
    expect(layout).toMatch(/tabBar=\{/);
    // NativeTabs cannot render a JS bar; still importing it would mean the
    // custom bar is being silently ignored. Match the import, not the word —
    // the file's header comment explains the migration and names it.
    expect(layout).not.toMatch(/from 'expo-router\/unstable-native-tabs'/);
    expect(layout).toMatch(/import \{ Tabs \} from 'expo-router'/);
  });

  test('press emits tabPress, honours preventDefault, and only then navigates', () => {
    const bar = src(TAB_BAR);
    // The full contract, in order. Navigating without emitting is the failure
    // mode this test exists for: it is invisible until someone taps the active
    // tab expecting the list to scroll to top.
    expect(bar).toContain("type: 'tabPress'");
    expect(bar).toContain('canPreventDefault: true');
    expect(bar).toContain('defaultPrevented');
    expect(bar).toContain('navigation.navigate(route.name, route.params)');
  });

  test('long press is emitted too', () => {
    expect(src(TAB_BAR)).toContain("type: 'tabLongPress'");
  });

  test('the bar renders an explicit allow-list, because Tabs auto-injects routes', () => {
    const bar = src(TAB_BAR);
    // Every file under (tabs)/ becomes a route whether or not it is declared, so
    // the bar must choose what it draws rather than mapping state.routes.
    expect(bar).toMatch(/const TABS/);
    for (const name of ['index', 'food', 'gym']) {
      expect(bar).toContain(`name: '${name}'`);
    }
    expect(bar).not.toContain("name: 'profile'");
  });
});

describe('Profile is off the tab bar', () => {
  test('it no longer lives under (tabs)/, so Tabs cannot inject it as a tab', () => {
    expect(existsSync(join(root, 'src/app/(tabs)/profile.tsx'))).toBe(false);
  });

  test('it is a root-stack route at /profile', () => {
    expect(existsSync(join(root, 'src/app/profile/index.tsx'))).toBe(true);
  });

  // V2: the design floats the way in on all three tabs, not Summary alone. The
  // control is one shared component, so the routing and label are pinned there
  // and each tab is pinned to mount it.
  test('every tab is a way in, via the shared labelled control', () => {
    const button = src('src/components/navigation/ProfileAvatarButton.tsx');
    expect(button).toContain("router.push('/profile')");
    // Without a label this control is an unnamed circle to VoiceOver.
    expect(button).toMatch(/accessibilityLabel="Profile[^"]*"/);
    for (const tab of ['src/app/(tabs)/index.tsx', 'src/app/(tabs)/food.tsx', 'src/app/(tabs)/gym.tsx']) {
      expect(src(tab)).toContain('<ProfileAvatarButton />');
    }
  });
});

describe('every tab screen clears the floating bar', () => {
  // NativeTabs inset scroll content automatically. A floating bar does not, so
  // each scrolling tab screen has to pad itself or its last row is unreachable.
  test.each([
    ['src/app/(tabs)/index.tsx', /paddingBottom: 158/],
    ['src/app/(tabs)/food.tsx', /paddingBottom: 158/],
    ['src/app/(tabs)/gym.tsx', /paddingBottom: 158/],
  ])('%s pads its scroll past the bar', (file, padding) => {
    expect(src(file)).toMatch(padding);
  });

  test('the clearance covers the whole control, not just its offset', () => {
    const bar = src(TAB_BAR);
    // Reading the arithmetic rather than the result, since the module cannot be
    // imported here: clearance must add the button's own height to the offset.
    expect(bar).toMatch(/TAB_BAR_CLEARANCE[\s\S]*?tabBarBottomOffset\(insets\) \+ PLUS_SIZE/);
  });
});
