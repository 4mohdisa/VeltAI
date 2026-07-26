// Mappers between API snake_case rows (@/lib/api) and the app's camelCase
// store types. Small, pure, and colocated with the data seam.
import type {
  FoodLog,
  FoodLogInput,
  FoodSearchResult,
  GymSession as ApiGymSession,
  GymStreak,
  SavedFood as ApiSavedFood,
  SavedFoodInput,
  SubscriptionStatus,
} from '@/lib/api';
import type { StoredFoodItem, StoredMeal } from './foodStore';
import type { Streak } from './gymStore';
import type { EntryMethod, GymSession, MealSlot, SavedFood } from '@/lib/mock/data';
import type { BarcodeProduct } from '@/lib/food/barcode';

export const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** True for server-generated UUIDs (vs local `it_…`/`s1` mock ids) — used to
 *  skip background API calls that could never address a real row. */
export const isServerId = (id: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(id);

// --- Food logs ----------------------------------------------------------------

const SLOTS: MealSlot[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

const slotOf = (mealType: string | null): MealSlot =>
  SLOTS.find((s) => s.toLowerCase() === mealType?.toLowerCase()) ?? 'Snacks';

const methodOf = (source: string | null): EntryMethod => {
  if (source === 'scan' || source === 'photo') return 'photo';
  if (source === 'voice') return 'voice';
  if (source === 'barcode') return 'barcode';
  return 'manual';
};

const hhmm = (iso: string): string => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Group flat food_logs rows into the store's per-slot meals. Item ids are the
 *  server row ids, so subsequent edit/delete mutations address the real rows. */
export function mealsFromLogs(rows: FoodLog[]): StoredMeal[] {
  const bySlot = new Map<MealSlot, FoodLog[]>();
  for (const row of rows) {
    const slot = slotOf(row.meal_type);
    bySlot.set(slot, [...(bySlot.get(slot) ?? []), row]);
  }
  const meals: StoredMeal[] = [];
  for (const slot of SLOTS) {
    const group = bySlot.get(slot);
    if (!group) continue;
    const items: StoredFoodItem[] = group.map((r) => ({
      id: r.id,
      name: r.food_name,
      quantityG: r.quantity ?? 0,
      calories: r.calories,
      protein: r.protein,
      carbs: r.carbs,
      fat: r.fat,
    }));
    meals.push({
      id: `srv_${slot}`,
      slot,
      time: hhmm(group[0].created_at),
      method: methodOf(group[0].source),
      calories: items.reduce((a, it) => a + it.calories, 0),
      protein: items.reduce((a, it) => a + it.protein, 0),
      carbs: items.reduce((a, it) => a + it.carbs, 0),
      fat: items.reduce((a, it) => a + it.fat, 0),
      items,
    });
  }
  return meals;
}

export function logInputFromItem(
  slot: MealSlot,
  item: { name: string; quantityG: number; calories: number; protein: number; carbs: number; fat: number },
  method: EntryMethod,
): FoodLogInput {
  return {
    date: todayISO(),
    meal_type: slot,
    food_name: item.name,
    quantity: item.quantityG,
    unit: 'g',
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    source: method,
  };
}

export function logPatchFromItem(patch: {
  name?: string;
  quantityG?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}): Partial<FoodLogInput> {
  return {
    food_name: patch.name,
    quantity: patch.quantityG,
    calories: patch.calories,
    protein: patch.protein,
    carbs: patch.carbs,
    fat: patch.fat,
  };
}

// --- Saved foods ----------------------------------------------------------------

export const savedFoodFromApi = (r: ApiSavedFood): SavedFood => ({
  id: r.id,
  name: r.food_name,
  brand: r.brand ?? undefined,
  servingG: r.serving_size ?? 0,
  calories: r.calories,
  protein: r.protein,
  carbs: r.carbs,
  fat: r.fat,
});

export const savedInputFromApp = (f: Omit<SavedFood, 'id'>): SavedFoodInput => ({
  food_name: f.name,
  brand: f.brand,
  calories: f.calories,
  protein: f.protein,
  carbs: f.carbs,
  fat: f.fat,
  fibre: 0,
  serving_size: f.servingG,
  serving_unit: 'g',
});

// --- Gym ------------------------------------------------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function humanDate(isoDate: string): string {
  const today = todayISO();
  if (isoDate === today) return 'Today';
  const d = new Date(`${isoDate}T00:00:00`);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  ) {
    return 'Yesterday';
  }
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export const sessionsFromApi = (rows: ApiGymSession[]): GymSession[] =>
  rows.map((r) => ({
    id: r.id,
    date: humanDate(r.date),
    durationMin: r.duration_minutes ?? 0,
    // ponytail: effort has no server column — hydrated rows show 0; add a column if it matters.
    effort: 0,
    notes: r.notes ?? undefined,
  }));

export const streakFromApi = (row: GymStreak, prev: Streak): Streak => ({
  current: row.current_streak,
  longest: row.longest_streak,
  totalGymDays: prev.totalGymDays, // not tracked server-side
  freezesAvailable: row.freeze_used ? 0 : 1, // one freeze per streak (backend semantics)
  gymLoggedToday: row.last_gym_date === todayISO(),
});

// --- Barcode / search --------------------------------------------------------------

/** Search results are normalized per-100g server-side ('' / 0 = unknown). */
export const barcodeProductFromApi = (r: FoodSearchResult): BarcodeProduct => ({
  name: r.food_name,
  brand: r.brand || undefined,
  kcalPer100: r.calories,
  proteinPer100: r.protein,
  carbsPer100: r.carbs,
  fatPer100: r.fat,
  servingOptions:
    r.serving_size > 0
      ? [r.serving_size, 100, 150, 200].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b)
      : [100, 150, 200],
});

// --- Subscription -------------------------------------------------------------------

type AppSubscription = {
  plan: string;
  price: number;
  status: 'trial' | 'active' | 'expired';
  trialStart: Date;
  trialEnd: Date;
  renewsOn: Date;
};

/** Map the backend status onto the app's subscription shape, keeping the mock's
 *  display fields (plan name/price) which the backend doesn't own. Returns null
 *  for 'none' — the caller keeps the mock (demo) subscription. */
export function subscriptionFromApi(s: SubscriptionStatus, mock: AppSubscription): AppSubscription | null {
  if (s.status === 'none') return null;
  const expires = s.expires_at ? new Date(s.expires_at) : mock.renewsOn;
  return {
    ...mock,
    status: s.status === 'trialing' ? 'trial' : s.is_active ? 'active' : 'expired',
    trialEnd: expires,
    renewsOn: expires,
  };
}
