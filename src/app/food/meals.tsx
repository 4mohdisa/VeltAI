// My Meals (Task 4) — full screen with a [My Meals][Recipes] segmented control.
// Search stays in the food tab's search bar (not duplicated here), so this screen
// is just the two saved-item lists. Top-right [+] and the Recipes empty-state
// action both push /food/new-recipe. Registered implicitly by expo-router (a
// default card screen — no _layout entry needed).
import { useState } from 'react';
import { navigate } from '@/lib/nav';

import { Screen } from '@/components/navigation/Screen';
import { SegmentedField } from '@/components/forms';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { SavedMealsList } from '@/components/food/SavedMealsList';
import { RecipesList } from '@/components/food/RecipesList';
import { color } from '@/lib/design/tokens';

type Segment = 'meals' | 'recipes';

export default function MealsScreen() {
  const [segment, setSegment] = useState<Segment>('meals');
  const goNew = () => navigate('/food/new-recipe');

  return (
    <Screen
      title="My Meals"
      showBack
      headerRight={
        <Pressable onPress={goNew} accessibilityLabel="New recipe">
          <Icon name="add" size={24} color={color.black} />
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
      />
      {segment === 'meals' ? <SavedMealsList /> : <RecipesList onNew={goNew} />}
    </Screen>
  );
}
