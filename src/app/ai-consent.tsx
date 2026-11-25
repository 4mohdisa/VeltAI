// AI consent (guideline 5.1.2(i)): what is sent to which AI provider and why,
// before the first scan or insight. Accept records the server consent first
// and then the device flag (acceptAiConsent); Decline records nothing.
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import { acceptAiConsent } from '@/lib/ai/consent';

const SECTIONS = ['what', 'who', 'why'] as const;

type Status = 'idle' | 'saving' | 'error' | 'done';

export default function AiConsentScreen() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>('idle');

  const accept = async () => {
    setStatus('saving');
    try {
      await acceptAiConsent();
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  const saving = status === 'saving';

  return (
    <Screen
      variant="floating"
      eyebrow={t('aiConsent.screen.eyebrow')}
      title={t('aiConsent.screen.title')}
      showBack
      contentStyle={{ gap: space.lg }}
      footer={
        status === 'done' ? (
          <Button title={t('common.done')} onPress={() => router.back()} />
        ) : (
          <View style={{ gap: space.md / 2 }}>
            <Button
              title={status === 'error' ? t('common.tryAgain') : t('aiConsent.screen.accept')}
              loading={saving}
              disabled={saving}
              onPress={() => void accept()}
            />
            <Button title={t('aiConsent.screen.decline')} variant="tertiary" disabled={saving} onPress={() => router.back()} />
          </View>
        )
      }
    >
      {SECTIONS.map((section) => (
        <View key={section} style={{ gap: space.sm }}>
          <Text variant="title3" color={color.label}>
            {t(`aiConsent.screen.${section}Title`)}
          </Text>
          <Text variant="body" color={color.label}>
            {t(`aiConsent.screen.${section}`)}
          </Text>
        </View>
      ))}
      <Text variant="footnote" color={color.secondaryLabel}>
        {t('aiConsent.screen.withdraw')}
      </Text>
      {status === 'error' ? (
        <Text variant="body" color={color.label} accessibilityRole="alert">
          {t('aiConsent.screen.error')}
        </Text>
      ) : null}
      {status === 'done' ? (
        <Text variant="body" color={color.label} accessibilityRole="alert">
          {t('aiConsent.screen.done')}
        </Text>
      ) : null}
    </Screen>
  );
}
