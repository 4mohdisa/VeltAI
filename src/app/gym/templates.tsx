// My Workouts — the user's saved templates. Tap a card → edit; the "+" in the
// header or the empty-state CTA → create a new one. A failed read shows the
// LoadFailedNotice with Retry; the empty state shows only after a successful
// read with zero templates.
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { LoadFailedNotice } from '@/components/display/LoadFailedNotice';
import { Skeleton } from '@/components/display';
import { Screen } from '@/components/navigation/Screen';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useTemplates } from '@/lib/data/gymSchedule';
import { color, radius, space } from '@/lib/design/tokens';
import { navigate } from '@/lib/nav';

export default function TemplatesScreen() {
  const { t } = useTranslation();
  const { templates, loading, isError, refetch } = useTemplates();

  const openNew = () => navigate('/gym/new-template');

  return (
    <Screen
      variant="floating"
      eyebrow={t('gym.title')}
      title={t('gym.myWorkouts')}
      showBack
      headerRight={
        <Pressable onPress={openNew} minTapTarget={false} hitSlop={10} accessibilityLabel={t('gymTemplates.newWorkoutLabel')}>
          <Icon name="add" size={26} color={color.label} />
        </Pressable>
      }
    >
      {loading ? (
        <View style={{ gap: space.md }}>
          <Skeleton width="100%" height={72} rounded={radius.md} />
          <Skeleton width="100%" height={72} rounded={radius.md} />
        </View>
      ) : isError && templates.length === 0 ? (
        <LoadFailedNotice message={t('gym.loadFailed')} onRetry={refetch} />
      ) : templates.length === 0 ? (
        <EmptyState
          icon="barbell"
          title={t('gymTemplates.emptyTitle')}
          message={t('gymTemplates.emptyMessage')}
          actionLabel={t('gymTemplates.newWorkoutAction')}
          onAction={openNew}
        />
      ) : (
        <View style={{ gap: space.md }}>
          {templates.map((template) => (
            <Card
              key={template.id}
              variant="elevated"
              onPress={() => navigate(`/gym/new-template?id=${template.id}`)}
              accessibilityLabel={template.name}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <View style={{ flex: 1, gap: space.xs }}>
                  <Text variant="bodyMedium" color={color.label} numberOfLines={1}>
                    {template.name}
                  </Text>
                  <Text variant="footnote" color={color.secondaryLabel}>
                    {t('gym.exerciseCount', { count: template.exercises.length })}
                    {template.estimated_duration_minutes
                      ? ` · ${t('gymTemplates.aboutMinutes', { minutes: template.estimated_duration_minutes })}`
                      : ''}
                  </Text>
                </View>
                {/* Decorative — the card carries the label and the action. */}
                <Icon name="chevron-forward" size={14} color={color.tertiaryLabel} />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
