// Legal "Privacy Policy" screen. This EXECUTES the screen; it is not a
// source-text grep.
import PrivacyPolicyScreen from '@/app/legal/privacy';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { allText, renderScreen } from './helpers';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

test('renders without throwing and shows the title and a data-collection paragraph', () => {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PrivacyPolicyScreen />
    </SafeAreaProvider>,
  );

  const text = allText(tree);
  expect(text).toContain('Privacy Policy');
  expect(text).toContain(
    'Account: your email address and name, managed by our authentication provider.',
  );
});
