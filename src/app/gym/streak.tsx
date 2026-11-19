// D4 · Streak detail
// Streak counter up top, then longest streak, total sessions and freezes
// available. The design's "next 7 days" list needs per-day log/freeze/scheduled
// suggestions no backend route provides (PHASE2_ROWS.md row 12) — rather than
// inventing them, this screen shows only what the server actually knows.
import { View } from 'react-native';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { Stat } from '@/components/display/Stat';
import { StreakCounter } from '@/components/domain/StreakCounter';
import { useGym } from '@/lib/data';
import { space } from '@/lib/design/tokens';

export default function StreakDetailScreen() {
  const {
    data: { streak },
  } = useGym();
  return (
    <Screen variant="floating" title="Streak" showBack contentStyle={{ gap: space.xl }}>
      <Card variant="elevated">
        <StreakCounter days={streak.current} />
      </Card>

      <Card variant="elevated">
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <Stat value={streak.longest} label="Longest" size="small" align="center" />
          <Stat value={streak.totalGymDays} label="Sessions" size="small" align="center" />
          <Stat value={streak.freezesAvailable} label="Freezes" size="small" align="center" />
        </View>
      </Card>
    </Screen>
  );
}
