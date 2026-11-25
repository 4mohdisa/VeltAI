// AI consent (guideline 5.1.2(i)): what is sent to which AI provider and why,
// before the first scan or insight. Allow records the server consent first and
// then the device flag (acceptAiConsent), then goes back; Not now records
// nothing. The two choices carry equal weight, as consent must be freely given.
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { Button } from '@/components/forms/Button';
import { ErrorState } from '@/components/display/ErrorState';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import { acceptAiConsent } from '@/lib/ai/consent';

const SECTIONS = ['what', 'who', 'why'] as const;

type Status = 'idle' | 'saving' | 'error';

export default function AiConsentScreen() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>('idle');

  const accept = async () => {
    setStatus('saving');
    try {
      await acceptAiConsent();
      router.back();
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
        <View style={{ gap: space.md / 2 }}>
          <Button
            title={t('aiConsent.screen.accept')}
            variant="secondary"
            loading={saving}
            disabled={saving}
            onPress={() => void accept()}
          />
          <Button
            title={t('aiConsent.screen.decline')}
            variant="secondary"
            disabled={saving}
            onPress={() => router.back()}
          />
        </View>
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
        <ErrorState
          message={t('aiConsent.screen.error')}
          retryLabel={t('common.tryAgain')}
          onRetry={() => void accept()}
        />
      ) : null}
    </Screen>
  );
}
