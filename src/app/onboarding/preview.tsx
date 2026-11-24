// Preview — the conversion moment. Reflects the user's own answers back as a
// stack of "we've already done this for you" insight cards, then the account CTA.
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import { InsightCard } from '@/components/onboarding/InsightCard';
import { Button } from '@/components/forms';
import { Text } from '@/components/primitives/Text';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { color, motion, space } from '@/lib/design/tokens';
import { navigate } from '@/lib/nav';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { TRIAL_DAYS } from '@/lib/billing/purchases';

// No counts: the library holds ~17 foods per cuisine, and the old south_asian
// line promised "40+ more" — a number the product doesn't have (audit
// 2026-08-06). "and more" is true for every row; a count has to be earned.
// Cuisine lines live under onboarding.preview.cuisine.<value>.
const ALWAYS = ['onboarding.preview.targets', 'onboarding.preview.portions'] as const;

export default function PreviewScreen() {
  const cuisines = useOnboardingStore((s) => s.cuisines);
  const dietary = useOnboardingStore((s) => s.dietary_requirements);
  const reduceMotion = useReduceMotion();
  const { t } = useTranslation();

  const shown = cuisines.length > 4 ? cuisines.slice(0, 3) : cuisines;
  const insights: string[] = [
    ...shown.map((c) => t(`onboarding.preview.cuisine.${c}`)),
    ...ALWAYS.map((k) => t(k)),
    ...(dietary.includes('halal') ? [t('onboarding.preview.halal')] : []),
  ];

  return (
    <OnbScaffold
      step={5}
      scroll
      title={t('onboarding.preview.title')}
      footer={
        <View style={{ gap: space.sm }}>
          <Button title={t('onboarding.preview.createAccount')} onPress={() => navigate('/onboarding/signup')} />
          <Text variant="footnote" color={color.secondaryLabel} style={{ textAlign: 'center' }}>
            {t('onboarding.preview.trialNote', { days: TRIAL_DAYS })}
          </Text>
        </View>
      }
    >
      <View style={{ gap: space.md }}>
        {insights.map((text, i) => (
          <Animated.View
            key={`${i}-${text.slice(0, 12)}`}
            entering={reduceMotion ? undefined : FadeInDown.delay(i * 80).duration(motion.duration.fast)}
          >
            <InsightCard text={text} />
          </Animated.View>
        ))}
      </View>
    </OnbScaffold>
  );
}
