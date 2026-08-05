// BrainProfileCard — self-contained learned-profile surface. Skeletons while
// loading, a gentle "still learning" state before there's enough data, and a
// stat-row summary once the brain has a profile. Every loose Record field is
// read defensively (no `any`).
import type { JSX } from 'react';
import { View } from 'react-native';

import { Card, ProgressBar, Skeleton } from '@/components/display';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useBrainProfile } from '@/lib/data/aiBrain';
import { color, space } from '@/lib/design/tokens';

function capitalize(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

// "today" / "N hours ago" / "N days ago"; "recently" if null/unparseable.
function relativeTime(iso: string | null): string {
  if (!iso) return 'recently';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 'recently';
  const hours = Math.floor((Date.now() - t) / 3_600_000);
  if (hours < 1) return 'today';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function readMostActiveDay(gp: Record<string, unknown> | null): string | null {
  if (!gp) return null;
  const direct = gp['most_active_day'];
  if (typeof direct === 'string' && direct.length > 0) return capitalize(direct);
  const weekdays = gp['preferred_weekdays'];
  if (Array.isArray(weekdays) && typeof weekdays[0] === 'string') return capitalize(weekdays[0]);
  return null;
}

function readScanPct(sp: Record<string, unknown> | null): number | null {
  if (!sp) return null;
  const pct = sp['overall_accuracy_pct'];
  return typeof pct === 'number' ? pct : null;
}

export function BrainProfileCard(props: { onAskLume?: () => void }): JSX.Element {
  const { profile, loading, notEnoughData } = useBrainProfile();

  if (loading) {
    return (
      <Card>
        <View style={{ gap: space.md }}>
          <Skeleton width="60%" height={18} />
          <Skeleton width="80%" height={16} />
          <Skeleton width="50%" height={16} />
        </View>
      </Card>
    );
  }

  if (notEnoughData || !profile) {
    return (
      <Card>
        <View style={{ gap: space.md }}>
          <Text variant="title3">Lume is still learning</Text>
          <Text variant="callout" color={color.secondaryLabel}>
            Keep logging to unlock your profile
          </Text>
          <ProgressBar value={0.3} />
        </View>
      </Card>
    );
  }

  const rows: { label: string; value: string }[] = [];
  if (profile.typical_daily_calories !== null) {
    rows.push({ label: 'Typical daily intake', value: `~${Math.round(profile.typical_daily_calories)} kcal/day` });
  }
  if (profile.goal_adherence_score !== null) {
    rows.push({ label: 'Goal adherence', value: `${Math.round(profile.goal_adherence_score)}% of days on target` });
  }
  const activeDay = readMostActiveDay(profile.gym_patterns);
  if (activeDay) rows.push({ label: 'Most active day', value: activeDay });
  const scanPct = readScanPct(profile.scan_accuracy_profile);
  if (scanPct !== null) rows.push({ label: 'Scan accuracy', value: `Scans are ${Math.round(scanPct)}% accurate for you` });

  return (
    <Card>
      <View style={{ gap: space.lg }}>
        <Text variant="title3">Your AI profile</Text>

        <View style={{ gap: space.md }}>
          {rows.map((r) => (
            <View key={r.label} style={{ gap: space.xs }}>
              <Text variant="footnote" color={color.secondaryLabel}>
                {r.label}
              </Text>
              <Text variant="bodyMedium">{r.value}</Text>
            </View>
          ))}
        </View>

        <Text variant="caption" color={color.secondaryLabel}>
          Updated {relativeTime(profile.last_rebuilt)}
        </Text>

        {props.onAskLume ? (
          <Pressable
            onPress={props.onAskLume}
            minTapTarget={false}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, alignSelf: 'flex-start' }}
            accessibilityLabel="Ask Lume"
          >
            <Text variant="bodyMedium" color={color.primary}>
              Ask Lume
            </Text>
            <Icon name="chevron-forward" size={16} color={color.primary} />
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}
