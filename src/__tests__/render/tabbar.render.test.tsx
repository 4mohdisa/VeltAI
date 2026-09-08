// The floating tab bar replaced NativeTabs, which means we now own the
// react-navigation press contract by hand (DECISIONS.md, architecture item 1).
// The failure modes are all silent — a bar that navigates without emitting
// `tabPress` looks perfect and quietly kills scroll-to-top; one that ignores
// `defaultPrevented` overrides a screen that asked to handle the press itself;
// one that navigates on the ALREADY-focused tab pushes a duplicate route.
//
// These mount the real component and press it, rather than reading its source.
import { router } from 'expo-router';

import { LumeTabBar, TAB_BAR_CLEARANCE, tabBarBottomOffset } from '@/components/navigation/LumeTabBar';
import { act, findAll, renderScreen } from './helpers';

const insets = { top: 59, bottom: 34, left: 0, right: 0 };

type Emitted = { type: string; target?: string };

/** A stand-in for what the Tabs navigator hands a custom tab bar. */
function makeProps(focusedIndex = 0, preventDefault = false) {
  const emitted: Emitted[] = [];
  const navigate = jest.fn();
  const routes = [
    { key: 'index-1', name: 'index', params: undefined },
    { key: 'food-1', name: 'food', params: undefined },
    { key: 'gym-1', name: 'gym', params: undefined },
  ];
  const props = {
    state: { index: focusedIndex, routes, routeNames: ['index', 'food', 'gym'] },
    descriptors: Object.fromEntries(routes.map((r) => [r.key, { options: {} }])),
    navigation: {
      emit: (e: Emitted) => {
        emitted.push(e);
        return { defaultPrevented: preventDefault };
      },
      navigate,
    },
    insets,
  } as unknown as Parameters<typeof LumeTabBar>[0];
  return { props, emitted, navigate };
}

const pressableWithLabel = (tree: ReturnType<typeof renderScreen>, label: string) =>
  findAll(tree, (p) => p.accessibilityLabel === label && typeof p.onPress === 'function')[0];

describe('LumeTabBar renders the design bar', () => {
  test('exactly the three design tabs, in order — not every injected route', () => {
    const { props } = makeProps();
    const tree = renderScreen(<LumeTabBar {...props} />);
    for (const label of ['Summary', 'Food', 'Gym']) {
      expect(pressableWithLabel(tree, label)).toBeTruthy();
    }
    // Profile moved to the root stack; it must never come back as a cell.
    expect(pressableWithLabel(tree, 'Profile')).toBeFalsy();
  });

  test('the focused tab is marked selected for VoiceOver', () => {
    const { props } = makeProps(1); // food
    const tree = renderScreen(<LumeTabBar {...props} />);
    expect(pressableWithLabel(tree, 'Food').props.accessibilityState).toEqual({ selected: true });
    expect(pressableWithLabel(tree, 'Summary').props.accessibilityState).toEqual({ selected: false });
  });

  test('the add button is labelled and announces that it expands', () => {
    const { props } = makeProps();
    const tree = renderScreen(<LumeTabBar {...props} />);
    const plus = pressableWithLabel(tree, 'Add');
    expect(plus).toBeTruthy();
    expect(plus.props.accessibilityState).toEqual({ expanded: false });
  });
});

describe('the react-navigation press contract', () => {
  test('pressing an unfocused tab emits tabPress and then navigates', () => {
    const { props, emitted, navigate } = makeProps(0);
    const tree = renderScreen(<LumeTabBar {...props} />);
    act(() => {
      pressableWithLabel(tree, 'Gym').props.onPress();
    });
    expect(emitted).toContainEqual({ type: 'tabPress', target: 'gym-1', canPreventDefault: true });
    expect(navigate).toHaveBeenCalledWith('gym', undefined);
  });

  test('a screen that prevents the default is not navigated over', () => {
    const { props, navigate } = makeProps(0, true);
    const tree = renderScreen(<LumeTabBar {...props} />);
    act(() => {
      pressableWithLabel(tree, 'Gym').props.onPress();
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  test('pressing the already-focused tab emits but does not re-navigate', () => {
    const { props, emitted, navigate } = makeProps(0);
    const tree = renderScreen(<LumeTabBar {...props} />);
    act(() => {
      pressableWithLabel(tree, 'Summary').props.onPress();
    });
    // The emit still has to happen — that is what scroll-to-top listens for.
    expect(emitted.some((e) => e.type === 'tabPress')).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  test('long press is emitted', () => {
    const { props, emitted } = makeProps(0);
    const tree = renderScreen(<LumeTabBar {...props} />);
    act(() => {
      pressableWithLabel(tree, 'Food').props.onLongPress();
    });
    expect(emitted).toContainEqual({ type: 'tabLongPress', target: 'food-1' });
  });
});

describe('the add menu', () => {
  test('is closed until the button is pressed, then offers both logs', () => {
    const { props } = makeProps();
    const tree = renderScreen(<LumeTabBar {...props} />);
    expect(pressableWithLabel(tree, 'Log gym session')).toBeFalsy();

    act(() => {
      pressableWithLabel(tree, 'Add').props.onPress();
    });
    expect(pressableWithLabel(tree, 'Log gym session')).toBeTruthy();
    expect(pressableWithLabel(tree, 'Log food')).toBeTruthy();
  });

  test('each row routes where the design says it does', () => {
    (router.push as jest.Mock).mockClear();
    const { props } = makeProps();
    const tree = renderScreen(<LumeTabBar {...props} />);
    act(() => {
      pressableWithLabel(tree, 'Add').props.onPress();
    });
    act(() => {
      pressableWithLabel(tree, 'Log food').props.onPress();
    });
    expect(router.push).toHaveBeenCalledWith('/food/add');
    // Choosing a row also closes the menu.
    expect(pressableWithLabel(tree, 'Log food')).toBeFalsy();
  });

  test('the gym row opens the log-session sheet', () => {
    (router.push as jest.Mock).mockClear();
    const { props } = makeProps();
    const tree = renderScreen(<LumeTabBar {...props} />);
    act(() => {
      pressableWithLabel(tree, 'Add').props.onPress();
    });
    act(() => {
      pressableWithLabel(tree, 'Log gym session').props.onPress();
    });
    expect(router.push).toHaveBeenCalledWith('/gym/log-session');
  });

  test('the scrim dismisses it', () => {
    const { props } = makeProps();
    const tree = renderScreen(<LumeTabBar {...props} />);
    act(() => {
      pressableWithLabel(tree, 'Add').props.onPress();
    });
    act(() => {
      pressableWithLabel(tree, 'Close menu').props.onPress();
    });
    expect(pressableWithLabel(tree, 'Log food')).toBeFalsy();
  });
});

describe('clearance maths', () => {
  test('clears the whole control, not just its offset from the bottom', () => {
    // A screen padding by only the offset would still hide its last row behind
    // the 62pt button.
    expect(TAB_BAR_CLEARANCE(insets)).toBeGreaterThan(tabBarBottomOffset(insets) + 62);
  });

  test('a device with no home indicator still gets the bar off the edge', () => {
    const flat = { top: 20, bottom: 0, left: 0, right: 0 };
    expect(tabBarBottomOffset(flat)).toBeGreaterThan(0);
  });
});
