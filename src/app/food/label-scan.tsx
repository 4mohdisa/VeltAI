// C3 · Nutrition-label scan — full-screen capture → OCR read → editable review.
// Capture a nutrition-facts panel, POST it to /api/scan/label (per-100g OCR),
// present it PER SERVING for edit, then save to the food log. Fully graceful:
// no camera, no API key, or offline → an empty / zeroed review the user hand-
// fills. Never crashes.
import { useRef, useState } from 'react';
import { Linking, ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import { track } from '@/lib/analytics';
import { ensureAiConsent } from '@/lib/ai/consent';

import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { Button } from '@/components/forms/Button';
import { TextField } from '@/components/forms/TextField';
import { SegmentedField } from '@/components/forms/SegmentedField';
import { Stepper } from '@/components/forms/Stepper';
import { Badge } from '@/components/display/Badge';
import { Screen } from '@/components/navigation/Screen';
import { CaptureGuidanceOverlay } from '@/components/food/CaptureGuidanceOverlay';
import { showToast } from '@/components/display/toastStore';
import { color, radius, space, surface } from '@/lib/design/tokens';
import { STORAGE_KEYS } from '@/lib/storage/secureStore';
import { slotForNow } from '@/lib/data';
import { api, isTransient, type ScanLabelResult } from '@/lib/api';
import { runOrQueue } from '@/lib/offline/queue';
import { selectedFoodDate, useFoodStore } from '@/lib/data/foodStore';
import { handleUpgradeRequired, isUpgradeRequired } from '@/lib/billing/upgradePrompt';
import { mealSlotName } from '@/lib/mealSlotName';
import { servingToCanonical } from '@/lib/units';
import type { MealSlot } from '@/lib/mock/data';

type Phase = 'capture' | 'reading' | 'review';
type Band = 'High' | 'Medium' | 'Low';

const SLOTS: MealSlot[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

const round1 = (n: number): number => Math.round(n * 10) / 10;
const num = (s: string): number => {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};
// Task thresholds: >=80 High, >=50 Medium, else Low.
const bandFor = (confidence: number): Band => (confidence >= 80 ? 'High' : confidence >= 50 ? 'Medium' : 'Low');
const BAND_KEY: Record<Band, string> = {
  High: 'labelScan.confidenceHigh',
  Medium: 'labelScan.confidenceMedium',
  Low: 'labelScan.confidenceLow',
};

export default function LabelScanScreen() {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [phase, setPhase] = useState<Phase>('capture');

  // Per-serving editable fields (strings so the inputs stay controlled).
  const [foodName, setFoodName] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [servingUnit, setServingUnit] = useState('g');
  const [calories, setCalories] = useState('0');
  const [protein, setProtein] = useState('0');
  const [carbs, setCarbs] = useState('0');
  const [fat, setFat] = useState('0');
  const [fibre, setFibre] = useState('0');
  const [servings, setServings] = useState(1);
  const [band, setBand] = useState<Band>('Low');
  const [mealType, setMealType] = useState<MealSlot>(slotForNow());
  const [submitting, setSubmitting] = useState(false);

  // Convert the API's per-100g values back to PER SERVING (serving_size_g<=0 → 100).
  const prefillFrom = (r: ScanLabelResult) => {
    const size = r.serving_size_g > 0 ? r.serving_size_g : 100;
    const per = (v: number) => round1((v * size) / 100);
    setFoodName(r.food_name);
    setServingSize(String(round1(size)));
    setServingUnit('g');
    setCalories(String(Math.round(per(r.calories_per_100g))));
    setProtein(String(per(r.protein_per_100g)));
    setCarbs(String(per(r.carbs_per_100g)));
    setFat(String(per(r.fat_per_100g)));
    setFibre(String(per(r.fibre_per_100g)));
    setBand(bandFor(r.confidence));
  };

  const capture = async () => {
    // 5.1.2(i): label photos go to Google Gemini — one-time disclosure first.
    if (!(await ensureAiConsent())) return;
    setPhase('reading');
    track('scan_started', { entry: 'label' });
    let base64: string | undefined;
    try {
      const pic = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.6 });
      base64 = pic?.base64;
    } catch {
      base64 = undefined;
    }
    if (!base64) {
      // No native camera in dev / capture failed → empty review, hand-enter.
      showToast({ message: t('labelScan.cameraUnavailable'), tone: 'warn' });
      track('scan_failed', { entry: 'label', reason: 'camera_unavailable' });
      setBand('Low');
      setPhase('review');
      return;
    }
    try {
      prefillFrom(await api.scan.label(base64));
      track('scan_completed', { entry: 'label' });
    } catch (e) {
      // 402 = out of free scans: surface the paywall, not a generic failure
      // dressed up as a reading problem (audit 2026-08-06).
      if (isUpgradeRequired(e)) {
        track('scan_failed', { entry: 'label', reason: 'quota_exceeded' });
        handleUpgradeRequired(e);
        router.back();
        return;
      }
      // 503 (no GEMINI key) / offline / network → zeroed review to hand-enter.
      showToast({ message: t('labelScan.readFailed'), tone: 'warn' });
      track('scan_failed', { entry: 'label', reason: 'read_failed' });
      setBand('Low');
    }
    setPhase('review');
  };

  const save = async () => {
    setSubmitting(true);
    const qty = servings;
    const size = num(servingSize) || 100;
    const cal = num(calories);
    const p = num(protein);
    const c = num(carbs);
    const f = num(fat);
    const fb = num(fibre);
    // A typed "1 cup" or "2 tbsp" is stored in ml at Australian sizes, not as
    // 1 g; grams stay grams.
    const serving = servingToCanonical(qty * size, servingUnit);
    const body = {
      date: selectedFoodDate(),
      meal_type: mealType,
      food_name: foodName.trim() || t('labelScan.defaultName'),
      quantity: serving.quantity,
      unit: serving.unit,
      calories: cal * qty,
      protein: p * qty,
      carbs: c * qty,
      fat: f * qty,
      fibre: fb * qty,
      source: 'label_scan',
    };
    let toast = t('labelScan.saved');
    try {
      await api.foodLogs.create(body);
    } catch (e) {
      if (!isTransient(e)) {
        // Stay on the review screen. This used to navigate away regardless, so a
        // failed save discarded every per-serving macro the user had just typed
        // in by hand, with no retry — the error toast was the only trace.
        showToast({ message: t('labelScan.saveFailed'), tone: 'error' });
        setSubmitting(false);
        return;
      }
      // Offline / server down: queue the create (idempotency-keyed replay) so
      // the hand-typed macros survive — pre-audit this path could only retry
      // forever or abandon the data (audit 2026-08-06).
      await runOrQueue('/api/food/logs', body);
      toast = t('labelScan.savedOffline');
    }
    // Reflect locally so the food log shows it immediately either way.
    useFoodStore.getState().logMeal(mealType, {
      name: body.food_name,
      quantityG: body.quantity,
      calories: body.calories,
      protein: body.protein,
      carbs: body.carbs,
      fat: body.fat,
    }, 'manual');
    showToast({ message: toast, tone: 'success' });
    router.replace('/(tabs)/food');
  };

  // --- Initial permission load ---
  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: color.black }} />;
  }

  // --- Reading ---
  if (phase === 'reading') {
    return (
      <View style={{ flex: 1, backgroundColor: color.black, alignItems: 'center', justifyContent: 'center', gap: space.lg }}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={color.white} />
        <Text variant="callout" color={color.white}>
          {t('labelScan.reading')}
        </Text>
      </View>
    );
  }

  // --- Review (editable, per serving) ---
  if (phase === 'review') {
    const totalCal = Math.round(num(calories) * servings);
    return (
      <Screen
        title={t('labelScan.reviewTitle')}
        showBack
        backLabel={t('common.cancel')}
        footer={<Button title={t('labelScan.saveButton')} onPress={() => void save()} loading={submitting} />}
      >
        <Badge label={t(BAND_KEY[band])} icon={band === 'High' ? 'checkmark-circle' : 'information-circle'} />

        <TextField
          label={t('labelScan.foodName')}
          value={foodName}
          onChangeText={setFoodName}
          placeholder={t('labelScan.foodName')}
        />

        <View style={{ flexDirection: 'row', gap: space.md }}>
          <View style={{ flex: 2 }}>
            <TextField label={t('food.servingSize')} value={servingSize} onChangeText={setServingSize} keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <TextField label={t('exercisePicker.unit')} value={servingUnit} onChangeText={setServingUnit} autoCapitalize="none" />
          </View>
        </View>

        <TextField label={t('labelScan.caloriesPerServing')} value={calories} onChangeText={setCalories} keyboardType="decimal-pad" />
        <TextField label={t('labelScan.protein')} value={protein} onChangeText={setProtein} keyboardType="decimal-pad" />
        <TextField label={t('labelScan.carbs')} value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" />
        <TextField label={t('labelScan.fat')} value={fat} onChangeText={setFat} keyboardType="decimal-pad" />
        <TextField label={t('labelScan.fibre')} value={fibre} onChangeText={setFibre} keyboardType="decimal-pad" />

        <Stepper
          label={t('recipesList.servingsLabel')}
          value={servings}
          onChange={setServings}
          min={0.5}
          max={20}
          step={0.5}
          formatValue={(v) => v.toFixed(1)}
        />

        <SegmentedField<MealSlot>
          label={t('food.quickAddMeal')}
          value={mealType}
          onChange={setMealType}
          options={SLOTS.map((s) => ({ label: mealSlotName(t, s), value: s }))}
        />

        {/* Live total — recomputed every render from the editable fields. */}
        <View style={{ backgroundColor: surface.card, borderRadius: radius.lg, padding: space.xl, gap: space.xs }}>
          <Text variant="footnote" color={color.gray600}>
            {t('labelScan.total', { servings: servings.toFixed(1) })}
          </Text>
          <Text variant="title3" color={color.black}>
            {t('labelScan.totalKcal', { kcal: totalCal })}
          </Text>
          <Text variant="footnote" color={color.gray600}>
            {t('labelScan.totalMacros', {
              protein: Math.round(num(protein) * servings),
              carbs: Math.round(num(carbs) * servings),
              fat: Math.round(num(fat) * servings),
            })}
          </Text>
        </View>
      </Screen>
    );
  }

  // --- Capture: permission gate (mirrors photo-capture) ---
  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
        <View style={{ flex: 1, padding: space.lg, alignItems: 'center', justifyContent: 'center', gap: space.md }}>
          <Icon name="camera-outline" size={44} color={color.gray400} />
          <Text variant="title3" color={color.black} style={{ textAlign: 'center' }}>
            {t('camera.accessTitle')}
          </Text>
          <Text variant="callout" color={color.gray500} style={{ textAlign: 'center' }}>
            {t('labelScan.permissionMessage')}
          </Text>
          {permission.canAskAgain ? (
            <Button title={t('camera.allow')} onPress={requestPermission} fullWidth={false} />
          ) : (
            // Permanently denied: iOS silently no-ops requestPermission() after
            // the second denial, so this button did nothing at all and left the
            // user tapping it. Send them to Settings instead.
            <Button title={t('camera.openSettings')} onPress={() => void Linking.openSettings()} fullWidth={false} />
          )}
          <Button title={t('camera.notNow')} variant="tertiary" fullWidth={false} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  // --- Capture: viewfinder ---
  return (
    <View style={{ flex: 1, backgroundColor: color.black }}>
      <StatusBar style="light" />
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      <CaptureGuidanceOverlay
        shape="rectangle"
        promptKey={STORAGE_KEYS.labelPromptDismissed}
        promptText={t('labelScan.prompt')}
        topOffset={92}
      />

      {/* Header: close (left) + title/subheader, above the overlay chrome. */}
      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }} edges={['top']}>
        <View style={{ paddingHorizontal: space.md, paddingTop: space.sm }}>
          <Pressable onPress={() => router.back()} haptic={false} accessibilityLabel={t('common.close')}>
            <Icon name="close" size={30} color={color.white} />
          </Pressable>
        </View>
        <View style={{ alignItems: 'center', paddingHorizontal: space.xl, gap: space.xs, marginTop: space.xs }}>
          <Text variant="title3" color={color.white}>
            {t('labelScan.title')}
          </Text>
          <Text variant="footnote" color={color.white} style={{ textAlign: 'center' }}>
            {t('labelScan.subtitle')}
          </Text>
        </View>
      </SafeAreaView>

      <SafeAreaView style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} edges={['bottom']}>
        <View style={{ alignItems: 'center', gap: space.md, paddingBottom: space.xl }}>
          <Text variant="footnote" color={color.white}>
            {t('labelScan.tapToCapture')}
          </Text>
          <Pressable
            onPress={() => void capture()}
            accessibilityLabel={t('labelScan.captureLabel')}
            minTapTarget={false}
            style={{
              width: 72,
              height: 72,
              borderRadius: radius.full,
              backgroundColor: color.white,
              borderWidth: 4,
              borderColor: color.gray300,
            }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
