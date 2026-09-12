// C1 · Food log (default)
// A native iOS sectioned list (SectionList): one section per meal slot
// (Breakfast/Lunch/Dinner/Snacks) with a header showing the meal + its calorie
// subtotal, and the logged foods as rows (name + macros left, calories right,
// hairline separators, rounded inset group). Tapping a row opens the shared food
// detail sheet; the section's + adds to that meal. A search bar pins above the list;
// the solid black + FAB floats clear of the tab bar.
//
// Design-file pass (DECISIONS.md): the page is a `surface.backgroundAlt` zone
// with a blurred floating header strip, an eyebrow + large title inside the
// scroll, a calories card at the top, and each meal's rows grouped as a WHITE
// elevated card. A logged row and a search result open the same detail sheet
// (architecture item 4).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, SectionList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/primitives/Icon';
import { AnomalyBanner } from '@/components/ai';

import { Text } from '@/components/primitives/Text';
import { Pressable } from '@/components/primitives/Pressable';
import { Card } from '@/components/display/Card';
import { CardHeaderRow } from '@/components/display/CardHeaderRow';
import { FloatingHeader } from '@/components/navigation/FloatingHeader';
import { ProfileAvatarButton } from '@/components/navigation/ProfileAvatarButton';
import { TAB_BAR_CLEARANCE } from '@/components/navigation/LumeTabBar';
import { EmptyState } from '@/components/display/EmptyState';
import { ErrorState } from '@/components/display/ErrorState';
import { LoadFailedNotice } from '@/components/display/LoadFailedNotice';
import { Skeleton, SkeletonList } from '@/components/display/LoadingSkeleton';
import { SwipeableRow } from '@/components/display/SwipeableRow';
import { TextField } from '@/components/forms/TextField';
import { ScanReviewCard, type ReviewItem } from '@/components/food/scan/ScanReviewCard';
import { ScanFailedCard } from '@/components/food/scan/ScanFailedCard';
import { ScanFeedbackPrompt } from '@/components/food/scan/ScanFeedbackPrompt';
import { showToast } from '@/components/display/toastStore';
import { accent, categoryAccent, color, layout, radius, shadow, space, surface } from '@/lib/design/tokens';
import { useLargeText } from '@/lib/design/dynamicType';
import { haptics } from '@/lib/haptics';
import { formatCalories, formatNumber } from '@/lib/formatting';
import { useUnitPreferences } from '@/lib/settings/store';
import { formatEnergy, kcalToDisplay } from '@/lib/units';
import {
  useFoodLog,
  useFoodSearch,
  editFoodItem,
  deleteFoodItem,
  saveScannedItem,
  discardScannedItem,
  submitScanFeedback,
  type StoredMeal,
} from '@/lib/data';
import { subscribeToFoodLogStatus } from '@/lib/data/realtime';
import { useFoodStore } from '@/lib/data/foodStore';
import { fromIso, useLoggedDays } from '@/lib/data/foodDays';
import { WeekStrip } from '@/components/food/WeekStrip';
import { openFoodDetail, type DetailItem } from '@/lib/food/detailSubject';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import type { DietaryRequirement, ScanFeedbackRating, ScanItemStatus } from '@/lib/types';
import type { FoodResult, MealSlot } from '@/lib/mock/data';

const SLOTS: MealSlot[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

// Each meal slot gets its own glyph colour, as the design file does. Functional
// use only: the dot is the section's category marker — nothing else on the card
// is tinted (tokens.ts colour rule).
const SLOT_TINT: Record<MealSlot, string> = {
  Breakfast: accent.yellow,
  Lunch: accent.green,
  Dinner: accent.blue,
  Snacks: accent.turquoise,
};

// The white elevated group a meal's rows sit in: one card per meal, `radius.xl`
// on the outer corners only, so consecutive rows read as a single surface on the
// grey page. `first`/`last` come from the row's index in its section.
function groupSurface(first: boolean, last: boolean) {
  return {
    backgroundColor: surface.cardElevated,
    borderTopLeftRadius: first ? radius.xl : 0,
    borderTopRightRadius: first ? radius.xl : 0,
    borderBottomLeftRadius: last ? radius.xl : 0,
    borderBottomRightRadius: last ? radius.xl : 0,
    ...shadow.sm,
  };
}

// Hairline between rows inside a group — a fill, inset under the text.
function GroupSeparator() {
  return (
    <View
      style={{
        position: 'absolute',
        left: space.lg,
        right: 0,
        top: 0,
        height: layout.hairline,
        backgroundColor: surface.divider,
      }}
    />
  );
}

type FoodRow = DetailItem & {
  pending?: boolean;
  status?: ScanItemStatus;
  confidence?: number;
  scanSessionId?: string;
  estimatedWeightG?: number;
};

// Dietary-conflict keywords per requirement (Task 5). Client-side only: the
// search response carries no cuisine-match / dietary flag, so we can only warn
// on obvious name conflicts. The positive "in your library ✓" badge is
// deliberately OMITTED — the backend returns no library-match flag and the
// client has no library data to check against.
const CONFLICT_KEYWORDS: Partial<Record<DietaryRequirement, string[]>> = {
  halal: ['pork', 'bacon', 'ham'],
  vegan: ['meat', 'chicken', 'beef', 'fish', 'egg', 'milk', 'cheese'],
  vegetarian: ['meat', 'chicken', 'beef', 'fish', 'pork'],
  gluten_free: ['bread', 'pasta', 'wheat', 'noodle'],
};

function dietaryConflict(name: string, reqs: DietaryRequirement[]): DietaryRequirement | null {
  const n = name.toLowerCase();
  for (const req of reqs) {
    const kws = CONFLICT_KEYWORDS[req];
    if (kws && kws.some((k) => n.includes(k))) return req;
  }
  return null;
}
type MealSection = { slot: MealSlot; subtotal: number; data: FoodRow[] };

// The one SectionList renders two kinds of section: the meal slots (normal log)
// and, while searching, a single results section. Branch on `kind` to render.
type ListRow = FoodRow | FoodResult;
type ListSection =
  | { kind: 'meal'; slot: MealSlot; subtotal: number; data: FoodRow[] }
  | { kind: 'result'; data: FoodResult[] };

// Group the store's meals into one section per canonical slot (rows carry the
// store item id so edits/deletes/pending map straight back through the seam).
function buildSections(meals: StoredMeal[]): MealSection[] {
  const bySlot: Record<MealSlot, FoodRow[]> = { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
  for (const meal of meals) {
    for (const it of meal.items) {
      // 'ready' rows live in the ScanReviewCard header, not the meal list.
      if (it.status === 'ready') continue;
      bySlot[meal.slot].push({
        id: it.id,
        name: it.name,
        quantityG: it.quantityG,
        calories: it.calories,
        protein: it.protein,
        carbs: it.carbs,
        fat: it.fat,
        ...(it.fibre != null ? { fibre: it.fibre } : {}),
        pending: it.pending,
        // A pending (unresolved) row renders as 'analyzing'.
        status: it.status ?? (it.pending ? 'analyzing' : undefined),
        confidence: it.confidence,
        scanSessionId: it.scanSessionId,
        estimatedWeightG: it.estimatedWeightG,
      });
    }
  }
  return SLOTS.map((slot) => ({
    slot,
    data: bySlot[slot],
    subtotal: bySlot[slot].reduce((s, i) => s + i.calories, 0),
  }));
}


export default function FoodLogScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const energyUnit = useUnitPreferences().energy;
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  // Data seam — reactive meals + first-load slot. Edits go through the mutations.
  // The day on screen. useFoodLog() follows the store's selection, so switching
  // days re-reads (and hydrates) that day rather than today.
  const selectedDate = useFoodStore((st) => st.selectedDate);
  const setSelectedDate = useFoodStore((st) => st.setSelectedDate);
  const { days: loggedDays, refetch: refetchDays } = useLoggedDays();
  const { data: meals, isLoading: loading, error, refetch } = useFoodLog();
  const loadError = !!error;
  const sections = useMemo(() => buildSections(meals), [meals]);

  const total = sections.reduce((sum, s) => sum + s.subtotal, 0);
  const itemCount = sections.reduce((n, s) => n + s.data.length, 0);
  // Day macro totals for the calories card — summed off the SAME rows the list
  // renders, so nothing here is a second source of truth. (No fibre column: food
  // items carry protein/carbs/fat only. No goal ring / "left today" number
  // either — the calorie goal is not read on this screen.)
  const macroTotals = useMemo(
    () =>
      sections.reduce(
        (a, s) =>
          s.data.reduce(
            (b, i) => ({ protein: b.protein + i.protein, carbs: b.carbs + i.carbs, fat: b.fat + i.fat }),
            a,
          ),
        { protein: 0, carbs: 0, fat: 0 },
      ),
    [sections],
  );

  const searching = query.trim().length > 0;
  const { results, isLoading: searchLoading, error: searchError, refetch: retrySearch } = useFoodSearch(query);
  const dietaryReqs = useOnboardingStore((s) => s.dietary_requirements);

  // Scanned rows awaiting review ('ready') / that failed to analyse ('failed') —
  // derived off the same store the log reads. Ready rows drive the review card;
  // failed rows drive the failed card (they still show as muted rows in-list).
  const readyItems = useMemo<ReviewItem[]>(
    () =>
      meals.flatMap((m) =>
        m.items
          .filter((it) => it.status === 'ready')
          .map((it) => ({
            id: it.id,
            name: it.name,
            estimatedWeightG: it.estimatedWeightG ?? it.quantityG,
            weightG: it.quantityG,
            confidence: Math.round((it.confidence ?? 0) * 100), // store keeps 0..1
            scanSessionId: it.scanSessionId ?? '',
            calories: it.calories,
            protein: it.protein,
            carbs: it.carbs,
            fat: it.fat,
            angleAgreement: it.angleAgreement,
            needsConfirmation: it.needsConfirmation,
            reconciliationNote: it.reconciliationNote,
            alternateWeightG: it.alternateWeightG,
            matchedMealName: it.matchedMealName,
            matchedMealWeightG: it.matchedMealWeightG,
            confidenceLabel: it.confidenceLabel,
            confidenceFactors: it.confidenceFactors,
          })),
      ),
    [meals],
  );
  const failedIds = useMemo(
    () => meals.flatMap((m) => m.items.filter((it) => it.status === 'failed').map((it) => it.id)),
    [meals],
  );

  // The scan session to rate after a save; null hides the feedback prompt.
  const [feedbackSession, setFeedbackSession] = useState<string | null>(null);

  // Realtime seam (Task 7d) — wired for when Supabase lands; a no-op unsubscribe
  // today. Cleaning up on unmount keeps the call site honest.
  useEffect(() => subscribeToFoodLogStatus(null, () => {}), []);

  // Plain handlers — the React Compiler memoizes them; manual useCallback here
  // trips the preserve-manual-memoization rule (setters aren't listed as deps).
  const onSaveAll = () => {
    const session = readyItems.find((i) => i.scanSessionId)?.scanSessionId ?? '';
    readyItems.forEach((i) => saveScannedItem(i.id));
    haptics.success();
    setFeedbackSession(session || null); // only prompt when there's a session to rate
  };

  const discardReady = () => readyItems.forEach((i) => discardScannedItem(i.id));
  const discardFailed = () => failedIds.forEach((id) => discardScannedItem(id));
  const failedLogManually = () => {
    failedIds.forEach((id) => discardScannedItem(id));
    router.push('/food/add');
  };
  const rateScan = (rating: ScanFeedbackRating) => {
    if (feedbackSession) submitScanFeedback(feedbackSession, rating);
    setFeedbackSession(null);
  };

  // Feed a single SectionList so the search field never unmounts (no focus loss)
  // and the header scrolls with the content. While searching → a results
  // section; otherwise the meal sections (empty/loading/error fall to
  // ListEmptyComponent so there are no sections to render).
  const listSections = useMemo<ListSection[]>(() => {
    if (searching) {
      return results.length > 0 ? [{ kind: 'result', data: results }] : [];
    }
    if (loading || itemCount === 0) return [];
    return sections.map((s) => ({ kind: 'meal', ...s }));
  }, [searching, results, loading, itemCount, sections]);

  const onRefresh = useCallback(() => {
    haptics.impactLight(); // pull-to-refresh trigger
    setRefreshing(true);
    refetch();
    refetchDays();
    // refetch() is fire-and-forget (returns void) — keep a short visible spin.
    setTimeout(() => setRefreshing(false), 700);
  }, [refetch, refetchDays]);

  const removeRow = (id: string) => deleteFoodItem(id);

  // A logged row and a search result open the SAME detail sheet, in different
  // modes. The subject travels through the store, never the URL — a food name
  // and its macros are personal data.
  const openRow = (row: FoodRow, slot: MealSlot) => {
    openFoodDetail({
      mode: 'logged',
      slot,
      item: {
        id: row.id,
        name: row.name,
        quantityG: row.quantityG,
        calories: row.calories,
        protein: row.protein,
        carbs: row.carbs,
        fat: row.fat,
        ...(row.fibre != null ? { fibre: row.fibre } : {}),
      },
    });
    router.push('/food/detail');
  };

  const pick = (food: FoodResult) => {
    openFoodDetail({ mode: 'search', name: food.name, kcalPer100: food.kcalPer100, fibrePer100: food.fibre });
    router.push('/food/detail');
  };

  return (
    // No SafeAreaView top edge: the scroll runs under the status bar so the
    // FloatingHeader strip has something to blur (design-file treatment).
    <View style={{ flex: 1, backgroundColor: surface.backgroundAlt }}>
      <SectionList<ListRow, ListSection>
        sections={listSections}
        keyExtractor={(item, index) => ('id' in item ? item.id : `${item.name}-${index}`)}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingTop: insets.top + space.md,
          paddingBottom: TAB_BAR_CLEARANCE(insets),
          flexGrow: 1,
        }}
        refreshControl={
          searching ? undefined : (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.black} />
          )
        }
        // The eyebrow + title, the calories card and the search bar live INSIDE
        // the list so they scroll away (and under the blurred header strip)
        // instead of staying pinned. Keeping it as a
        // constant header on one always-mounted SectionList means the search field
        // never remounts (no focus loss) when results appear.
        ListHeaderComponent={
          <View style={{ paddingBottom: space.md, gap: space.md }}>
            {/* Amber anomaly banner — self-contained, renders null when there are none. */}
            <AnomalyBanner onPress={() => router.push('/insights' as Href)} />
            {/* Eyebrow + large title inside the scroll — the design's header. The
                eyebrow names the day being shown, which is no longer always today
                (architecture item 3). */}
            <View style={{ gap: space.xs, paddingBottom: space.xs }}>
              <Text
                variant="label"
                color={color.secondaryLabel}
                style={{ textTransform: 'uppercase', letterSpacing: 1 }}
              >
                {fromIso(selectedDate).toLocaleDateString(undefined, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </Text>
              <Text variant="title1" color={color.label} accessibilityRole="header">
                Food
              </Text>
            </View>
            {/* The read failed but the device has rows (possibly queued offline
                writes). They stay on screen, labelled — the empty-list ErrorState
                below covers the case where there is nothing to show at all. */}
            {loadError && itemCount > 0 ? (
              <LoadFailedNotice message="Couldn't load today's food log." onRetry={refetch} />
            ) : null}
            {/* Day switcher — hidden while searching, which is a whole-library
                view rather than a view of one day. */}
            {!searching ? (
              <WeekStrip
                selected={selectedDate}
                onSelect={setSelectedDate}
                loggedDays={loggedDays}
                onOpenCalendar={() => router.push('/food/calendar')}
              />
            ) : null}
            {!searching && !loading && !loadError && itemCount > 0 ? (
              <CaloriesCard total={total} macros={macroTotals} energyUnit={energyUnit} />
            ) : null}
            <TextField
              placeholder={t('foodLog.searchPlaceholder')}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              accessibilityLabel={t('foodLog.searchPlaceholder')}
            />
            {!searching && feedbackSession ? (
              <ScanFeedbackPrompt onRate={rateScan} onDismiss={() => setFeedbackSession(null)} />
            ) : null}
            {!searching && readyItems.length > 0 ? (
              <ScanReviewCard
                items={readyItems}
                onWeightChange={(id, grams) => editFoodItem(id, { quantityG: grams })}
                onDiscard={discardReady}
                onSaveAll={onSaveAll}
              />
            ) : null}
            {!searching && failedIds.length > 0 ? (
              <ScanFailedCard onLogManually={failedLogManually} onDiscard={discardFailed} />
            ) : null}
          </View>
        }
        renderSectionHeader={({ section }) =>
          section.kind === 'meal' ? (
            <MealSectionHeader
              slot={section.slot}
              subtotal={section.subtotal}
              energyUnit={energyUnit}
              onAdd={() => router.push({ pathname: '/food/add', params: { slot: section.slot } })}
              onDeleteMeal={section.data.length > 0 ? () => confirmDeleteMeal(section.slot, section.data) : undefined}
            />
          ) : null
        }
        renderItem={({ item, index, section }) => {
          if (section.kind === 'result') {
            const food = item as FoodResult;
            return (
              <SearchResultRow
                food={food}
                first={index === 0}
                last={index === section.data.length - 1}
                conflict={dietaryConflict(food.name, dietaryReqs)}
                onPick={() => pick(food)}
              />
            );
          }
          // Swipe-to-delete (Reanimated); tapping the row → edit sheet Delete is
          // the accessible non-gesture alternative.
          const row = item as FoodRow;
          return (
            <SwipeableRow
              onDelete={() => removeRow(row.id)}
              confirmTitle={`Remove ${row.name}?`}
              confirmMessage="This removes it from today's log."
            >
              <FoodItemRow
                item={row}
                first={index === 0}
                last={index === section.data.length - 1}
                energyUnit={energyUnit}
                onPress={() => openRow(row, section.slot)}
              />
            </SwipeableRow>
          );
        }}
        renderSectionFooter={({ section }) =>
          section.kind === 'meal' && section.data.length === 0 ? (
            <Pressable
              haptic={false}
              minTapTarget={false}
              onPress={() => router.push({ pathname: '/food/add', params: { slot: section.slot } })}
              accessibilityLabel={`Add to ${section.slot}`}
              style={{
                ...groupSurface(false, true),
                paddingHorizontal: space.lg,
                minHeight: 56,
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.sm,
                marginBottom: space.md,
              }}
            >
              <Icon name="add-circle-outline" size={20} color={color.tertiaryLabel} />
              <Text variant="footnote" color={color.tertiaryLabel}>
                {t('foodLog.addToMeal', { slot: section.slot })}
              </Text>
            </Pressable>
          ) : (
            <View style={{ height: space.md }} />
          )
        }
        ListEmptyComponent={
          // "No matches" is a claim about the food database — only make it when
          // a COMPLETED search returned zero. While the debounce + round-trip
          // run, show the skeleton; when the search itself failed (offline,
          // 500), say that. Pre-audit both states rendered as a confident
          // false "No matches for 'X'" (audit 2026-08-06).
          searching && searchLoading ? (
            <View style={{ paddingTop: space.lg }}>
              <SkeletonList rows={3} />
            </View>
          ) : searching && searchError ? (
            <ErrorState
              message="Search couldn't reach the food database. Check your connection and try again."
              onRetry={retrySearch}
            />
          ) : searching ? (
            <EmptyState
              icon="magnifyingglass"
              title={t('foodLog.noMatches', { query: query.trim() })}
              message={t('foodLog.noMatchesHint')}
              actionLabel={t('foodLog.addCustomFood')}
              onAction={() => router.push('/food/custom-food')}
            />
          ) : loadError ? (
            <ErrorState
              message="We couldn't load today's food log. Check your connection and try again."
              onRetry={refetch}
            />
          ) : loading ? (
            <View style={{ paddingTop: space.lg }}>
              <SkeletonList rows={5} />
            </View>
          ) : readyItems.length > 0 || failedIds.length > 0 ? (
            // A scan card in the header IS the content — don't also say "no meals".
            null
          ) : (
            <View style={{ paddingTop: space['4xl'] }}>
              <EmptyState
                icon="fork.knife"
                title={t('foodLog.noMealsTitle')}
                message={t('foodLog.noMealsMessage')}
                actionLabel={t('foodLog.addMeal')}
                onAction={() => router.push('/food/add')}
              />
            </View>
          )
        }
        ListFooterComponent={
          searching && results.length > 0 ? (
            <Pressable
              haptic={false}
              minTapTarget={false}
              onPress={() => router.push('/food/custom-food')}
              accessibilityLabel={t('foodLog.addCustomFood')}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.md }}
            >
              <Icon name="create-outline" size={18} color={color.label} />
              <Text variant="bodyBold" color={color.label}>
                {t('foodLog.addCustomFood')}
              </Text>
            </Pressable>
          ) : !searching && !loadError && !loading && itemCount > 0 ? (
            <Pressable
              haptic={false}
              minTapTarget={false}
              onPress={() => router.push('/food/history')}
              accessibilityLabel={t('foodLog.mealHistory')}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs, padding: space.md }}
            >
              <Icon name="time-outline" size={16} color={color.label} />
              <Text variant="bodyBold" color={color.label}>
                {t('foodLog.mealHistory')}
              </Text>
            </Pressable>
          ) : null
        }
      />


      {/* Blurred strip the content scrolls under — decorative, no touches. */}
      <FloatingHeader height={insets.top + space.xl} />

      {/* The way into Profile, as on Summary (V2). */}
      <ProfileAvatarButton />
    </View>
  );
}

// ---------------------------------------------------------------------------

// The design's calories card: an elevated white card with the day's energy as
// the hero number and the macro totals beneath it. There is deliberately no
// "left today" figure and no progress bar — the calorie goal and the macro
// targets are not read on this screen, and a bar without a target would be an
// invented measurement (UI_PASS_GAPS.md §2).
function CaloriesCard({
  total,
  macros,
  energyUnit,
}: {
  total: number;
  macros: { protein: number; carbs: number; fat: number };
  energyUnit: ReturnType<typeof useUnitPreferences>['energy'];
}) {
  const columns = [
    { name: 'Protein', tint: categoryAccent.protein, value: macros.protein },
    { name: 'Carbs', tint: categoryAccent.carbs, value: macros.carbs },
    { name: 'Fat', tint: categoryAccent.fat, value: macros.fat },
  ];
  return (
    <Card variant="elevated" style={{ gap: space.lg }}>
      <CardHeaderRow title="Calories" icon="flame.fill" tint={categoryAccent.calories} />
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
        <Text variant="statLarge" color={color.label}>
          {formatNumber(kcalToDisplay(total, energyUnit))}
        </Text>
        <Text variant="callout" color={color.secondaryLabel}>
          {`${energyUnit} logged`}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: space.md }}>
        {columns.map((c) => (
          <View key={c.name} style={{ flex: 1, minWidth: 0, gap: space.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
              <View style={{ width: space.sm, height: space.sm, borderRadius: radius.full, backgroundColor: c.tint }} />
              <Text variant="caption" color={color.secondaryLabel}>
                {c.name}
              </Text>
            </View>
            <Text variant="statSmall" color={color.label}>
              {`${Math.round(c.value)}g`}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

// ---------------------------------------------------------------------------

/** Clear a whole meal at once.
 *
 *  This capability came from `food/[meal].tsx`, which architecture item 4
 *  deleted. That screen was reachable — the nutrition detail's meal rows pushed
 *  it — so its meal-wide delete had to land somewhere rather than disappear with
 *  the route. It lives on the meal header as a long press: the design gives this
 *  row exactly one control (the black +), and inventing a second one would be
 *  adding chrome the design does not have.
 *
 *  ponytail: a long press is not discoverable. The accessibilityHint announces
 *  it to VoiceOver, but a sighted user will not find it unaided. Flagged for a
 *  human — the right answer is probably swipe-to-delete on the header or an
 *  overflow, and that is a design call, not one to make at random. */
function confirmDeleteMeal(slot: MealSlot, rows: { id: string; name: string }[]): void {
  haptics.warning();
  Alert.alert(
    `Delete ${slot}?`,
    `This removes ${rows.length} ${rows.length === 1 ? 'item' : 'items'} and recomputes the day's totals.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          haptics.impactHeavy();
          rows.forEach((r) => deleteFoodItem(r.id));
          showToast({ message: `${slot} deleted.`, tone: 'info' });
        },
      },
    ],
  );
}

function MealSectionHeader({
  slot,
  subtotal,
  energyUnit,
  onAdd,
  onDeleteMeal,
}: {
  slot: MealSlot;
  subtotal: number;
  energyUnit: ReturnType<typeof useUnitPreferences>['energy'];
  onAdd: () => void;
  onDeleteMeal?: () => void;
}) {
  return (
    <View
      style={{
        // The header is the top of the meal's white card (the design keeps
        // the slot, its total and the + inside the card, not above it).
        ...groupSurface(true, false),
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        minHeight: layout.tapTarget,
        paddingHorizontal: space.lg,
        paddingTop: space.sm,
        paddingBottom: space.sm,
      }}
    >
      {/* The slot's category dot — the one tinted mark on the row. */}
      <View style={{ width: space.md, height: space.md, borderRadius: radius.full, backgroundColor: SLOT_TINT[slot] }} />
      <Pressable
        haptic={false}
        minTapTarget={false}
        onLongPress={onDeleteMeal}
        disabled={!onDeleteMeal}
        accessibilityRole="header"
        accessibilityLabel={`${slot}, ${formatEnergy(subtotal, energyUnit)}`}
        accessibilityHint={onDeleteMeal ? `Long press to delete everything logged to ${slot}` : undefined}
      >
        <Text variant="bodyMedium" color={color.label}>
          {slot}
        </Text>
      </Pressable>
      <View
        style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.xs, marginLeft: 'auto' }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text variant="statSmall" color={color.label}>
          {formatNumber(kcalToDisplay(subtotal, energyUnit))}
        </Text>
        <Text variant="caption" color={color.tertiaryLabel}>
          {energyUnit}
        </Text>
      </View>
      {/* 44pt hit area around the design's black + disc. */}
      <Pressable
        haptic={false}
        minTapTarget={false}
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel={`Add to ${slot}`}
        style={{
          width: layout.tapTarget,
          height: layout.tapTarget,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: -space.md,
        }}
      >
        <View
          style={{
            width: space['2xl'],
            height: space['2xl'],
            borderRadius: radius.full,
            backgroundColor: color.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="add" size={16} color={color.onPrimary} />
        </View>
      </Pressable>
    </View>
  );
}

function FoodItemRow({
  item,
  first,
  last,
  energyUnit,
  onPress,
}: {
  item: FoodRow;
  first: boolean;
  last: boolean;
  energyUnit: ReturnType<typeof useUnitPreferences>['energy'];
  onPress: () => void;
}) {
  // HIG §7.2: at large text the trailing calories stack under the name/macros
  // (no clipping, no truncation) instead of colliding on one line.
  const large = useLargeText();
  // Treat an unresolved pending row as 'analyzing'. A 'failed' row is inert.
  const analyzing = item.status === 'analyzing' || (item.pending && item.status !== 'failed');
  const failed = item.status === 'failed';
  return (
    <Pressable
      haptic={false}
      minTapTarget={false}
      onPress={failed || analyzing ? undefined : onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={
        analyzing
          ? 'Analyzing scanned food…'
          : failed
            ? `${item.name} — couldn't be analysed`
            : `${item.name}, ${item.quantityG} g, protein ${item.protein}, carbs ${item.carbs}, fat ${item.fat}, ${formatEnergy(item.calories, energyUnit)}`
      }
      accessibilityHint={analyzing || failed ? undefined : 'Double tap to edit, swipe left to delete'}
      style={{
        ...groupSurface(false, last),
        flexDirection: large ? 'column' : 'row',
        alignItems: large ? 'flex-start' : 'center',
        gap: large ? space.xs : space.md,
        paddingHorizontal: space.lg,
        paddingVertical: large ? space.md : 0,
        minHeight: 60,
      }}
    >
      {/* hairline separator between rows (inset under the text) */}
      {!first ? <GroupSeparator /> : null}
      {analyzing ? (
        // Analyzing state (Task 3) — the scanned row fills in once the mock/real
        // inference resolves. Same row height so the layout doesn't jump.
        <>
          <View style={{ flex: large ? undefined : 1, gap: space.xs, paddingVertical: space.sm }}>
            <Text variant="footnote" color={color.secondaryLabel}>
              Analyzing…
            </Text>
            <Skeleton width="60%" height={14} />
          </View>
          <Skeleton width={40} height={14} />
        </>
      ) : failed ? (
        // Failed state (Task 7b) — muted row + warning glyph; the row itself is
        // inert (the top-of-log ScanFailedCard carries the recovery actions).
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flex: 1, paddingVertical: space.sm }}>
          <Icon name="alert-circle-outline" size={18} color={accent.red} />
          <Text variant="body" color={color.secondaryLabel} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
      ) : (
        <>
          <View style={{ flex: large ? undefined : 1, gap: space.xs, paddingVertical: large ? 0 : space.sm }}>
            <Text variant="body" color={color.label} numberOfLines={large ? 0 : 1}>
              {item.name}
            </Text>
            <Text variant="footnote" color={color.secondaryLabel} numberOfLines={large ? 0 : 1}>
              {item.quantityG} g · P {item.protein} · C {item.carbs} · F {item.fat}
            </Text>
          </View>
          {/* Trailing energy: the design's rounded stat number with a small unit
              caption beside it. */}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.xs }}>
            <Text variant="statSmall" color={color.label}>
              {formatNumber(kcalToDisplay(item.calories, energyUnit))}
            </Text>
            <Text variant="caption" color={color.tertiaryLabel}>
              {energyUnit}
            </Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

// A single search-result row — same rounded inset-group look as the meal rows
// (card fill, hairline separators, first/last corner rounding).
function SearchResultRow({
  food,
  first,
  last,
  conflict,
  onPick,
}: {
  food: FoodResult;
  first: boolean;
  last: boolean;
  conflict: DietaryRequirement | null;
  onPick: () => void;
}) {
  const { t } = useTranslation();
  // Subtle, non-blocking dietary warning (Task 5): the food name matches a
  // keyword that conflicts with a requirement the user selected in onboarding.
  const conflictLabel = conflict ? conflict.replace(/_/g, ' ') : null;
  const warnConflict = () =>
    conflictLabel && showToast({ message: `May not match your ${conflictLabel} preference`, tone: 'warn' });
  return (
    <Pressable
      haptic={false}
      minTapTarget={false}
      onPress={onPick}
      onLongPress={conflict ? warnConflict : undefined}
      accessibilityRole="button"
      accessibilityLabel={`Add ${food.name}`}
      accessibilityHint={conflictLabel ? `May not match your ${conflictLabel} preference` : undefined}
      style={{
        ...groupSurface(first, last),
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingHorizontal: space.lg,
        minHeight: 60,
      }}
    >
      {!first ? <GroupSeparator /> : null}
      <View style={{ flex: 1, gap: space.xs, paddingVertical: space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
          {conflict ? <Icon name="alert-circle-outline" size={16} color={accent.orange} /> : null}
          <Text variant="body" color={color.label}>
            {food.name}
          </Text>
        </View>
        <Text variant="footnote" color={color.secondaryLabel}>
          {food.brand ? `${food.brand} · ` : ''}
          {t('foodLog.per100', { value: formatCalories(food.kcalPer100) })}
        </Text>
      </View>
      {/* The design's black + disc, same mark as the meal-card add button. */}
      <View
        style={{
          width: space['2xl'],
          height: space['2xl'],
          borderRadius: radius.full,
          backgroundColor: color.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="add" size={16} color={color.onPrimary} />
      </View>
    </Pressable>
  );
}
