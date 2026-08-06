// C1 · Food log (default)
// A native iOS sectioned list (SectionList): one section per meal slot
// (Breakfast/Lunch/Dinner/Snacks) with a header showing the meal + its calorie
// subtotal, and the logged foods as rows (name + macros left, calories right,
// hairline separators, rounded inset group). Tapping a row opens the shared edit
// sheet; the section's + adds to that meal. A search bar pins above the list;
// the solid black + FAB floats clear of the tab bar.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, SectionList, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/primitives/Icon';
import { AnomalyBanner } from '@/components/ai';

import { Text } from '@/components/primitives/Text';
import { Pressable } from '@/components/primitives/Pressable';
import { EmptyState } from '@/components/display/EmptyState';
import { ErrorState } from '@/components/display/ErrorState';
import { Skeleton, SkeletonList } from '@/components/display/LoadingSkeleton';
import { SwipeableRow } from '@/components/display/SwipeableRow';
import { TextField } from '@/components/forms/TextField';
import { GlassFab } from '@/components/navigation/GlassButtons';
import { FoodItemEditSheet, type EditableItem } from '@/components/domain/FoodItemEditSheet';
import { ScanReviewCard, type ReviewItem } from '@/components/food/scan/ScanReviewCard';
import { ScanFailedCard } from '@/components/food/scan/ScanFailedCard';
import { ScanFeedbackPrompt } from '@/components/food/scan/ScanFeedbackPrompt';
import { showToast } from '@/components/display/toastStore';
import { accent, color, radius, space, surface, zIndex } from '@/lib/design/tokens';
import { useLargeText } from '@/lib/design/dynamicType';
import { haptics } from '@/lib/haptics';
import { formatCalories } from '@/lib/formatting';
import { useUnitPreferences } from '@/lib/settings/store';
import { formatEnergy } from '@/lib/units';
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
import { useOnboardingStore } from '@/lib/stores/onboarding';
import type { DietaryRequirement, ScanFeedbackRating, ScanItemStatus } from '@/lib/types';
import type { FoodResult, MealSlot } from '@/lib/mock/data';

const SLOTS: MealSlot[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

type FoodRow = EditableItem & {
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

// FAB geometry — kept here so the list padding stays in lock-step with where the
// button floats (otherwise rows scroll under it).
const FAB_SIZE = 56;

export default function FoodLogScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const energyUnit = useUnitPreferences().energy;
  // The add FAB floats bottom-right, a comfortable gap above the glass tab bar.
  const fabBottom = insets.bottom + space['5xl'] + space.sm; // ~72pt over the home indicator
  // Pad the list past the FAB's full height so no row/footer ever sits under it
  // (that overlap is what made the section "+" peek out behind the button).
  const fabClearance = fabBottom + FAB_SIZE + space.lg;
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<FoodRow | null>(null);

  // Data seam — reactive meals + first-load slot. Edits go through the mutations.
  const { data: meals, isLoading: loading, error, refetch } = useFoodLog();
  const loadError = !!error;
  const sections = useMemo(() => buildSections(meals), [meals]);

  const total = sections.reduce((sum, s) => sum + s.subtotal, 0);
  const itemCount = sections.reduce((n, s) => n + s.data.length, 0);

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
    if (loadError || loading || itemCount === 0) return [];
    return sections.map((s) => ({ kind: 'meal', ...s }));
  }, [searching, results, loadError, loading, itemCount, sections]);

  const onRefresh = useCallback(() => {
    haptics.impactLight(); // pull-to-refresh trigger
    setRefreshing(true);
    refetch();
    // refetch() is fire-and-forget (returns void) — keep a short visible spin.
    setTimeout(() => setRefreshing(false), 700);
  }, [refetch]);

  const applyEdit = (next: EditableItem) => {
    editFoodItem(next.id, next);
    setEditing(null);
  };
  const removeRow = (id: string) => {
    deleteFoodItem(id);
    setEditing(null);
  };

  // Picking a search result opens the serving-size picker before adding.
  const pick = (food: FoodResult) =>
    router.push({ pathname: '/food/serving', params: { name: food.name, kcalPer100: String(food.kcalPer100) } });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }} edges={['top']}>
      <SectionList<ListRow, ListSection>
        sections={listSections}
        keyExtractor={(item, index) => ('id' in item ? item.id : `${item.name}-${index}`)}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingHorizontal: space.xl,
          paddingBottom: fabClearance,
          flexGrow: 1,
        }}
        refreshControl={
          searching ? undefined : (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.black} />
          )
        }
        // The Today title + total + search bar live INSIDE the list so they
        // scroll away with the content instead of staying pinned. Keeping it as a
        // constant header on one always-mounted SectionList means the search field
        // never remounts (no focus loss) when results appear.
        ListHeaderComponent={
          <View style={{ paddingTop: space.lg, paddingBottom: space.lg, gap: space.lg }}>
            {/* Amber anomaly banner — self-contained, renders null when there are none. */}
            <AnomalyBanner onPress={() => router.push('/insights' as Href)} />
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text variant="title1" color={color.label} accessibilityRole="header">
                {t('foodLog.today')}
              </Text>
              <Text variant="callout" color={color.secondaryLabel}>
                {formatEnergy(total, energyUnit)}
              </Text>
            </View>
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
                onRenameItem={(id, name) => editFoodItem(id, { name })}
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
                onPress={() => setEditing(row)}
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
                backgroundColor: surface.card,
                borderRadius: radius.lg,
                paddingHorizontal: space.lg,
                minHeight: 56,
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.sm,
                marginBottom: space.xl,
              }}
            >
              <Icon name="add-circle-outline" size={20} color={color.secondaryLabel} />
              <Text variant="body" color={color.secondaryLabel}>
                {t('foodLog.addToMeal', { slot: section.slot })}
              </Text>
            </Pressable>
          ) : (
            <View style={{ height: space.xl }} />
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
              <Icon name="create-outline" size={18} color={color.black} />
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
              <Icon name="time-outline" size={16} color={color.black} />
              <Text variant="bodyBold" color={color.label}>
                {t('foodLog.mealHistory')}
              </Text>
            </Pressable>
          ) : null
        }
      />

      {/* Primary add FAB — solid black circle with a white + icon, sitting just
          above the tab bar (clear of it + the home indicator); opens the add menu. */}
      <GlassFab
        variant="solid"
        accessibilityLabel={t('foodLog.addMeal')}
        accessibilityHint="Opens the add menu: scan a meal, barcode, nutrition label, saved foods, my meals or quick add"
        onPress={() => router.push('/food/add')}
        style={{ position: 'absolute', right: space.xl, bottom: fabBottom, zIndex: zIndex.fab }}
      />

      <FoodItemEditSheet item={editing} onClose={() => setEditing(null)} onSave={applyEdit} onDelete={removeRow} />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------

function MealSectionHeader({
  slot,
  subtotal,
  energyUnit,
  onAdd,
}: {
  slot: MealSlot;
  subtotal: number;
  energyUnit: ReturnType<typeof useUnitPreferences>['energy'];
  onAdd: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: space.lg,
        paddingBottom: space.sm,
      }}
    >
      <Text
        variant="title3"
        color={color.label}
        accessibilityRole="header"
        accessibilityLabel={`${slot}, ${formatEnergy(subtotal, energyUnit)}`}
      >
        {slot}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Text variant="footnote" color={color.secondaryLabel} accessibilityElementsHidden importantForAccessibility="no">
          {formatEnergy(subtotal, energyUnit)}
        </Text>
        <Pressable haptic={false} onPress={onAdd} accessibilityRole="button" accessibilityLabel={`Add to ${slot}`}>
          <Icon name="add-circle" size={24} color={color.black} />
        </Pressable>
      </View>
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
        backgroundColor: surface.card,
        flexDirection: large ? 'column' : 'row',
        alignItems: large ? 'flex-start' : 'center',
        gap: large ? space.xs : space.md,
        paddingHorizontal: space.lg,
        paddingVertical: large ? space.md : 0,
        minHeight: 60,
        borderTopLeftRadius: first ? radius.lg : 0,
        borderTopRightRadius: first ? radius.lg : 0,
        borderBottomLeftRadius: last ? radius.lg : 0,
        borderBottomRightRadius: last ? radius.lg : 0,
      }}
    >
      {/* hairline separator between rows (inset under the text) */}
      {!first ? (
        <View style={{ position: 'absolute', left: space.lg, right: 0, top: 0, height: 1, backgroundColor: color.gray200 }} />
      ) : null}
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
          <Text variant="bodyMedium" color={color.label}>
            {formatEnergy(item.calories, energyUnit)}
          </Text>
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
        backgroundColor: surface.card,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingHorizontal: space.lg,
        minHeight: 60,
        borderTopLeftRadius: first ? radius.lg : 0,
        borderTopRightRadius: first ? radius.lg : 0,
        borderBottomLeftRadius: last ? radius.lg : 0,
        borderBottomRightRadius: last ? radius.lg : 0,
      }}
    >
      {!first ? (
        <View style={{ position: 'absolute', left: space.lg, right: 0, top: 0, height: 1, backgroundColor: color.gray200 }} />
      ) : null}
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
      <Icon name="add-circle-outline" size={22} color={color.black} />
    </Pressable>
  );
}
