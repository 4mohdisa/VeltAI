// WeekStrip — the design's day switcher at the top of the Food log: one chip per
// day of the shown week, with a dot under any day that has food logged, and the
// month name doubling as the way into the full calendar.
//
// Every dot is a real row (useLoggedDays derives them from the user's own logs);
// a day with none simply has no dot. Future days are inert — the food log is a
// record of what was eaten, so there is nothing to show or add there yet.
import { View } from 'react-native';

import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { addDays, fromIso, isoDate, weekOf } from '@/lib/data/foodDays';
import { categoryAccent, color, layout, radius, space, surface } from '@/lib/design/tokens';

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export type WeekStripProps = {
  /** ISO day currently shown. */
  selected: string;
  onSelect: (iso: string) => void;
  /** Days with at least one logged row — drives the dots. */
  loggedDays: ReadonlySet<string>;
  /** Opens the month picker. Omit and the month reads as a plain label — the
   *  picker is a separate route (architecture item 5) and a control that goes
   *  nowhere is worse than no control. */
  onOpenCalendar?: () => void;
};

export function WeekStrip({ selected, onSelect, loggedDays, onOpenCalendar }: WeekStripProps) {
  const days = weekOf(selected);
  const today = isoDate(new Date());
  const monthLabel = fromIso(selected).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        {onOpenCalendar ? (
          <Pressable
            onPress={onOpenCalendar}
            haptic={false}
            minTapTarget={false}
            accessibilityLabel={`${monthLabel}. Pick a day`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, flex: 1 }}
          >
            <Text variant="label" color={color.secondaryLabel} style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
              {monthLabel}
            </Text>
            <Icon name="chevron-down" size={space.md} color={color.tertiaryLabel} />
          </Pressable>
        ) : (
          <Text
            variant="label"
            color={color.secondaryLabel}
            style={{ textTransform: 'uppercase', letterSpacing: 1, flex: 1 }}
          >
            {monthLabel}
          </Text>
        )}
        <WeekArrow direction="back" onPress={() => onSelect(addDays(selected, -7))} />
        <WeekArrow
          direction="forward"
          disabled={days[6] >= today}
          onPress={() => onSelect(addDays(selected, 7))}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: space.xs }}>
        {days.map((iso, i) => {
          const isSelected = iso === selected;
          const isToday = iso === today;
          const future = iso > today;
          const logged = loggedDays.has(iso);
          return (
            <Pressable
              key={iso}
              disabled={future}
              onPress={() => onSelect(iso)}
              haptic={false}
              minTapTarget={false}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: future }}
              accessibilityLabel={`${fromIso(iso).toLocaleDateString(undefined, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}${logged ? ', has food logged' : ''}${isToday ? ', today' : ''}`}
              style={{
                flex: 1,
                minHeight: layout.buttonHeight,
                borderRadius: radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                gap: space.xs,
                paddingVertical: space.sm,
                backgroundColor: isSelected ? color.primary : surface.cardElevated,
                opacity: future ? 0.4 : 1,
              }}
            >
              <Text variant="caption" color={isSelected ? color.onPrimary : color.secondaryLabel}>
                {LETTERS[i]}
              </Text>
              <Text variant="bodyMedium" color={isSelected ? color.onPrimary : color.label}>
                {fromIso(iso).getDate()}
              </Text>
              {/* The dot marks a day that has logs; today with none gets a hollow
                  ring so "where am I" is still legible on an empty day. */}
              <View
                style={{
                  width: space.xs,
                  height: space.xs,
                  borderRadius: radius.full,
                  backgroundColor: logged
                    ? isSelected
                      ? color.onPrimary
                      : categoryAccent.calories
                    : 'transparent',
                  borderWidth: !logged && isToday ? layout.hairline : 0,
                  borderColor: isSelected ? color.onPrimary : color.tertiaryLabel,
                }}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function WeekArrow({
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
      accessibilityLabel={direction === 'back' ? 'Previous week' : 'Next week'}
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
