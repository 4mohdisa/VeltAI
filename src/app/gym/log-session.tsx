// D2 · Log gym session
// The design's plan-aware chooser: "How did it go?" over the day's planned
// session, three ways it can have gone differently, and a primary that commits
// the plan verbatim. The design has no duration, effort or energy question —
// duration is DERIVED from the plan (3.2 min a set, or a cardio exercise's own
// planned minutes), so none of those are asked here either.
//
// "Only some of it" opens the design's second sheet here; the other two tiles land
// on /gym/session, where this app already edits per-set numbers and picks an extra
// exercise. Nothing planned → straight to the library, as the design does.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, PixelRatio, View, type TextStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Redirect, router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/forms/Button';
import { CelebrationCard } from '@/components/gym/CelebrationCard';
import { SheetContent } from '@/components/navigation/SheetContent';
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
const PLUS_STROKE = 2.4;
const TILE_HEIGHT = 148;
const WIDE_TILE_HEIGHT = 88;
const TEXT_GAP = 2;
const CHEVRON = 14;

/** The design's "What did you do?" row metrics. No token covers any of them. */
const SOME_ROW_MIN_HEIGHT = 64;
const SOME_ROW_PADDING = 9;
const SOME_ROW_PRESSED_OPACITY = 0.6;
const SOME_ROW_TEXT_GAP = 1;
const SOME_BOX = 26;
const SOME_BOX_RING = 1.8;
const SOME_TICK = 14;
const SOME_TICK_STROKE = 2.8;

const someNameStyle = (): TextStyle => ({ fontSize: 15, fontWeight: '500', lineHeight: 20 * PixelRatio.getFontScale() });

/** The design never asks how long a session took — it costs a set at 3.2 min. */
const SET_MINUTES = 3.2;

/** A cardio exercise carries its own minutes; everything else is sets × 3.2, rounded per exercise as the design does. */
const minutesOf = (te: TemplateExercise) =>
  te.planned_duration_minutes ?? Math.round((te.planned_sets ?? 0) * SET_MINUTES);

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
  icon: ReactNode;
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
  const [savedHere, setSavedHere] = useState(false);
  const [someOpen, setSomeOpen] = useState(false);
  const [skipped, setSkipped] = useState<string[]>([]);

  // The design never shows this sheet on a logged day: the toast, then today on
  // the Gym tab. A session saved from this sheet is the celebration's, not this.
  const alreadyLogged = streak.gymLoggedToday && !savedHere;
  useEffect(() => {
    if (!alreadyLogged) return;
    showToast({ message: t('gymLog.alreadyLogged'), tone: 'info' });
    router.replace('/(tabs)/gym');
  }, [alreadyLogged, t]);

  const planned = useMemo(() => today?.exercises ?? [], [today]);
  const planName = today?.template?.name;
  const planMinutes = useMemo(
    () => Math.round(planned.reduce((a, te) => a + minutesOf(te), 0)),
    [planned],
  );
  // What gets logged: the whole plan, or what's still ticked on the second sheet.
  const ticked = someOpen ? planned.filter((te) => !skipped.includes(te.id)) : planned;
  // A plan with nothing to derive from has no duration; 0 would be logged as real.
  const derivedMinutes = Math.round(ticked.reduce((a, te) => a + minutesOf(te), 0));

  const close = () => {
    if (router.canGoBack()) router.back();
  };

  // Every tile is a different way the session went, and /gym/session opens in
  // the matching view: per-set numbers, the per-exercise ticks, or the picker.
  const openSession = (mode: Choice['mode']) =>
    router.replace({ pathname: '/gym/session', params: { mode } } as Href);

  const save = () => {
    setSavedHere(true);
    logGymSession(
      { durationMin: derivedMinutes > 0 ? derivedMinutes : undefined },
      { name: planName, exercises: ticked.map(inputFor), completionRate: ticked.length / planned.length },
    );
    setCelebrating(true);
  };

  const finishCelebration = () => {
    setCelebrating(false);
    close();
  };

  if (alreadyLogged) return null;

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

  // Nothing scheduled: the design drops the chooser entirely and opens the
  // library instead — there is no plan for any of the four outcomes to describe.
  // A template with no exercises lands here too: there is nothing to commit.
  if (today.is_rest_day || !today.template || planned.length === 0) {
    return <Redirect href={{ pathname: '/gym/session', params: { mode: 'picker' } } as Href} />;
  }

  const choices: Choice[] = [
    { icon: <Icon name="pencil" size={TILE_GLYPH} color={color.label} />, title: t('gymLog.differentWeights'), description: t('gymLog.differentWeightsSub'), mode: 'adjust' },
    { icon: <SomeOfItGlyph />, title: t('gymLog.onlySome'), description: t('gymLog.onlySomeSub'), mode: 'ticklist' },
    { icon: <SomethingElseGlyph />, title: t('gymLog.somethingElse'), description: t('gymLog.somethingElseSub'), mode: 'picker', wide: true },
  ];
  // The design names the plan in the subtitle and falls back to a generic
  // phrase in the footer caption when the day's template has no name.
  const summary = t('gymLog.planSummary', { count: planned.length, minutes: planMinutes });

  return (
    <>
      {someOpen ? (
        <SomeOfItSheet
          planned={planned}
          skipped={skipped}
          onToggle={(id) => setSkipped((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))}
          onBack={() => {
            setSomeOpen(false);
            setSkipped([]);
          }}
          onLog={save}
        />
      ) : (
        <SheetContent
          variant="leading"
          title={t('gymLog.title')}
          subtitle={planName ? `${planName} · ${summary}` : summary}
          onClose={close}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
            {choices.map((c) => (
              <Pressable
                key={c.mode}
                onPress={() => (c.mode === 'ticklist' ? setSomeOpen(true) : openSession(c.mode))}
                accessibilityLabel={`${c.title}. ${c.description}`}
                minTapTarget={false}
                // The design's chooser tile: a grey tile, a WHITE disc holding the
                // one glyph, then the title and its caption pinned to the bottom.
                // Pressed darkens the tile rather than fading it.
                style={({ pressed }) => ({
                  // Two equal columns with the gap between them: any basis under half grows to fill.
                  flexBasis: c.wide ? '100%' : '40%',
                  flexGrow: 1,
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
                  {c.icon}
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
              what it commits. The design saves with a pill at the end of the sheet.
              The divider runs edge to edge, with 12pt above and below it: the margins
              undo the sheet body's 20pt sides and take its 20pt block gap down to 12. */}
          <View style={{ height: layout.hairline, backgroundColor: surface.divider, marginHorizontal: -space.xl, marginVertical: -space.sm }} />
          <View style={{ gap: space.sm }}>
            <Button title={t('gymLog.asPlanned')} onPress={save} />
            <Text variant="caption" color={color.secondaryLabel} style={{ textAlign: 'center' }}>
              {t('gymLog.asPlannedCaption', { plan: planName ?? t('gymLog.thisSession') })}
            </Text>
          </View>
        </SheetContent>
      )}

      {/* A native Modal, because the sheet is only as tall as its content and an
          in-sheet overlay could not cover the screen. */}
      <Modal visible={celebrating} transparent animationType="fade" statusBarTranslucent onRequestClose={finishCelebration}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.overlay }}>
          <CelebrationCard
            streakDays={streak.current}
            time={formatDuration(derivedMinutes)}
            // Nothing here knows a session's burn; the design derives it from body
            // weight, which this screen doesn't have. A dash rather than an invention.
            calories="—"
            volume={formatWeight(Math.round(ticked.reduce((a, te) => a + volumeOf(te), 0)), 'kg')}
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

/** The design's second sheet: every planned exercise ticked, untick what was skipped, log the rest. */
function SomeOfItSheet({
  planned,
  skipped,
  onToggle,
  onBack,
  onLog,
}: {
  planned: TemplateExercise[];
  skipped: string[];
  onToggle: (id: string) => void;
  onBack: () => void;
  onLog: () => void;
}) {
  const left = planned.filter((te) => skipped.includes(te.id)).length;
  const count = planned.length - left;
  const exercises = (n: number) => `${n} ${n === 1 ? 'exercise' : 'exercises'}`;

  return (
    <SheetContent variant="leading" title="What did you do?" subtitle="Untick anything you skipped" onClose={onBack}>
      <View>
        {planned.map((te) => {
          const on = !skipped.includes(te.id);
          const name = te.exercise?.name ?? 'Exercise';
          const detail =
            te.exercise?.exercise_type === 'cardio'
              ? `${minutesOf(te)} min planned`
              : `${te.planned_sets ?? 0} × ${te.planned_reps ?? 0} · ${te.planned_weight ? `${te.planned_weight} ${te.planned_weight_unit ?? 'kg'}` : 'bodyweight'}`;
          return (
            <Pressable
              key={te.id}
              onPress={() => onToggle(te.id)}
              haptic={false}
              minTapTarget={false}
              accessibilityRole="checkbox"
              accessibilityLabel={`${name}, ${detail}`}
              accessibilityState={{ checked: on }}
              style={({ pressed }) => ({
                minHeight: SOME_ROW_MIN_HEIGHT,
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                paddingVertical: SOME_ROW_PADDING,
                borderTopWidth: layout.hairline,
                borderTopColor: surface.divider,
                opacity: pressed ? SOME_ROW_PRESSED_OPACITY : 1,
              })}
            >
              <View
                style={{
                  width: SOME_BOX,
                  height: SOME_BOX,
                  borderRadius: radius.full,
                  backgroundColor: on ? color.primary : color.white,
                  borderWidth: on ? 0 : SOME_BOX_RING,
                  borderColor: color.light3,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {on ? (
                  <Svg width={SOME_TICK} height={SOME_TICK} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M5 12.8l4.4 4.4L19 7.6"
                      stroke={color.onPrimary}
                      strokeWidth={SOME_TICK_STROKE}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                ) : null}
              </View>
              <View style={{ flex: 1, gap: SOME_ROW_TEXT_GAP }}>
                <Text color={on ? color.label : color.tertiaryLabel} style={someNameStyle()} numberOfLines={1}>
                  {name}
                </Text>
                <Text variant="caption" color={color.secondaryLabel}>
                  {detail}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* The footer divider, edge to edge: flush under the last row, 12pt above the
          pill. The margins undo the sheet body's 20pt sides and block gap. */}
      <View style={{ height: layout.hairline, backgroundColor: surface.divider, marginHorizontal: -space.xl, marginTop: -space.xl, marginBottom: -space.sm }} />
      <View style={{ gap: space.sm }}>
        <Button
          title={count === 0 ? 'Nothing ticked' : `Log ${exercises(count)}`}
          onPress={onLog}
          disabled={count === 0}
          style={count === 0 ? { backgroundColor: color.light3, opacity: 1 } : undefined}
        />
        <Text variant="caption" color={color.secondaryLabel} style={{ textAlign: 'center' }}>
          {left === 0
            ? 'Everything ticked — same as logging it as planned'
            : count === 0
              ? 'Tick at least one exercise to log'
              : `${exercises(left)} will be left out`}
        </Text>
      </View>
    </SheetContent>
  );
}

/** The design's "Only some of it" glyph: three lines, a tick and a cross. No SF Symbol has both marks. */
function SomeOfItGlyph() {
  return (
    <Svg width={TILE_GLYPH} height={TILE_GLYPH} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h5M4 12h5M4 17h5M13.4 6.4l2.4 2.4 4.4-4.4M14 15.6l5.6 5.6M19.6 15.6L14 21.2"
        stroke={color.label}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** The design's "Something else" plus, drawn so its stroke matches; an SF Symbol's can't be set to 2.4. */
function SomethingElseGlyph() {
  return (
    <Svg width={TILE_GLYPH} height={TILE_GLYPH} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color.label} strokeWidth={PLUS_STROKE} strokeLinecap="round" />
    </Svg>
  );
}
