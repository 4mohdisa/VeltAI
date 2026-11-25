// Muscle focus (full screen) — the design's §3.9 view, pushed from the Gym
// tab's muscle-focus card. One sorted list of every muscle group with the
// training volume behind it, plus the total.
//
// What the design has and this does not, for cause:
//  - The 3D body stage and its front/back segmented control. That needs
//    three.js and per-mesh data (DECISIONS.md, NEEDS ARCHITECTURE DECISION 7),
//    so there is no front/back split here — all groups sit in one list.
//  - Per-muscle exercise lists and set counts, and the tap-to-select popover
//    that shows them. `muscle_volume_map` carries volume per group only; the
//    exercises behind it are not in any response this app can call, so the
//    rows are volume-only rather than invented.
//  - The design labels its window "Last 7 days". Ours is the server's own
//    30-day patterns window (backend rebuild: `gs.date >= current_date -
//    interval '30 days'`), and it is labelled as that.
import type { JSX } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Card, CardHeaderRow, EmptyState, LoadFailedNotice, Skeleton } from '@/components/display';
import { MUSCLE_GROUPS, MuscleVolumeRow, formatVolume, muscleLabel } from '@/components/gym/MuscleChart';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useGymPatterns } from '@/lib/data/gymSchedule';
import { categoryAccent, color, opacity, radius, space, surface } from '@/lib/design/tokens';

/** The design's in-bar back circle and its chevron. No token covers them; the
 *  Pressable still gives the full 44pt tap target. */
const BACK_SIZE = 38;
const BACK_ICON_SIZE = 15;
/** The design's pressed fade for the back circle, deeper than the shared 0.85. */
const BACK_PRESSED_OPACITY = 0.6;

export default function MuscleFocusScreen(): JSX.Element {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { patterns, loading, isError, refetch } = useGymPatterns();
  const map = patterns?.muscle_volume_map ?? null;

  // The known groups plus anything else the server actually sent (the library
  // also carries `cardio` and `full_body`), so nothing real is hidden.
  const groups = map ? Array.from(new Set([...MUSCLE_GROUPS, ...Object.keys(map)])) : MUSCLE_GROUPS;
  const volumeOf = (g: string) => map?.[g] ?? 0;
  const total = groups.reduce((sum, g) => sum + volumeOf(g), 0);
  const max = Math.max(0, ...groups.map(volumeOf));
  const hasData = max > 0;
  // Strongest focus first; name order breaks ties so the list never reshuffles.
  const ordered = [...groups].sort((a, b) => volumeOf(b) - volumeOf(a) || a.localeCompare(b));
  const strongest = ordered[0];

  const body = (() => {
    if (loading) {
      return (
        <View style={{ gap: space.md }}>
          <Skeleton width="100%" height={96} rounded={radius.xl} />
          <Skeleton width="100%" height={240} rounded={radius.xl} />
        </View>
      );
    }

    if (isError && !hasData) {
      return <LoadFailedNotice message={t('gym.loadFailed')} onRetry={refetch} />;
    }

    if (!hasData) {
      return (
        <EmptyState icon="barbell" title={t('gymMuscles.emptyTitle')} message={t('gymMuscles.emptyMessage')} />
      );
    }

    return (
      <View style={{ gap: space.md }}>
        <Card variant="elevated">
          <CardHeaderRow
            title={t('gymMuscles.totalVolume')}
            icon="barbell"
            tint={categoryAccent.streak}
            scope={t('dashboard.lastDays', { count: 30 })}
          />
          <Text variant="statMedium" color={color.label} style={{ marginTop: space.sm }}>
            {formatVolume(total)}
          </Text>
          <Text variant="footnote" color={color.secondaryLabel} style={{ marginTop: space.xs }}>
            {t('gymMuscles.strongestFocus', { muscle: muscleLabel(strongest) })}
          </Text>
        </Card>

        <Card variant="elevated">
          <View style={{ gap: space.sm }}>
            <CardHeaderRow title={t('gymMuscles.allGroups')} scope={t('gymLog.celebration.volume')} />
            {ordered.map((muscle) => (
              <MuscleVolumeRow key={muscle} muscle={muscle} volume={volumeOf(muscle)} max={max} showValue />
            ))}
          </View>
        </Card>

        {/* The design's hint promises drag-to-spin and tap-to-zoom on a 3D body.
            There is no body and nothing here spins, so this says what the
            numbers actually are instead. */}
        <Text variant="caption" color={color.tertiaryLabel}>
          {t('gymMuscles.volumeNote')}
        </Text>
      </View>
    );
  })();

  // Not Screen: the design pins this title bar, with its own back circle, above
  // the scroll, and Screen's floating chrome scrolls its title away.
  return (
    <View style={{ flex: 1, backgroundColor: surface.backgroundAlt }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          paddingTop: insets.top + space.xs,
          paddingHorizontal: space.xl,
          paddingBottom: space.md,
          backgroundColor: surface.background,
        }}
      >
        <Pressable
          haptic={false}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          accessibilityLabel={t('common.goBack')}
          style={({ pressed }) => ({ opacity: pressed ? BACK_PRESSED_OPACITY : opacity.full })}
        >
          <View
            style={{
              width: BACK_SIZE,
              height: BACK_SIZE,
              borderRadius: radius.full,
              backgroundColor: color.light1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="chevron-back" size={BACK_ICON_SIZE} color={color.black} />
          </View>
        </Pressable>
        <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
          <Text variant="title3" color={color.label} accessibilityRole="header">
            {t('gymMuscles.title')}
          </Text>
          <Text variant="footnote" color={color.secondaryLabel}>
            {t('gym.muscleFocusWindow', { volume: formatVolume(total) })}
          </Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: 40 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {body}
      </ScrollView>
    </View>
  );
}
