// Shared harness for the gymSchedule hook tests: mounts a hook built on useApi
// (src/lib/data/gymSchedule.ts), lets its fetch settle, unmounts, and returns
// the last state it rendered. Each test file mocks @/lib/api itself.
import { createElement } from 'react';
import TestRenderer from 'react-test-renderer';

// Plain-node Jest project: declare the act() environment.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

export async function readHook<T>(useHook: () => T): Promise<T | undefined> {
  let latest: T | undefined;
  function Harness() {
    latest = useHook();
    return null;
  }
  let tree: TestRenderer.ReactTestRenderer;
  TestRenderer.act(() => {
    tree = TestRenderer.create(createElement(Harness));
  });
  await TestRenderer.act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  TestRenderer.act(() => {
    tree.unmount();
  });
  return latest;
}
