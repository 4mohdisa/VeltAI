// PendingSyncBanner (src/components/display/PendingSyncBanner.tsx) takes its
// copy from t() under pendingSync.waiting (plural), so the banner text and its
// accessibility label follow the active language. The offline queue is mocked
// to report a fixed depth; the real i18n setup renders the copy.
import i18next from 'i18next';

import { PendingSyncBanner } from '@/components/display/PendingSyncBanner';
import en from '@/lib/i18n/locales/en.json';
import { allText, findAll, renderScreen } from './helpers';

let mockDepth = 0;
jest.mock('@/lib/offline/queue', () => ({
  subscribe: (listener: (count: number) => void) => {
    listener(mockDepth);
    return () => undefined;
  },
}));

const fill = (template: string, count: number) => template.replace('{{count}}', String(count));

test('one queued change shows the en singular copy as text and accessibility label', () => {
  expect(i18next.language).toBe('en');
  mockDepth = 1;
  const tree = renderScreen(<PendingSyncBanner />);

  const copy = fill(en.pendingSync.waiting_one, 1);
  expect(allText(tree)).toContain(copy);
  expect(findAll(tree, (p) => p.accessibilityLabel === copy)).not.toHaveLength(0);
});

test('several queued changes show the en plural copy', () => {
  mockDepth = 3;
  const tree = renderScreen(<PendingSyncBanner />);

  expect(allText(tree)).toContain(fill(en.pendingSync.waiting_other, 3));
});
