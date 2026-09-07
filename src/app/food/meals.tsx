// My Meals (Task 4) — full screen with a [My Meals][Recipes] segmented control.
// Search stays in the food tab's search bar (not duplicated here), so this screen
// is just the two saved-item lists. Top-right [+] and the Recipes empty-state
// action both push /food/new-recipe. Registered implicitly by expo-router (a
// default card screen — no _layout entry needed).
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { track } from '@/lib/analytics';
import { navigate } from '@/lib/nav';

import { Screen } from '@/components/navigation/Screen';
import { SegmentedField } from '@/components/forms';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { SavedMealsList } from '@/components/food/SavedMealsList';
import { RecipesList } from '@/components/food/RecipesList';
import { color, layout, radius, shadow, surface } from '@/lib/design/tokens';

type Segment = 'meals' | 'recipes';

export default function MealsScreen() {
  // Feature entered — one mount event per major surface, so "which features\n  // does anyone actually open?" is answerable without a per-screen scheme.
  useEffect(() => track('feature_used', { name: 'saved_meals' }), []);

  const [segment, setSegment] = useState<Segment>('meals');
  const goNew = () => navigate('/food/new-recipe');

  return (
    <Screen
      title="My Meals"
      variant="floating"
      eyebrow="Food"
      showBack
      headerRight={
        // Floating variant: the control sits over the scroll, so it needs its own
        // circular surface to stay legible as content passes under it.
        <Pressable onPress={goNew} accessibilityLabel="New recipe" minTapTarget={false}>
          <View
            style={{
              width: layout.tapTarget,
              height: layout.tapTarget,
              borderRadius: radius.full,
              backgroundColor: surface.card,
              alignItems: 'center',
              justifyContent: 'center',
              ...shadow.sm,
            }}
          >
            <Icon name="add" size={22} color={color.label} />
          </View>
        </Pressable>
      }
    >
      <SegmentedField<Segment>
        value={segment}
        onChange={setSegment}
        options={[
          { label: 'My Meals', value: 'meals' },
          { label: 'Recipes', value: 'recipes' },
        ]}
        variant="inset"
      />
      {segment === 'meals' ? <SavedMealsList /> : <RecipesList onNew={goNew} />}
    </Screen>
  );
}
