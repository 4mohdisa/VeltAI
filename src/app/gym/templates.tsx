// My Workouts — the user's saved templates. Tap a card → edit; the "+" in the
// header or the empty-state CTA → create a new one. Degrades to an empty state
// with no crash when the templates fetch returns nothing.
import { View } from 'react-native';

import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { Skeleton } from '@/components/display';
import { Screen } from '@/components/navigation/Screen';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useTemplates } from '@/lib/data/gymSchedule';
import { color, radius, space } from '@/lib/design/tokens';
import { navigate } from '@/lib/nav';

export default function TemplatesScreen() {
  const { templates, loading } = useTemplates();

  const openNew = () => navigate('/gym/new-template');

  return (
    <Screen
      title="My Workouts"
      showBack
      headerRight={
        <Pressable onPress={openNew} minTapTarget={false} hitSlop={8} accessibilityLabel="New workout">
          <Icon name="add" size={26} color={color.label} />
        </Pressable>
      }
    >
      {loading ? (
        <View style={{ gap: space.md }}>
          <Skeleton width="100%" height={72} rounded={radius.md} />
          <Skeleton width="100%" height={72} rounded={radius.md} />
        </View>
      ) : templates.length === 0 ? (
        <EmptyState
          icon="barbell"
          title="No workouts yet"
          message="Create a workout template to build your weekly schedule."
          actionLabel="New Workout"
          onAction={openNew}
        />
      ) : (
        <View style={{ gap: space.md }}>
          {templates.map((t) => (
            <Card key={t.id} onPress={() => navigate(`/gym/new-template?id=${t.id}`)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <View style={{ flex: 1, gap: space.xs }}>
                  <Text variant="bodyBold" color={color.label} numberOfLines={1}>
                    {t.name}
                  </Text>
                  <Text variant="footnote" color={color.secondaryLabel}>
                    {t.exercises.length} exercise{t.exercises.length === 1 ? '' : 's'}
                    {t.estimated_duration_minutes ? ` · ${t.estimated_duration_minutes} min` : ''}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={20} color={color.tertiaryLabel} />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
