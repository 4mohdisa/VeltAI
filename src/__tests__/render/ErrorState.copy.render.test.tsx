// ErrorState (src/components/display/ErrorState.tsx) takes its default title,
// message and Retry label from t() under errorState.*, so the copy follows the
// active language. Renders the real component with the real i18n setup.
import i18next from 'i18next';

import { ErrorState } from '@/components/display/ErrorState';
import en from '@/lib/i18n/locales/en.json';
import { allText, buttonWithTitle, renderScreen } from './helpers';

test('ErrorState default copy comes from the en errorState keys', () => {
  expect(i18next.language).toBe('en');
  const tree = renderScreen(<ErrorState onRetry={jest.fn()} />);

  const text = allText(tree);
  expect(text).toContain(en.errorState.title);
  expect(text).toContain(en.errorState.message);
  expect(buttonWithTitle(tree, en.errorState.retry)).toBeDefined();
});

test('ErrorState props still override the default copy', () => {
  const tree = renderScreen(<ErrorState title="Custom title" message="Custom message" />);

  const text = allText(tree);
  expect(text).toContain('Custom title');
  expect(text).not.toContain(en.errorState.title);
});
