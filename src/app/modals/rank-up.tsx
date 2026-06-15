// F2 · Rank-up modal
// Full-screen celebration shown when the user crosses a rank threshold.
// Rank + unlocks come via route params (mocked default here); dismiss pops back.
import { router, useLocalSearchParams } from 'expo-router';

import { RankUpModal } from '@/components/animations/RankUpModal';
import { RANKS } from '@/lib/xp/ranks';

export default function RankUpModalScreen() {
  const params = useLocalSearchParams<{ rank?: string }>();
  const rank = RANKS.find((r) => r.name === params.rank) ?? RANKS[2]; // default: Locked In

  return (
    <RankUpModal
      rankName={rank.name}
      unlocks={rank.unlocks}
      onContinue={() => {
        if (router.canGoBack()) router.back();
      }}
    />
  );
}
