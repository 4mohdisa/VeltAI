// Shared harness for the gymSchedule hook tests: mounts a hook built on useApi
// (src/lib/data/gymSchedule.ts), lets its fetch settle, and exposes the last
// state it rendered. Each test file mocks @/lib/api itself.
import { createElement } from 'react';
import TestRenderer from 'react-test-renderer';

// Plain-node Jest project: declare the act() environment.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const settle = async () => {
  await TestRenderer.act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

export type MountedHook<P, T> = {
  latest: () => T | undefined;
  /** Re-render with new hook input, then let any fetch it triggers settle. */
  rerender: (props: P) => Promise<void>;
  unmount: () => void;
};

/** Mount `useHook(props)` and let its first fetch settle. */
export async function mountHook<P, T>(useHook: (props: P) => T, props: NoInfer<P>): Promise<MountedHook<P, T>> {
  let latest: T | undefined;
  function Harness({ input }: { input: P }) {
    latest = useHook(input);
    return null;
  }
  let tree: TestRenderer.ReactTestRenderer;
  TestRenderer.act(() => {
    tree = TestRenderer.create(createElement(Harness, { input: props }));
  });
  await settle();
  return {
    latest: () => latest,
    rerender: async (next) => {
      TestRenderer.act(() => {
        tree.update(createElement(Harness, { input: next }));
      });
      await settle();
    },
    unmount: () => {
      TestRenderer.act(() => {
        tree.unmount();
      });
    },
  };
}

/** Mount a hook that takes no input, let its fetch settle, unmount, and return
 *  the last state it rendered. */
export async function readHook<T>(useHook: () => T): Promise<T | undefined> {
  const mounted = await mountHook(useHook, undefined);
  const state = mounted.latest();
  mounted.unmount();
  return state;
}
