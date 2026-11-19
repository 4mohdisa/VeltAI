// Legal "Terms of Service" screen. This EXECUTES the screen; it is not a
// source-text grep.
import TermsScreen from '@/app/legal/terms';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { allText, renderScreen } from './helpers';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

test('renders without throwing and shows the agreement paragraph', () => {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <TermsScreen />
    </SafeAreaProvider>,
  );

  expect(allText(tree)).toContain(
    'By downloading, accessing or using Lume, you agree to be bound by these Terms. If you do not agree, do not use the app.',
  );
});
