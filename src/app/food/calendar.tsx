// Pick a day — the design's month calendar for the food log (architecture item
// 5). A sheet over the Food tab: month grid, a dot on every day that has food
// logged, and a jump back to today.
//
// The dots come from useLoggedDays, which derives them from the user's own rows.
// A failed fetch shows an error with Retry instead of a dotless month, which
// would claim nothing was logged. Future days are inert — the log records what
// was eaten.
import { useEffect, useState } from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';
import Animated, { Easing, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/components/display/ErrorState';
import { SheetContent } from '@/components/navigation/SheetContent';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useFoodStore } from '@/lib/data/foodStore';
import { addMonths, fromIso, isoDate, monthGrid, useLoggedDays } from '@/lib/data/foodDays';
import { formatMonthYear, formatWeekdayDate } from '@/lib/formatting';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { categoryAccent, color, layout, motion, opacity, radius, ROUNDED_FACE_BY_WEIGHT, space, surface } from '@/lib/design/tokens';

export default function FoodCalendarScreen() {
  const { t } = useTranslation();
  const selectedDate = useFoodStore((s) => s.selectedDate);
  const setSelectedDate = useFoodStore((s) => s.setSelectedDate);
  const { data: loggedDays, error, refetch } = useLoggedDays();
  // Which month the grid is showing — starts on the selected day's month.
  const [month, setMonth] = useState(selectedDate);
  const today = isoDate(new Date());

  const pick = (iso: string) => {
    setSelectedDate(iso);
    router.back();
  };

  const cells = monthGrid(month);
  const monthLabel = formatMonthYear(fromIso(month));
  const nextDisabled = addMonths(month, 1) > today && fromIso(month).getMonth() === fromIso(today).getMonth();

  if (error) {
    return (
      <SheetContent variant="leading" title={t('calendar.title')} onClose={() => router.back()}>
        <ErrorState title={t('calendar.loadFailedTitle')} message={t('calendar.loadFailedMessage')} onRetry={refetch} />
      </SheetContent>
    );
  }

  return (
    <SheetContent variant="leading" title={t('calendar.title')} subtitle={t('calendar.subtitle')} onClose={() => router.back()}>
      <View style={{ marginBottom: -space.xl /* Leaves the 34pt safe-area inset as the design's 34pt bottom. */ }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm }}>
          <MonthArrow direction="back" onPress={() => setMonth(addMonths(month, -1))} />
          <Text variant="bodyBold" color={color.label} accessibilityRole="header">
            {monthLabel}
          </Text>
          <MonthArrow direction="forward" disabled={nextDisabled} onPress={() => setMonth(addMonths(month, 1))} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', height: 26, gap: 2 }}>
          {t('calendar.weekdayLetters').split('').map((d, i) => (
            <Text
              key={`${d}-${i}`}
              variant="caption"
              color={color.tertiaryLabel}
              style={{ flex: 1, textAlign: 'center' }}
            >
              {d}
            </Text>
          ))}
        </View>
        {/* The design's 2 grid gap: 1 either side of each cell, with the row widened by 1 each side so the edges stay flush. */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 2, marginHorizontal: -1, marginTop: 2, marginBottom: space.lg }}>
          {cells.map((iso, i) => {
            if (!iso) return <View key={`pad-${i}`} style={{ width: `${100 / 7}%`, height: 46 }} />;
            const isSelected = iso === selectedDate;
            const isToday = iso === today;
            const future = iso > today;
            const logged = loggedDays.has(iso);
            return (
              <View key={iso} style={{ width: `${100 / 7}%`, paddingHorizontal: 1 }}>
                <Pressable
                  disabled={future}
                  onPress={() => pick(iso)}
                  haptic={false}
                  minTapTarget={false}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected, disabled: future }}
                  accessibilityLabel={logged ? t('calendar.dayLogged', { date: formatWeekdayDate(fromIso(iso)) }) : formatWeekdayDate(fromIso(iso))}
                  style={{
                    width: '100%',
                    height: 46,
                    borderRadius: radius.full,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    // Pressable dims disabled; future days are marked by text colour alone.
                    opacity: opacity.full,
                  }}
                >
                  <DayFill selected={isSelected} restFill={isToday ? color.light2 : 'transparent'} />
                  <Text
                    variant="statSmall"
                    color={isSelected ? color.onPrimary : future ? color.tertiaryLabel : color.label}
                    style={{ fontSize: 15, lineHeight: 19, fontFamily: ROUNDED_FACE_BY_WEIGHT['600'] }}
                  >
                    {fromIso(iso).getDate()}
                  </Text>
                  <View
                    style={{
                      width: space.xs,
                      height: space.xs,
                      borderRadius: radius.full,
                      backgroundColor: logged ? (isSelected ? color.light3 : categoryAccent.calories) : 'transparent',
                    }}
                  />
                </Pressable>
              </View>
            );
          })}
        </View>

        <Pressable
          onPress={() => pick(today)}
          haptic={false}
          minTapTarget={false}
          accessibilityLabel={t('calendar.jumpToToday')}
          style={({ pressed }) => ({
            minHeight: layout.buttonHeight,
            borderRadius: radius.pill,
            backgroundColor: pressed ? surface.tilePressed : surface.tile,
            alignItems: 'center', justifyContent: 'center',
            opacity: opacity.full, // The fill is the design's only press feedback.
          })}
        >
          <Text variant="bodyBold" color={color.label} style={{ fontSize: 16, lineHeight: 21 * PixelRatio.getFontScale() }}>
            {t('calendar.jumpToToday')}
          </Text>
        </Pressable>
      </View>
    </SheetContent>
  );
}

/** A day's background: eases to the selected fill over the design's snap, motion.easing.standard's bezier. */
function DayFill({ selected, restFill }: { selected: boolean; restFill: string }) {
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    const target = selected ? 1 : 0;
    progress.value = reduceMotion
      ? target
      : withTiming(target, { duration: motion.duration.snap, easing: Easing.bezier(0.4, 0, 0.2, 1) });
  }, [selected, reduceMotion, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [restFill, color.primary]),
  }));

  return <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: radius.full }, fillStyle]} />;
}

const MONTH_ARROW_SIZE = 40;
const MONTH_ARROW_GLYPH = 15;
const MONTH_ARROW_DISABLED_OPACITY = 0.35;

function MonthArrow({
  direction,
  onPress,
  disabled,
}: {
  direction: 'back' | 'forward';
  onPress: () => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      haptic={false}
      // A 44 tap target's minimum size would override the design's 40 tile; the slop keeps the 44 reach.
      minTapTarget={false}
      hitSlop={2}
      accessibilityLabel={direction === 'back' ? t('calendar.previousMonth') : t('calendar.nextMonth')}
      style={({ pressed }) => ({
        width: MONTH_ARROW_SIZE,
        height: MONTH_ARROW_SIZE,
        borderRadius: radius.full,
        backgroundColor: pressed ? surface.tilePressed : surface.tile,
        alignItems: 'center',
        justifyContent: 'center',
        // The fill is the design's only press feedback, so Pressable's dimming is replaced here.
        opacity: disabled ? MONTH_ARROW_DISABLED_OPACITY : opacity.full,
      })}
    >
      <Icon
        name={direction === 'back' ? 'chevron-back' : 'chevron-forward'}
        size={MONTH_ARROW_GLYPH}
        color={color.label}
      />
    </Pressable>
  );
}
