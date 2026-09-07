// "N pending" indicator for the offline mutation queue. Renders only when the
// queue is non-empty. usePendingSync subscribes to the queue depth.
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Icon } from '@/components/primitives/Icon';
import { Text } from '@/components/primitives/Text';
import { color, radius, space, surface } from '@/lib/design/tokens';
import { subscribe } from '@/lib/offline/queue';

/** Live count of queued (offline) writes awaiting sync. */
export function usePendingSync(): number {
  const [count, setCount] = useState(0);
  useEffect(() => subscribe(setCount), []);
  return count;
}

export function PendingSyncBanner(): JSX.Element | null {
  const count = usePendingSync();
  if (count <= 0) return null;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel={`${count} ${count === 1 ? 'change' : 'changes'} waiting to sync`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        paddingVertical: space.sm,
        paddingHorizontal: space.md,
        borderRadius: radius.lg,
        backgroundColor: surface.tile,
      }}
    >
      <Icon name="cloud-offline-outline" size={16} color={color.secondaryLabel} />
      <Text variant="footnote" color={color.secondaryLabel}>
        {count === 1 ? '1 change waiting to sync' : `${count} changes waiting to sync`}
      </Text>
    </View>
  );
}
