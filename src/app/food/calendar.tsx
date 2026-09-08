// Pick a day — the design's month calendar for the food log (architecture item
// 5). A sheet over the Food tab: month grid, a dot on every day that has food
// logged, and a jump back to today.
//
// The dots come from useLoggedDays, which derives them from the user's own rows;
// a failed fetch draws none rather than guessing. Future days are inert — the
// log records what was eaten.
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { SheetContent } from '@/components/navigation/SheetContent';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useFoodStore } from '@/lib/data/foodStore';
import { addMonths, fromIso, isoDate, monthGrid, useLoggedDays } from '@/lib/data/foodDays';
import { categoryAccent, color, layout, radius, space, surface } from '@/lib/design/tokens';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function FoodCalendarScreen() {
  const selectedDate = useFoodStore((s) => s.selectedDate);
  const setSelectedDate = useFoodStore((s) => s.setSelectedDate);
  const { days: loggedDays } = useLoggedDays();
  // Which month the grid is showing — starts on the selected day's month.
  const [month, setMonth] = useState(selectedDate);
  const today = isoDate(new Date());

  const pick = (iso: string) => {
    setSelectedDate(iso);
    router.back();
  };

  const cells = monthGrid(month);
  const monthLabel = fromIso(month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const nextDisabled = addMonths(month, 1) > today && fromIso(month).getMonth() === fromIso(today).getMonth();

  return (
    <SheetContent title="Pick a day" onClose={() => router.back()}>
      <View style={{ gap: space.lg }}>
        <Text variant="footnote" color={color.secondaryLabel}>
          Dots mark days with food logged.
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <MonthArrow direction="back" onPress={() => setMonth(addMonths(month, -1))} />
          <Text variant="bodyBold" color={color.label} accessibilityRole="header">
            {monthLabel}
          </Text>
          <MonthArrow direction="forward" disabled={nextDisabled} onPress={() => setMonth(addMonths(month, 1))} />
        </View>

        <View style={{ flexDirection: 'row' }}>
          {WEEKDAYS.map((d, i) => (
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

        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((iso, i) => {
            if (!iso) return <View key={`pad-${i}`} style={{ width: `${100 / 7}%`, height: layout.tapTarget }} />;
            const isSelected = iso === selectedDate;
            const isToday = iso === today;
            const future = iso > today;
            const logged = loggedDays.has(iso);
            return (
              <View key={iso} style={{ width: `${100 / 7}%`, alignItems: 'center' }}>
                <Pressable
                  disabled={future}
                  onPress={() => pick(iso)}
                  haptic={false}
                  minTapTarget={false}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected, disabled: future }}
                  accessibilityLabel={`${fromIso(iso).toLocaleDateString(undefined, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}${logged ? ', has food logged' : ''}`}
                  style={{
                    width: layout.tapTarget,
                    height: layout.tapTarget,
                    borderRadius: radius.full,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: space.xs,
                    backgroundColor: isSelected ? color.primary : 'transparent',
                    borderWidth: !isSelected && isToday ? layout.borderWidth : 0,
                    borderColor: color.light3,
                    opacity: future ? 0.35 : 1,
                  }}
                >
                  <Text variant="callout" color={isSelected ? color.onPrimary : color.label}>
                    {fromIso(iso).getDate()}
                  </Text>
                  <View
                    style={{
                      width: space.xs,
                      height: space.xs,
                      borderRadius: radius.full,
                      backgroundColor: logged ? (isSelected ? color.onPrimary : categoryAccent.calories) : 'transparent',
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
          accessibilityLabel="Jump to today"
          style={{
            minHeight: layout.buttonHeight,
            borderRadius: radius.pill,
            backgroundColor: surface.tile,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="bodyMedium" color={color.label}>
            Jump to today
          </Text>
        </Pressable>
      </View>
    </SheetContent>
  );
}

function MonthArrow({
  direction,
  onPress,
  disabled,
}: {
  direction: 'back' | 'forward';
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      haptic={false}
      accessibilityLabel={direction === 'back' ? 'Previous month' : 'Next month'}
      style={{
        width: layout.tapTarget,
        height: layout.tapTarget,
        borderRadius: radius.full,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon
        name={direction === 'back' ? 'chevron-back' : 'chevron-forward'}
        size={space.lg}
        color={disabled ? color.tertiaryLabel : color.label}
      />
    </Pressable>
  );
}
