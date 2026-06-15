// A2 · Value prop carousel
// Three swipeable cards, each a single bold word + supporting line. Skip-to-end
// top-right. Continue advances through cards then to auth.
import { useRef, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/forms/Button';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';
import { onboardingHref } from '@/lib/onboarding/steps';

const CARDS = [
  { icon: 'lock-closed' as const, word: 'Lock', line: 'Lock distracting apps until you go to the gym.' },
  { icon: 'sparkles' as const, word: 'Coach', line: 'An AI coach that actually knows your life.' },
  { icon: 'camera' as const, word: 'Track', line: 'Food tracking in 5 seconds — photo or voice.' },
];

export default function ValuePropScreen() {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goNext = () => {
    if (index < CARDS.length - 1) {
      const next = index + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setIndex(next);
    } else {
      router.push(onboardingHref('auth') as never);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: space.lg }}>
        <Pressable onPress={() => router.push(onboardingHref('auth') as never)} haptic={false} accessibilityLabel="Skip">
          <Text variant="footnote" color={color.gray500}>
            Skip
          </Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={{ flex: 1 }}
      >
        {CARDS.map((card) => (
          <View key={card.word} style={{ width, padding: space.xl, alignItems: 'center', justifyContent: 'center', gap: space.lg }}>
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: radius.full,
                backgroundColor: color.accentLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={card.icon} size={44} color={color.accentText} />
            </View>
            <Text variant="display" color={color.black}>
              {card.word}
            </Text>
            <Text variant="title3" color={color.gray700} style={{ textAlign: 'center' }}>
              {card.line}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* dots */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.xs, marginBottom: space.md }}>
        {CARDS.map((c, i) => (
          <View
            key={c.word}
            style={{
              width: i === index ? 20 : 8,
              height: 8,
              borderRadius: radius.full,
              backgroundColor: i === index ? color.accent : color.gray300,
            }}
          />
        ))}
      </View>

      <View style={{ padding: space.lg }}>
        <Button title={index < CARDS.length - 1 ? 'Next' : 'Continue'} onPress={goNext} />
      </View>
    </SafeAreaView>
  );
}
