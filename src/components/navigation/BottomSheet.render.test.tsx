// BottomSheet — the one shared sheet component for every in-app modal sheet
// (PHASE2_ROWS.md row 27, "Visual QA: sheets"). Render smoke test only: mounts
// the real component with its existing props and checks the open/closed
// branch each render, not styling or animation timing.
//
// useSafeAreaInsets needs a SafeAreaProvider ancestor (same pattern as
// Screen.render.test.tsx / ToastHost.render.test.tsx).
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/navigation/BottomSheet';
import { Text } from '@/components/primitives/Text';
import { allText, renderScreen } from '../../__tests__/render/helpers';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

test('BottomSheet closed: its children are not rendered', () => {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <BottomSheet visible={false} onClose={() => {}}>
        <Text variant="body">Sheet body content</Text>
      </BottomSheet>
    </SafeAreaProvider>,
  );
  expect(allText(tree)).not.toContain('Sheet body content');
});

test('BottomSheet open: its children render', () => {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <BottomSheet visible onClose={() => {}} title="Smoke Test">
        <Text variant="body">Sheet body content</Text>
      </BottomSheet>
    </SafeAreaProvider>,
  );
  const text = allText(tree);
  expect(text).toContain('Sheet body content');
  expect(text).toContain('Smoke Test');
});
