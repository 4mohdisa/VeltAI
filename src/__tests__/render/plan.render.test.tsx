// Row 17, decision (b): the AI rationale card is dropped from the Plan screen
// for v1 — there is no backend that generates it, so it never shows, even in
// dev where the timeline itself still uses mock data.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import PlanDetailScreen from '@/app/dashboard/plan';
import { allText, renderScreen } from './helpers';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

test('plan screen does not render the AI rationale card', () => {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PlanDetailScreen />
    </SafeAreaProvider>,
  );
  const text = allText(tree);
  expect(text).not.toContain('Why this plan');
  expect(text).not.toContain('gym attendance');
});
