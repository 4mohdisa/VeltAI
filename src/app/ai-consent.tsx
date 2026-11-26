// AI consent (guideline 5.1.2(i)): what is sent to which AI provider and why,
// before the first scan or insight. Allow records the server consent first and
// then the device flag (acceptAiConsent), then returns to the screen that asked;
// Not now records nothing. The two choices carry equal weight, as consent must
// be freely given.
import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { Button } from '@/components/forms/Button';
import { ErrorState } from '@/components/display/ErrorState';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import { acceptAiConsent } from '@/lib/ai/consent';
import { replace } from '@/lib/nav';

const SECTIONS = ['what', 'who', 'why'] as const;

type Status = 'idle' | 'saving' | 'error';

export default function AiConsentScreen() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>('idle');
  // The screen that replaced itself with this one (aiConsentHref). An app path
  // only: a deep link must not be able to send the user anywhere else.
  const { from } = useLocalSearchParams<{ from?: string }>();
  const origin = from?.startsWith('/') && !from.startsWith('//') ? from : undefined;

  // Back to whoever pushed this screen; with no history, the Food tab.
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/food'));

  const accept = async () => {
    setStatus('saving');
    try {
      await acceptAiConsent();
      if (origin) replace(origin);
      else leave();
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
      onBack={leave}
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
            onPress={leave}
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
