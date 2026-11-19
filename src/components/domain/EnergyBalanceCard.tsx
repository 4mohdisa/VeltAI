// EnergyBalanceCard — the Summary tab's lead card (V16, SummaryScreen.dc.html):
// today's net as the hero number, two concentric rings — intake against the
// calorie goal outside, burned inside — and an Intake / Burned key beside them.
//
// Driven by props: Summary reads ONE 7-day energy window and hands this card
// today's row, so today is not fetched twice.
//
// Honest states, never a fabricated number:
//   - loading → a skeleton; a failed read → says it failed
//   - no calorie goal → the intake ring stays empty and the key says so
//   - no burn target exists anywhere in the data model → the burned ring is an
//     empty track, the burned total stands alone, and the key says
//     "No burn target set" — the design's "/ 2,400 · 78% of target" is not built
//   - the server could not compute a net (no body stats) → no net number, a
//     one-line reason instead
//   - nothing logged and nothing burned yet → an empty-state line, not blanks
import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/display/Card';
import { CardHeaderRow } from '@/components/display/CardHeaderRow';
import { Skeleton } from '@/components/display';
import { Text } from '@/components/primitives/Text';
import { accent, categoryAccent, color, radius, space } from '@/lib/design/tokens';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { burnOf, netOf } from '@/lib/data/energyRange';
import { ringFraction } from '@/lib/data/summaryCards';
import { formatNumber } from '@/lib/formatting';
import { kcalToDisplay, type EnergyUnit } from '@/lib/units';
import type { EnergyBalance } from '@/lib/api';

// The design's ring geometry (a 104pt box, radii 44 and 29, 10pt strokes).
export const RING_BOX = 104;
export const RING_OUTER_R = 44;
export const RING_INNER_R = 29;
export const RING_STROKE = 10;
const DOT = space.sm;
const KEY_INDENT = space.lg;

// Both the ring and the net number ease to a changed value (a refresh, a newly
// logged meal) over this long, rather than snapping.
const VALUE_ANIMATION_MS = 250;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function Ring({ r, fraction, tint, reduceMotion }: { r: number; fraction: number; tint: string; reduceMotion: boolean }) {
  const c = RING_BOX / 2;
  const circumference = 2 * Math.PI * r;
  const progress = useRef(new Animated.Value(fraction)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(fraction);
      return;
    }
    const anim = Animated.timing(progress, { toValue: fraction, duration: VALUE_ANIMATION_MS, useNativeDriver: false });
    anim.start();
    // Stop a still-running animation rather than let it keep ticking (and
    // calling setValue) past a prop change or an unmount.
    return () => anim.stop();
  }, [fraction, reduceMotion, progress]);

  // Dash = gap = the full circumference, so the whole pattern period never
  // exceeds one trip around the ring; shifting its offset is what reveals (or
  // hides, at fraction 0) an arc of exactly `fraction` starting at the top.
  const strokeDashoffset = progress.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] });

  return (
    <>
      <Circle cx={c} cy={c} r={r} stroke={color.light2} strokeWidth={RING_STROKE} fill="none" />
      <AnimatedCircle
        cx={c}
        cy={c}
        r={r}
        stroke={tint}
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        fill="none"
        transform={`rotate(-90 ${c} ${c})`}
      />
    </>
  );
}

function KeyRow({
  tint,
  label,
  value,
  target,
  sub,
}: {
  tint: string;
  label: string;
  value: string;
  target?: string;
  sub: string;
}) {
  return (
    <View style={{ gap: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={{ width: DOT, height: DOT, borderRadius: radius.full, backgroundColor: tint }} />
        <Text variant="footnote" color={color.secondaryLabel} style={{ flex: 1 }}>
          {label}
        </Text>
        <Text variant="statSmall" color={color.label}>
          {value}
        </Text>
        {target ? (
          <Text variant="caption" color={color.tertiaryLabel}>
            / {target}
          </Text>
        ) : null}
      </View>
      <Text variant="caption" color={color.tertiaryLabel} style={{ paddingLeft: KEY_INDENT }}>
        {sub}
      </Text>
    </View>
  );
}

export type EnergyBalanceCardProps = {
  /** Today's row from the 7-day window; null when the window has none. */
  day: EnergyBalance | null;
  loading: boolean;
  /** The window could not be read. */
  error: boolean;
  energyUnit: EnergyUnit;
};

export function EnergyBalanceCard({ day, loading, error, energyUnit }: EnergyBalanceCardProps): JSX.Element {
  const { t } = useTranslation();
  const reduceMotion = useReduceMotion();
  const show = (kcal: number) => formatNumber(kcalToDisplay(kcal, energyUnit));
  const header = (
    <CardHeaderRow title={t('dashboard.energyBalance.title')} icon="flame" tint={categoryAccent.calories} scope={t('foodLog.today')} chevron />
  );

  // Computed ahead of the loading/error returns below so these hooks run
  // unconditionally, in the same order, on every render (rules of hooks) —
  // `day` (and so `net`) is only ever defined once this card has something to
  // show, but the hooks themselves can't be skipped.
  const net = day ? netOf(day) : null;
  const netAnim = useRef(new Animated.Value(net ?? 0)).current;
  const [displayNet, setDisplayNet] = useState(net ?? 0);
  // This card's own loading/error branches return before a day exists, so the
  // FIRST day to ever land here has no previous value to ease from — only a
  // later change (a refresh, a newly logged meal) does.
  const hasShownNet = useRef(net != null);

  useEffect(() => {
    if (net == null) return;
    if (reduceMotion || !hasShownNet.current) {
      netAnim.setValue(net);
      setDisplayNet(net);
      hasShownNet.current = true;
      return;
    }
    const id = netAnim.addListener(({ value }) => setDisplayNet(value));
    const anim = Animated.timing(netAnim, { toValue: net, duration: VALUE_ANIMATION_MS, useNativeDriver: false });
    anim.start();
    return () => {
      anim.stop();
      netAnim.removeListener(id);
    };
  }, [net, reduceMotion, netAnim]);

  if (loading) {
    return (
      <Card variant="elevated">
        <View style={{ gap: space.lg }}>
          {header}
          <Skeleton width="45%" height={40} />
          <Skeleton width="100%" height={RING_BOX} />
        </View>
      </Card>
    );
  }

  if (error || !day) {
    return (
      <Card variant="elevated" onPress={() => router.push('/energy' as Href)} accessibilityLabel="Energy balance detail">
        <View style={{ gap: space.lg }}>
          {header}
          <Text variant="callout" color={color.secondaryLabel}>
            {error ? "Couldn't load today's energy balance. Pull down to try again." : 'No energy data for today yet.'}
          </Text>
        </View>
      </Card>
    );
  }

  const burned = burnOf(day);
  const goal = day.target;
  const nothingYet = day.calories_in === 0 && (burned == null || burned === 0);

  return (
    <Card variant="elevated" onPress={() => router.push('/energy' as Href)} accessibilityLabel="Energy balance detail">
      <View style={{ gap: space.lg }}>
        {header}

        {net != null ? (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7 }}>
            <Text variant="statLarge" color={color.label} style={{ letterSpacing: -1 }}>
              {displayNet < 0 ? `−${show(-displayNet)}` : `+${show(displayNet)}`}
            </Text>
            <Text variant="callout" color={color.secondaryLabel}>
              {energyUnit} {t(displayNet < 0 ? 'dashboard.energyBalance.deficit' : 'dashboard.energyBalance.surplus')}
            </Text>
          </View>
        ) : (
          <Text variant="callout" color={color.secondaryLabel}>
            {nothingYet
              ? 'Nothing logged or burned yet today. Log food and add your body stats to see your balance.'
              : 'Add your body stats in onboarding to see your net balance.'}
          </Text>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xl }}>
          <Svg width={RING_BOX} height={RING_BOX}>
            <Ring r={RING_OUTER_R} fraction={ringFraction(day.calories_in, goal)} tint={categoryAccent.calories} reduceMotion={reduceMotion} />
            {/* No burn target exists, so the inner ring is only ever its track. */}
            <Ring r={RING_INNER_R} fraction={0} tint={accent.blue} reduceMotion={reduceMotion} />
          </Svg>
          <View style={{ flex: 1, minWidth: 0, gap: space.md }}>
            <KeyRow
              tint={categoryAccent.calories}
              label={t('dashboard.energyBalance.intake')}
              value={show(day.calories_in)}
              target={goal != null ? show(goal) : undefined}
              sub={
                goal != null
                  ? t('dashboard.energyBalance.percentOfGoal', { percent: Math.round((day.calories_in / goal) * 100) })
                  : 'No calorie goal set'
              }
            />
            <KeyRow
              tint={accent.blue}
              label={t('dashboard.energyBalance.burned')}
              value={burned == null ? '—' : show(burned)}
              sub="No burn target set"
            />
          </View>
        </View>
      </View>
    </Card>
  );
}
