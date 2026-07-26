// ExercisePicker — a BottomSheet that lists the exercise library (search + muscle
// pills, filtered client-side) and, once a row is tapped, swaps to the
// PlannedValuesForm so the caller receives both the exercise and its planned
// values. Self-contained: the parent only owns `visible`.
import type { JSX } from 'react';
import { useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';

import { PlannedValuesForm, type PlannedValues } from './PlannedValuesForm';
import { Badge, Skeleton } from '@/components/display';
import { TextField } from '@/components/forms';
import { BottomSheet } from '@/components/navigation/BottomSheet';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useExercises } from '@/lib/data/gymSchedule';
import { color, radius, space, surface } from '@/lib/design/tokens';
import type { ExerciseLibraryItem } from '@/lib/types';

export type { PlannedValues };

type Pill = 'All' | 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core' | 'Cardio';

const PILLS: Pill[] = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio'];

// Each muscle pill → the muscle_group_primary values it covers (lowercased match).
// 'All' and 'Cardio' are handled separately (Cardio filters on exercise_type).
const MUSCLE_SETS: Record<Exclude<Pill, 'All' | 'Cardio'>, string[]> = {
  Chest: ['chest'],
  Back: ['back', 'lats', 'traps'],
  Legs: ['quadriceps', 'quads', 'hamstrings', 'glutes', 'calves'],
  Shoulders: ['shoulders', 'delts'],
  Arms: ['biceps', 'triceps', 'forearms'],
  Core: ['core', 'abs', 'abdominals'],
};

function matchesPill(ex: ExerciseLibraryItem, pill: Pill): boolean {
  if (pill === 'All') return true;
  if (pill === 'Cardio') return ex.exercise_type === 'cardio';
  return MUSCLE_SETS[pill].includes(ex.muscle_group_primary.toLowerCase());
}

export function ExercisePicker({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (exercise: ExerciseLibraryItem, planned: PlannedValues) => void;
}): JSX.Element {
  const { exercises, loading } = useExercises();
  const [pill, setPill] = useState<Pill>('All');
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<ExerciseLibraryItem | null>(null);

  const reset = () => {
    setPicked(null);
    setPill('All');
    setQuery('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const q = query.trim().toLowerCase();
  const filtered = exercises.filter(
    (ex) => matchesPill(ex, pill) && (q === '' || ex.name.toLowerCase().includes(q)),
  );

  return (
    <BottomSheet visible={visible} onClose={close} title={picked ? picked.name : 'Add Exercise'}>
      {picked ? (
        <View style={{ gap: space.md }}>
          <Pressable
            onPress={() => setPicked(null)}
            haptic={false}
            minTapTarget={false}
            hitSlop={8}
            accessibilityLabel="Back to exercises"
            style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, alignSelf: 'flex-start' }}
          >
            <Icon name="chevron-back" size={16} color={color.primary} />
            <Text variant="label" color={color.primary}>
              Exercises
            </Text>
          </Pressable>
          <PlannedValuesForm
            exercise={picked}
            onSubmit={(v) => {
              onPick(picked, v);
              reset();
            }}
          />
        </View>
      ) : (
        <View style={{ gap: space.md }}>
          <TextField
            value={query}
            onChangeText={setQuery}
            placeholder="Search exercises"
            accessibilityLabel="Search exercises"
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: space.sm, paddingVertical: space.xs }}
            keyboardShouldPersistTaps="handled"
          >
            {PILLS.map((p) => {
              const selected = p === pill;
              return (
                <Pressable
                  key={p}
                  onPress={() => setPill(p)}
                  minTapTarget={false}
                  haptic={false}
                  accessibilityState={{ selected }}
                  accessibilityLabel={p}
                  style={{
                    paddingVertical: space.sm,
                    paddingHorizontal: space.lg,
                    borderRadius: radius.pill,
                    backgroundColor: selected ? color.black : surface.card,
                  }}
                >
                  <Text variant="label" color={selected ? color.white : color.secondaryLabel}>
                    {p}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Virtualized: the library is 125+ rows; FlatList renders a window,
              not the whole set (Phase 13 B4). */}
          <FlatList
            style={{ maxHeight: 340 }}
            keyboardShouldPersistTaps="handled"
            data={loading ? [] : filtered}
            keyExtractor={(ex) => ex.id}
            initialNumToRender={12}
            ListEmptyComponent={
              loading ? (
                <View style={{ gap: space.md, paddingVertical: space.sm }}>
                  <Skeleton width="80%" height={18} />
                  <Skeleton width="60%" height={18} />
                  <Skeleton width="70%" height={18} />
                </View>
              ) : (
                <Text variant="callout" color={color.secondaryLabel} style={{ paddingVertical: space.lg }}>
                  No exercises found
                </Text>
              )
            }
            renderItem={({ item: ex }) => (
              <Pressable
                onPress={() => setPicked(ex)}
                haptic={false}
                accessibilityLabel={ex.name}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: space.md,
                  paddingVertical: space.md,
                  borderTopWidth: 1,
                  borderTopColor: surface.divider,
                }}
              >
                <View style={{ flex: 1, gap: space.xs }}>
                  <Text variant="bodyMedium" color={color.label} numberOfLines={1}>
                    {ex.name}
                  </Text>
                  {ex.equipment ? (
                    <Text variant="footnote" color={color.secondaryLabel} numberOfLines={1}>
                      {ex.equipment}
                    </Text>
                  ) : null}
                </View>
                {ex.difficulty ? <Badge label={ex.difficulty} /> : null}
              </Pressable>
            )}
          />
        </View>
      )}
    </BottomSheet>
  );
}
