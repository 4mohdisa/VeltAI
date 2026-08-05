// Shared mock dataset. Backend is out of scope tonight, so screens read from
// this single coherent source instead of diverging inline mocks — that way the
// streak/macros shown on the Dashboard match the Gym and Profile tabs.
// Australian context; names + cuisines weighted to the founder's background.
// NO gamification: streak is the only progression mechanic (no XP/ranks/points).

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export const mockUser = {
  name: 'Bilal Ahmed',
  email: 'bilal.ahmed@example.com',
  avatarUri: undefined as string | undefined,
  units: 'metric' as 'metric' | 'imperial',
  memberSince: 'Jun 2026',
};

// ---------------------------------------------------------------------------
// Streak — the only progression mechanic
// ---------------------------------------------------------------------------

export const mockStreak = {
  current: 13, //          current consecutive gym days
  longest: 21, //          longest-ever streak
  totalGymDays: 47, //     total gym days logged
  freezesAvailable: 2, //  emergency freeze tokens
  gymLoggedToday: false,
};

// ---------------------------------------------------------------------------
// Nutrition
// ---------------------------------------------------------------------------

export type MacroKey = 'calories' | 'protein' | 'carbs' | 'fat' | 'fibre';
export type MacroProgress = { consumed: number; target: number };

// Apple Health (mock) — today's active energy + steps for the calorie cross-check.

export const mockMacros: Record<MacroKey, MacroProgress> = {
  calories: { consumed: 1240, target: 2150 },
  protein: { consumed: 96, target: 165 },
  carbs: { consumed: 118, target: 215 },
  fat: { consumed: 41, target: 75 },
  fibre: { consumed: 18, target: 30 },
};

export type MealSlot = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
export type EntryMethod = 'photo' | 'voice' | 'barcode' | 'manual';

export type FoodItem = {
  name: string;
  quantityG: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence?: number; // 0..1; < 0.75 triggers an uncertainty prompt
};

export type Meal = {
  id: string;
  slot: MealSlot;
  time: string;
  method: EntryMethod;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items: FoodItem[];
};

export const mockMeals: Meal[] = [
  {
    id: 'm1',
    slot: 'Breakfast',
    time: '07:10',
    method: 'photo',
    calories: 520,
    protein: 34,
    carbs: 48,
    fat: 20,
    items: [
      { name: 'Oats with whey', quantityG: 250, calories: 320, protein: 28, carbs: 40, fat: 8 },
      { name: 'Two boiled eggs', quantityG: 100, calories: 155, protein: 13, carbs: 1, fat: 11 },
      { name: 'Banana', quantityG: 120, calories: 105, protein: 1, carbs: 27, fat: 0 },
    ],
  },
  {
    id: 'm2',
    slot: 'Lunch',
    time: '12:40',
    method: 'voice',
    calories: 620,
    protein: 42,
    carbs: 60,
    fat: 18,
    items: [
      { name: 'Chicken biryani', quantityG: 350, calories: 560, protein: 38, carbs: 58, fat: 16 },
      { name: 'Cucumber raita', quantityG: 80, calories: 60, protein: 4, carbs: 6, fat: 2 },
    ],
  },
  {
    id: 'm3',
    slot: 'Snacks',
    time: '15:30',
    method: 'barcode',
    calories: 100,
    protein: 20,
    carbs: 3,
    fat: 1,
    items: [{ name: 'Protein bar', quantityG: 60, calories: 100, protein: 20, carbs: 3, fat: 1 }],
  },
];

// ---------------------------------------------------------------------------
// Food catalog (manual search) + Saved foods — mock Open Food Facts + recents.
// No AI; these power the food-log search bar (C1) and Saved foods (C13).
// ---------------------------------------------------------------------------

export type FoodResult = {
  name: string;
  brand?: string;
  kcalPer100: number;
  // Present on real API hits; the local dev catalog carries calories only.
  protein?: number;
  carbs?: number;
  fat?: number;
};

export const foodCatalog: FoodResult[] = [
  { name: 'Chicken biryani', kcalPer100: 160 },
  { name: 'Greek yoghurt', brand: 'Chobani', kcalPer100: 59 },
  { name: 'Wholemeal roti', kcalPer100: 297 },
  { name: 'Lentil dal', kcalPer100: 116 },
  { name: 'Grilled salmon', kcalPer100: 208 },
  { name: 'Hummus', brand: 'Obela', kcalPer100: 177 },
  { name: 'Lamb karahi', kcalPer100: 190 },
  { name: 'Vegemite on toast', kcalPer100: 265 },
];

export const recentFoods: FoodResult[] = foodCatalog.slice(0, 3);

export type SavedFood = {
  id: string;
  name: string;
  brand?: string;
  servingG: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export const mockSavedFoods: SavedFood[] = [
  { id: 's1', name: 'Oats with whey', servingG: 250, calories: 320, protein: 28, carbs: 40, fat: 8 },
  { id: 's2', name: 'Chicken biryani', servingG: 350, calories: 560, protein: 38, carbs: 58, fat: 16 },
  { id: 's3', name: 'Greek yoghurt', brand: 'Chobani', servingG: 170, calories: 100, protein: 17, carbs: 6, fat: 0 },
  { id: 's4', name: 'Protein bar', servingG: 60, calories: 100, protein: 20, carbs: 3, fat: 1 },
  { id: 's5', name: 'Two boiled eggs', servingG: 100, calories: 155, protein: 13, carbs: 1, fat: 11 },
];

// ---------------------------------------------------------------------------
// AI daily plan
// ---------------------------------------------------------------------------

export type PlanKind = 'wake' | 'meal' | 'gym' | 'sleep';
export type PlanEntry = {
  time: string;
  title: string;
  kind: PlanKind;
  detail?: string;
  targetKcal?: number;
  suggestions?: string[];
};

export const mockPlan: PlanEntry[] = [
  { time: '06:30', title: 'Wake', kind: 'wake' },
  {
    time: '07:00',
    title: 'Breakfast',
    kind: 'meal',
    targetKcal: 500,
    suggestions: ['Oats with whey', 'Eggs and paratha', 'Chicken sandwich'],
  },
  {
    time: '12:30',
    title: 'Lunch',
    kind: 'meal',
    targetKcal: 600,
    suggestions: ['Chicken biryani', 'Lentil dal with rice', 'Grilled fish with vegetables'],
  },
  { time: '18:00', title: 'Gym — your preferred time', kind: 'gym', detail: '4 sessions this week' },
  {
    time: '19:30',
    title: 'Dinner',
    kind: 'meal',
    targetKcal: 650,
    suggestions: ['Lamb karahi with salad', 'Mediterranean chicken bowl', 'Beef stir-fry'],
  },
  { time: '22:30', title: 'Wind down', kind: 'sleep', detail: 'Your target bedtime' },
];

export const mockPlanReason =
  'You hit the gym 3/4 days this week and protein is averaging 96 g vs your 165 g target, so tomorrow leans higher-protein. Earlier bedtime suggested — your sleep is averaging 6.8h and your gym attendance drops when sleep dips under 6h.';

// ---------------------------------------------------------------------------
// Gym
// ---------------------------------------------------------------------------

export type DayStatus = 'session' | 'freeze' | 'missed' | 'future' | 'today';

// 30-day grid (oldest → today at index 29). Deterministic, plausible pattern.
export const mockGymCalendar: { index: number; status: DayStatus }[] = Array.from({ length: 30 }).map(
  (_, i) => {
    if (i === 29) return { index: i, status: 'today' as DayStatus };
    // current 13-day streak: last 13 days before today were sessions/freezes
    if (i >= 16) {
      if (i === 20) return { index: i, status: 'freeze' as DayStatus };
      return { index: i, status: 'session' as DayStatus };
    }
    // earlier: mix of sessions and misses
    const pattern: DayStatus[] = ['session', 'session', 'missed', 'session', 'missed', 'session'];
    return { index: i, status: pattern[i % pattern.length] };
  },
);

export type GymSession = {
  id: string;
  date: string;
  durationMin: number;
  effort: number;
  notes?: string;
};

export const mockGymSessions: GymSession[] = [
  { id: 'g1', date: 'Today', durationMin: 62, effort: 7, notes: 'Push day — felt strong' },
  { id: 'g2', date: 'Yesterday', durationMin: 48, effort: 6 },
  { id: 'g3', date: 'Sun 14 Jun', durationMin: 75, effort: 8, notes: 'Leg day' },
  { id: 'g4', date: 'Fri 12 Jun', durationMin: 55, effort: 5 },
  { id: 'g5', date: 'Thu 11 Jun', durationMin: 40, effort: 6 },
];

export type UpcomingDay = { label: string; action: 'log' | 'freeze' | 'scheduled' };
export const mockUpcomingDays: UpcomingDay[] = [
  { label: 'Today', action: 'log' },
  { label: 'Tomorrow', action: 'scheduled' },
  { label: 'Wed 18 Jun', action: 'scheduled' },
  { label: 'Thu 19 Jun', action: 'freeze' },
  { label: 'Fri 20 Jun', action: 'scheduled' },
  { label: 'Sat 21 Jun', action: 'scheduled' },
  { label: 'Sun 22 Jun', action: 'log' },
];

// ---------------------------------------------------------------------------
// Subscription / trial
// ---------------------------------------------------------------------------

export const mockSubscription = {
  plan: 'Lume Premium',
  price: 9.99,
  status: 'trial' as 'trial' | 'active' | 'expired',
  trialStart: new Date('2026-06-15'),
  trialEnd: new Date('2026-06-29'),
  renewsOn: new Date('2026-06-29'),
};
