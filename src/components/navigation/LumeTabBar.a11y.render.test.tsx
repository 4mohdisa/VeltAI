// LumeTabBar — VoiceOver check (PHASE2_ROWS.md row 33): every tab cell needs
// a role, a non-empty label from the existing i18n keys, and a selected state
// that tracks which route is actually focused.
//
// Named *.render.test.tsx (not the plain a11y.test.tsx the row describes) so
// jest routes it through the "render" project (jest-expo preset) — the only
// project that can mount a real React Native tree; the plain-"node" project
// has no RN rendering environment and would fail to mount this component.
import { findAll, renderScreen } from '../../__tests__/render/helpers';
import { LumeTabBar } from './LumeTabBar';

const insets = { top: 59, bottom: 34, left: 0, right: 0 };

/** A stand-in for what the Tabs navigator hands a custom tab bar. */
function makeProps(focusedIndex = 0) {
  const routes = [
    { key: 'index-1', name: 'index', params: undefined },
    { key: 'food-1', name: 'food', params: undefined },
    { key: 'gym-1', name: 'gym', params: undefined },
  ];
  return {
    state: { index: focusedIndex, routes, routeNames: ['index', 'food', 'gym'] },
    descriptors: Object.fromEntries(routes.map((r) => [r.key, { options: {} }])),
    navigation: { emit: () => ({ defaultPrevented: false }), navigate: jest.fn() },
    insets,
  } as unknown as Parameters<typeof LumeTabBar>[0];
}

const tabWithLabel = (tree: ReturnType<typeof renderScreen>, label: string) =>
  findAll(tree, (p) => p.accessibilityRole === 'tab' && p.accessibilityLabel === label)[0];

describe('LumeTabBar VoiceOver: role, label and selected state', () => {
  test('every tab carries role "tab" and its i18n label, with Summary selected by default', () => {
    const tree = renderScreen(<LumeTabBar {...makeProps(0)} />);
    for (const label of ['Summary', 'Food', 'Gym']) {
      expect(tabWithLabel(tree, label)).toBeTruthy();
    }
    expect(tabWithLabel(tree, 'Summary').props.accessibilityState).toEqual({ selected: true });
    expect(tabWithLabel(tree, 'Food').props.accessibilityState).toEqual({ selected: false });
    expect(tabWithLabel(tree, 'Gym').props.accessibilityState).toEqual({ selected: false });
  });

  test('selected state tracks the actually-focused route, not always the first tab', () => {
    const tree = renderScreen(<LumeTabBar {...makeProps(1)} />);
    expect(tabWithLabel(tree, 'Food').props.accessibilityState).toEqual({ selected: true });
    expect(tabWithLabel(tree, 'Summary').props.accessibilityState).toEqual({ selected: false });
    expect(tabWithLabel(tree, 'Gym').props.accessibilityState).toEqual({ selected: false });
  });

  test('the add button has a non-empty accessible label and a button role', () => {
    const tree = renderScreen(<LumeTabBar {...makeProps(0)} />);
    // The role default lives on the underlying RNPressable, one layer below
    // the shared Pressable wrapper this screen renders — match the node
    // where both props actually landed, not just the first with a label.
    const add = findAll(tree, (p) => p.accessibilityLabel === 'Add' && p.accessibilityRole != null)[0];
    expect(add).toBeTruthy();
    expect(add.props.accessibilityRole).toBe('button');
  });
});
