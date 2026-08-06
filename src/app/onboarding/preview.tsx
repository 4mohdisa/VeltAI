// Preview — the conversion moment. Reflects the user's own answers back as a
// stack of "we've already done this for you" insight cards, then the account CTA.
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
import type { CuisineType } from '@/lib/types';
import { TRIAL_DAYS } from '@/lib/billing/purchases';

// No counts: the library holds ~17 foods per cuisine, and the old south_asian
// line promised "40+ more" — a number the product doesn't have (audit
// 2026-08-06). "and more" is true for every row; a count has to be earned.
const CUISINE_INSIGHT: Record<CuisineType, string> = {
  south_asian:
    "We've pre-loaded South Asian foods into your database — biryani, dal, roti, paneer and more ready to log",
  east_asian: 'East Asian staples loaded — jasmine rice, tofu, noodles, stir-fry and more',
  southeast_asian: 'Southeast Asian favourites loaded — pho, pad thai, satay, spring rolls and more',
  middle_eastern: 'Middle Eastern foods ready — hummus, shawarma, falafel, pita and more',
  mediterranean: 'Mediterranean staples loaded — grilled fish, salads, olive oil, feta and more',
  western: 'Western favourites loaded — sandwiches, roasts, pasta, steak and more',
  african: 'African dishes ready — jollof, stew, injera, fufu and more',
  latin_american: 'Latin American foods loaded — tacos, arepas, rice and beans, ceviche and more',
};

const ALWAYS: string[] = [
  'Your calorie and macro targets calculated to your goal and activity level',
  'Our AI learns your portions — the more you log, the more accurate it gets',
];

export default function PreviewScreen() {
  const cuisines = useOnboardingStore((s) => s.cuisines);
  const dietary = useOnboardingStore((s) => s.dietary_requirements);
  const reduceMotion = useReduceMotion();

  const shown = cuisines.length > 4 ? cuisines.slice(0, 3) : cuisines;
  const insights: string[] = [
    ...shown.map((c) => CUISINE_INSIGHT[c]),
    ...ALWAYS,
    ...(dietary.includes('halal')
      ? ["Halal dietary filter applied — we'll flag non-halal items"]
      : []),
  ];

  return (
    <OnbScaffold
      step={5}
      scroll
      title="Here's what Lume knows about you already"
      footer={
        <View style={{ gap: space.sm }}>
          <Button title="Create my account →" onPress={() => navigate('/onboarding/signup')} />
          <Text variant="footnote" color={color.secondaryLabel} style={{ textAlign: 'center' }}>
            Free {TRIAL_DAYS}-day trial — pricing shown before you subscribe.
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
