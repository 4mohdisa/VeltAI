// D2 · Log gym session
// The design's plan-aware chooser: "How did it go?" over the day's planned
// session, three ways it can have gone differently, and a primary that commits
// the plan verbatim. The design has no duration, effort or energy question —
// duration is DERIVED from the plan (3.2 min a set, or a cardio exercise's own
// planned minutes), so none of those are asked here either.
//
// The three tiles are distinct intents that all land on /gym/session, which is
// where this app already edits per-set numbers, ticks off what was done and
// picks an extra exercise. Nothing planned → the design's rest-day fallback.
import { useEffect, useMemo, useState } from 'react';
import { Modal, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/forms/Button';
import { CelebrationCard } from '@/components/gym/CelebrationCard';
import { SheetContent } from '@/components/navigation/SheetContent';
import { EmptyState } from '@/components/display/EmptyState';
import { LoadFailedNotice } from '@/components/display/LoadFailedNotice';
import { Skeleton } from '@/components/display/LoadingSkeleton';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { track } from '@/lib/analytics';
import { color, layout, radius, space, surface } from '@/lib/design/tokens';
import { logGymSession, useGym } from '@/lib/data';
import { useToday } from '@/lib/data/gymSchedule';
import { formatDuration } from '@/lib/formatting';
import { displayToKg, formatWeight } from '@/lib/units';
import type { GymExerciseInput, TemplateExercise } from '@/lib/api';

/** The design's chooser tile metrics: a 46pt white disc holding a 21pt glyph, a
 *  148pt square tile, and the 88pt full-width row. No token covers any of them,
 *  and the 2pt label-to-caption gap is tighter than the spacing scale. */
const TILE_DISC = 46;
const TILE_GLYPH = 21;
const TILE_HEIGHT = 148;
const WIDE_TILE_HEIGHT = 88;
const TEXT_GAP = 2;
const CHEVRON = 14;

/** The design never asks how long a session took — it costs a set at 3.2 min. */
const SET_MINUTES = 3.2;

/** A cardio exercise carries its own minutes; everything else is sets × 3.2. */
const minutesOf = (te: TemplateExercise) =>
  te.planned_duration_minutes ?? (te.planned_sets ?? 0) * SET_MINUTES;

/** The design's session volume in kg: sets × reps × load. Cardio plans none. */
const volumeOf = (te: TemplateExercise) =>
  (te.planned_sets ?? 0) *
  (te.planned_reps ?? 0) *
  displayToKg(te.planned_weight ?? 0, te.planned_weight_unit === 'lb' ? 'lb' : 'kg');

/** The plan, verbatim — what "It went as planned" commits; cardio minutes go in notes, as /gym/session's do. */
const inputFor = (te: TemplateExercise): GymExerciseInput => ({
  name: te.exercise?.name ?? 'Exercise',
  sets: te.planned_sets ?? undefined,
  reps: te.planned_reps ?? undefined,
  weight: te.planned_weight ?? undefined,
  weight_unit: te.planned_weight_unit ?? undefined,
  rest_seconds: te.rest_seconds ?? undefined,
  notes: te.exercise?.exercise_type === 'cardio' && te.planned_duration_minutes != null ? `${te.planned_duration_minutes} min` : undefined,
});

type Choice = {
  icon: string;
  title: string;
  description: string;
  /** Which view /gym/session opens in — this tile's answer, as a route param. */
  mode: 'adjust' | 'ticklist' | 'picker';
  /** "Something else" spans both columns as a short row (`grid-column: span 2`). */
  wide?: boolean;
};

export default function LogSessionScreen() {
  // Feature entered — one mount event per major surface, so "which features
  // does anyone actually open?" is answerable without a per-screen scheme.
  useEffect(() => track('feature_used', { name: 'gym_logging' }), []);

  const { t } = useTranslation();
  const {
    data: { streak },
  } = useGym();
  const { today, loading, refetch } = useToday();
  const [celebrating, setCelebrating] = useState(false);

  const planned = useMemo(() => today?.exercises ?? [], [today]);
  const planName = today?.template?.name;
  const planMinutes = useMemo(
    () => Math.round(planned.reduce((a, te) => a + minutesOf(te), 0)),
    [planned],
  );

  const close = () => {
    if (router.canGoBack()) router.back();
  };

  // Every tile is a different way the session went, and /gym/session opens in
  // the matching view: per-set numbers, the per-exercise ticks, or the picker.
  // The rest-day fallback has no plan to answer for, so it opens the screen plain.
  const openSession = (mode?: Choice['mode']) =>
    router.replace({ pathname: '/gym/session', ...(mode ? { params: { mode } } : {}) } as Href);

  const save = () => {
    // A logged day is never re-logged: the design drops you into the day to
    // edit it or add an extra, which is what /gym/session does here.
    if (streak.gymLoggedToday) {
      showToast({ message: t('gymLog.alreadyLogged'), tone: 'info' });
      openSession();
      return;
    }
    // A plan with nothing to derive from has no duration; 0 would be logged as real.
    const derivedMinutes = today?.template?.estimated_duration_minutes ?? planMinutes;
    logGymSession(
      { durationMin: derivedMinutes > 0 ? derivedMinutes : undefined },
      { name: planName, exercises: planned.map(inputFor), completionRate: 1 },
    );
    setCelebrating(true);
  };

  const finishCelebration = () => {
    setCelebrating(false);
    close();
  };

  if (loading) {
    return (
      <SheetContent variant="leading" title={t('gymLog.title')} onClose={close}>
        <Skeleton height={TILE_HEIGHT} rounded={radius.lg} />
      </SheetContent>
    );
  }

  // useToday yields null only when the read failed; a real response is always an
  // object. An unknown day must not read as a rest day.
  if (!today) {
    return (
      <SheetContent variant="leading" title={t('gymLog.title')} onClose={close}>
        <LoadFailedNotice message={t('gym.loadFailed')} onRetry={refetch} />
      </SheetContent>
    );
  }

  // Nothing scheduled: the design drops the chooser entirely and offers the
  // library instead — there is no plan for any of the four outcomes to describe.
  // A template with no exercises lands here too: there is nothing to commit.
  if (today.is_rest_day || !today.template || planned.length === 0) {
    return (
      <SheetContent variant="leading" title={t('gymLog.title')} onClose={close}>
        <EmptyState
          icon="barbell-outline"
          title={t('gymLog.restDayTitle')}
          message={t('gymLog.restDayMessage')}
          actionLabel={t('gymLog.logAnExercise')}
          onAction={() => openSession()}
        />
      </SheetContent>
    );
  }

  const choices: Choice[] = [
    { icon: 'pencil', title: t('gymLog.differentWeights'), description: t('gymLog.differentWeightsSub'), mode: 'adjust' },
    { icon: 'list', title: t('gymLog.onlySome'), description: t('gymLog.onlySomeSub'), mode: 'ticklist' },
    { icon: 'add', title: t('gymLog.somethingElse'), description: t('gymLog.somethingElseSub'), mode: 'picker', wide: true },
  ];
  // The design names the plan in the subtitle and falls back to a generic
  // phrase in the footer caption when the day's template has no name.
  const summary = t('gymLog.planSummary', { count: planned.length, minutes: planMinutes });

  return (
    <>
      <SheetContent
        variant="leading"
        title={t('gymLog.title')}
        subtitle={planName ? `${planName} · ${summary}` : summary}
        onClose={close}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.md }}>
          {choices.map((c) => (
            <Pressable
              key={c.icon}
              onPress={() => openSession(c.mode)}
              accessibilityLabel={`${c.title}. ${c.description}`}
              minTapTarget={false}
              // The design's chooser tile: a grey tile, a WHITE disc holding the
              // one glyph, then the title and its caption pinned to the bottom.
              // Pressed darkens the tile rather than fading it.
              style={({ pressed }) => ({
                width: c.wide ? '100%' : '48%',
                minHeight: c.wide ? WIDE_TILE_HEIGHT : TILE_HEIGHT,
                backgroundColor: pressed ? surface.tilePressed : surface.tile,
                borderRadius: radius.lg,
                paddingVertical: c.wide ? space.md : space.lg,
                paddingHorizontal: space.lg,
                flexDirection: c.wide ? 'row' : 'column',
                alignItems: c.wide ? 'center' : 'stretch',
                gap: c.wide ? space.md : space.sm,
              })}
            >
              <View
                style={{
                  width: TILE_DISC,
                  height: TILE_DISC,
                  borderRadius: radius.full,
                  backgroundColor: color.white,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name={c.icon} size={TILE_GLYPH} color={color.label} />
              </View>
              <View style={[{ gap: TEXT_GAP }, c.wide ? { flex: 1 } : { marginTop: 'auto' }]}>
                <Text variant="bodyMedium" color={color.label}>
                  {c.title}
                </Text>
                <Text variant="caption" color={color.secondaryLabel}>
                  {c.description}
                </Text>
              </View>
              {c.wide ? <Icon name="chevron-forward" size={CHEVRON} color={color.gray400} /> : null}
            </Pressable>
          ))}
        </View>

        {/* The design's footer: a divider, the primary pill, and a caption naming
            what it commits. The design saves with a pill at the end of the sheet. */}
        <View style={{ height: layout.hairline, backgroundColor: surface.divider }} />
        <View style={{ gap: space.sm }}>
          <Button title={t('gymLog.asPlanned')} onPress={save} />
          <Text variant="caption" color={color.secondaryLabel} style={{ textAlign: 'center' }}>
            {t('gymLog.asPlannedCaption', { plan: planName ?? t('gymLog.thisSession') })}
          </Text>
        </View>
      </SheetContent>

      {/* A native Modal, because the sheet is only as tall as its content and an
          in-sheet overlay could not cover the screen. */}
      <Modal visible={celebrating} transparent animationType="fade" statusBarTranslucent onRequestClose={finishCelebration}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.overlay }}>
          <CelebrationCard
            streakDays={streak.current}
            time={formatDuration(today?.template?.estimated_duration_minutes ?? planMinutes)}
            // Nothing here knows a session's burn; the design derives it from body
            // weight, which this screen doesn't have. A dash rather than an invention.
            calories="—"
            volume={formatWeight(Math.round(planned.reduce((a, te) => a + volumeOf(te), 0)), 'kg')}
            timeLabel={t('gymLog.celebration.time')}
            caloriesLabel={t('gymLog.celebration.calories')}
            volumeLabel={t('gymLog.celebration.volume')}
            nicePillLabel={t('gymLog.celebration.nicePill')}
            onNice={finishCelebration}
          />
        </View>
      </Modal>
    </>
  );
}
