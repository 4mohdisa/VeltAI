// Row 10b · Reminders priming sheet. Explains reminders once, after the first
// meal is logged, before the system prompt is ever shown. Either answer (or
// closing the sheet, which counts as Not now) is stored, so it never returns.
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/forms/Button';
import { BottomSheet } from '@/components/navigation/BottomSheet';
import { Text } from '@/components/primitives/Text';
import { useFoodStore } from '@/lib/data/foodStore';
import { color, space } from '@/lib/design/tokens';
import { requestNotificationPermission, type PermissionResult } from '@/lib/notifications/permissions';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage/secureStore';

type Answer = PermissionResult | 'not_now';

export function NotificationPriming() {
  const { t } = useTranslation();
  // null until the stored answer is read, so the sheet never flashes for someone who answered.
  const [answered, setAnswered] = useState<boolean | null>(null);
  const hasLoggedMeal = useFoodStore((s) =>
    Object.values(s.byDate).some((meals) => meals.some((m) => m.items.some((i) => !i.pending))),
  );

  useEffect(() => {
    let active = true;
    void getItem(STORAGE_KEYS.notificationPrimingAnswer).then((v) => {
      if (active) setAnswered(v !== null);
    });
    return () => {
      active = false;
    };
  }, []);

  const save = (value: Answer) => void setItem(STORAGE_KEYS.notificationPrimingAnswer, value);
  const notNow = () => {
    setAnswered(true);
    save('not_now');
  };
  // Hide first, so the system prompt opens over the app rather than the sheet.
  const turnOn = async () => {
    setAnswered(true);
    save(await requestNotificationPermission());
  };

  return (
    <BottomSheet
      visible={answered === false && hasLoggedMeal}
      onClose={notNow}
      title={t('notifications.priming.title')}
      testID="notification-priming"
    >
      <View style={{ gap: space.xl }}>
        <Text variant="body" color={color.secondaryLabel}>
          {t('notifications.priming.body')}
        </Text>
        <View style={{ gap: space.sm }}>
          <Button title={t('notifications.priming.turnOn')} variant="secondary" onPress={() => void turnOn()} />
          <Button title={t('notifications.priming.notNow')} variant="secondary" onPress={notNow} />
        </View>
      </View>
    </BottomSheet>
  );
}
