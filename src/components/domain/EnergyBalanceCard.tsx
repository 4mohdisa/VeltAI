// EnergyBalanceCard — today's intake vs expenditure at a glance, for the
// dashboard. Self-contained via useEnergyBalance(); taps through to the /energy
// detail screen. Degrades gracefully: with no body stats the net is unknown, so
// it shows intake + a nudge instead of a fabricated number.
import type { JSX } from 'react';
import { View } from 'react-native';
import { router, type Href } from 'expo-router';

import { Card } from '@/components/display/Card';
import { Badge } from '@/components/display/Badge';
import { CardHeaderRow } from '@/components/display/CardHeaderRow';
import { Skeleton } from '@/components/display';
import { Text } from '@/components/primitives/Text';
import { accent, categoryAccent, color, radius, space } from '@/lib/design/tokens';
import { useEnergyBalance } from '@/lib/data/energy';
import type { EnergyBalance } from '@/lib/types';

const round = (n: number) => Math.round(n);
const signed = (n: number) => `${n > 0 ? '+' : ''}${round(n)}`;

// statusLabel maps the backend status to its human label (the Badge carries it;
// accent colour is reserved for chart elements, not text — see tokens.ts).
function statusLabel(status: string): string {
  switch (status) {
    case 'deficit':
      return 'Deficit';
    case 'surplus':
      return 'Surplus';
    case 'on_target':
      return 'On target';
    default:
      return 'No goal set';
  }
}

// MiniBar is one labelled track scaled against the larger of intake/expenditure.
function MiniBar({ label, value, max, tint }: { label: string; value: number; max: number; tint: string }): JSX.Element {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <View style={{ gap: space.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="caption" color={color.secondaryLabel}>
          {label}
        </Text>
        <Text variant="caption" color={color.label}>
          {round(value)} kcal
        </Text>
      </View>
      <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: color.light2, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: '100%', borderRadius: radius.pill, backgroundColor: tint }} />
      </View>
    </View>
  );
}

function Content({ b }: { b: EnergyBalance }): JSX.Element {
  const out = b.calories_out_total;
  const max = Math.max(b.calories_in, out ?? b.calories_out_exercise, 1);

  return (
    <View style={{ gap: space.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <CardHeaderRow title="Energy balance" icon="flame" tint={categoryAccent.calories} />
        </View>
        <Badge label={statusLabel(b.status)} />
      </View>

      {b.net_balance != null ? (
        <View style={{ gap: space.xs }}>
          <Text variant="statLarge" color={color.label}>
            {signed(b.net_balance)}
          </Text>
          <Text variant="footnote" color={color.secondaryLabel}>
            net kcal today {b.net_balance < 0 ? '(burning more than eaten)' : '(eaten more than burned)'}
          </Text>
        </View>
      ) : (
        <Text variant="callout" color={color.secondaryLabel}>
          Add your body stats in onboarding to see your net balance.
        </Text>
      )}

      <View style={{ gap: space.md }}>
        <MiniBar label="In (food)" value={b.calories_in} max={max} tint={accent.orange} />
        <MiniBar
          label={out != null ? `Out (BMR ${round(b.calories_out_bmr ?? 0)} + exercise ${round(b.calories_out_exercise)})` : 'Out (exercise)'}
          value={out ?? b.calories_out_exercise}
          max={max}
          tint={accent.blue}
        />
      </View>

      {b.target != null ? (
        <Text variant="footnote" color={color.secondaryLabel}>
          Target {round(b.target)} kcal{b.variance != null ? ` · ${signed(b.variance)} vs target` : ''}
        </Text>
      ) : null}
    </View>
  );
}

export function EnergyBalanceCard(): JSX.Element | null {
  const { balance, loading } = useEnergyBalance();

  if (loading) {
    return (
      <Card variant="elevated">
        <View style={{ gap: space.md }}>
          <Skeleton width="50%" height={18} />
          <Skeleton width="35%" height={30} />
          <Skeleton width="90%" height={12} />
          <Skeleton width="80%" height={12} />
        </View>
      </Card>
    );
  }

  // No data at all (backend down and no cached balance) → render nothing rather
  // than an empty shell; the rest of the dashboard is unaffected.
  if (!balance) return null;

  return (
    <Card variant="elevated" onPress={() => router.push('/energy' as Href)} accessibilityLabel="Energy balance detail">
      <Content b={balance} />
    </Card>
  );
}
