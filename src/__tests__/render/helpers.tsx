// Minimal render harness for the onboarding screens.
//
// The node-env suite can only grep source text; these tests EXECUTE the
// component — every hook, every conditional branch, every prop actually
// computed. @testing-library/react-native v14 does not currently wire up
// against React Native 0.85 (its `test-renderer` peer never receives the
// host config), so this uses react-test-renderer directly and queries the
// tree by props. Less sugar, same proof.
import type { ReactElement } from 'react';
import TestRenderer, { type ReactTestRenderer, type ReactTestInstance } from 'react-test-renderer';

// Every tree stays mounted (and store-subscribed) until it is explicitly torn
// down. Without this, a screen rendered by one test keeps re-running its
// persistence effect when a later test resets the store, writing state back
// underneath it — cross-test pollution that looks like a product bug.
const mounted: ReactTestRenderer[] = [];

// Every screen renders inside the app-state provider, as it does under the
// root layout. Resolved per call, not imported at the top: setup.ts imports
// this file, so a top-level import would load appState (and expo-router)
// before a test file's own jest.mock('expo-router') could replace it. A screen
// whose test mocks useAppState still reads the mock; the provider is unused.
// tree.update wraps too, so an update re-renders the screen in place instead
// of remounting it under a new root.
export function renderScreen(el: ReactElement): ReactTestRenderer {
  const { AppStateProvider } = jest.requireActual<typeof import('@/lib/auth/appState')>('@/lib/auth/appState');
  const wrap = (node: ReactElement) => <AppStateProvider>{node}</AppStateProvider>;
  let tree!: ReactTestRenderer;
  TestRenderer.act(() => {
    tree = TestRenderer.create(wrap(el));
  });
  const update = tree.update.bind(tree);
  tree.update = (next: ReactElement) => update(wrap(next));
  mounted.push(tree);
  return tree;
}

/** Unmount everything this file rendered. Called from the global afterEach. */
export function unmountAll(): void {
  TestRenderer.act(() => {
    while (mounted.length) mounted.pop()?.unmount();
  });
}

export const act = TestRenderer.act;

/** Every rendered node whose props satisfy `pred`. */
export function findAll(tree: ReactTestRenderer, pred: (p: Record<string, unknown>) => boolean): ReactTestInstance[] {
  return tree.root.findAll((n) => {
    try {
      return pred(n.props as Record<string, unknown>);
    } catch {
      return false;
    }
  }, { deep: true });
}

/** The first node carrying this exact `title` prop (our Button API). */
export function buttonWithTitle(tree: ReactTestRenderer, title: string): ReactTestInstance | undefined {
  return findAll(tree, (p) => p.title === title)[0];
}

/** The screen title: the first title1 text, as OnbScaffold renders it. */
export function screenTitle(tree: ReactTestRenderer): unknown {
  return findAll(tree, (p) => p.variant === 'title1')[0].props.children;
}

/** All visible text in the tree, flattened — for asserting messages appear. */
export function allText(tree: ReactTestRenderer): string {
  return JSON.stringify(tree.toJSON());
}
