// Rank ladder from docs/Engineering/Gamification System.md. Ranks are permanent
// and computed live from total XP (never stored as a counter). Unlocks are
// cosmetic only — nothing is paywalled.

export type Rank = {
  name: string;
  minXp: number;
  unlocks: string[];
};

export const RANKS: Rank[] = [
  { name: 'Recruit', minXp: 0, unlocks: ['Default'] },
  { name: 'Contender', minXp: 500, unlocks: ['Leaderboard access (Phase 2)'] },
  { name: 'Locked In', minXp: 2000, unlocks: ['1 streak freeze token', 'Bronze badge'] },
  { name: 'Grinder', minXp: 5000, unlocks: ['Silver badge', 'Custom habit icons'] },
  { name: 'Elite', minXp: 15000, unlocks: ['2 streak freezes', 'Gold badge', 'Dark theme'] },
  { name: 'Untouchable', minXp: 50000, unlocks: ['Platinum badge', 'All themes', 'Priority support'] },
];

export type RankProgress = {
  current: Rank;
  next: Rank | null;
  /** 0..1 fraction toward the next rank (1 when at max rank). */
  progress: number;
  xpIntoRank: number;
  xpForNext: number | null;
};

export function rankFromXp(totalXp: number): RankProgress {
  let currentIndex = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (totalXp >= RANKS[i].minXp) currentIndex = i;
  }
  const current = RANKS[currentIndex];
  const next = RANKS[currentIndex + 1] ?? null;

  if (!next) {
    return { current, next: null, progress: 1, xpIntoRank: totalXp - current.minXp, xpForNext: null };
  }

  const span = next.minXp - current.minXp;
  const xpIntoRank = totalXp - current.minXp;
  return {
    current,
    next,
    progress: span > 0 ? Math.min(1, xpIntoRank / span) : 0,
    xpIntoRank,
    xpForNext: next.minXp - totalXp,
  };
}
