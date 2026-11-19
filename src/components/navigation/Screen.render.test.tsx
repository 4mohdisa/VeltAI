// Screen — the shared page scaffold every screen renders through (title/back,
// scroll body, optional sticky footer). This is a render smoke test only: it
// mounts the real component with minimal props and checks the body and footer
// actually reach the tree, not any styling or token value.
//
// useSafeAreaInsets needs a SafeAreaProvider ancestor to resolve (same pattern
// as dashboardSummary.render.test.tsx). Default props (variant 'plain', no
// showBack) keep GlassBackButton/FloatingHeader out of the tree, so this test
// needs no extra native-module mocks beyond what the render project already
// provides.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { Screen } from '@/components/navigation/Screen';
import { Text } from '@/components/primitives/Text';
import { allText, renderScreen } from '../../__tests__/render/helpers';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

test('Screen renders its children and a footer when one is given', () => {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <Screen title="Smoke Test">
        <Text variant="body">Screen body content</Text>
      </Screen>
    </SafeAreaProvider>,
  );
  const text = allText(tree);
  expect(text).toContain('Smoke Test');
  expect(text).toContain('Screen body content');
});

test('Screen renders its footer prop', () => {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <Screen title="Smoke Test" footer={<Text variant="body">Footer CTA</Text>}>
        <Text variant="body">Screen body content</Text>
      </Screen>
    </SafeAreaProvider>,
  );
  const text = allText(tree);
  expect(text).toContain('Footer CTA');
});
