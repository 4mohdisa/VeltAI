// C7 · Barcode scan
// Camera in barcode-detect mode (no shutter). A reticle frames the code; on
// detect we move to the product confirm. A "Simulate" button stands in where no
// physical barcode is available.
import { useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/primitives/Icon';

import { ErrorState } from '@/components/display/ErrorState';
import { Button } from '@/components/forms/Button';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';
import { haptics } from '@/lib/haptics';
import { isDevBuild } from '@/lib/env';
import { lookupBarcodeResult, slotFromParam, type BarcodeLookup } from '@/lib/data';
import { openFoodDetail } from '@/lib/food/detailSubject';

// A barcode in our mock database (resolves) vs one that isn't (not-found path).
const KNOWN_CODE = '9300605000000';
const UNKNOWN_CODE = '0000000000000';

export default function BarcodeScanScreen() {
  const { t } = useTranslation();
  // From a meal's "Add to dinner" the Add sheet passes ?slot; the detail sheet gets it with the code.
  const { slot } = useLocalSearchParams<{ slot?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [miss, setMiss] = useState<Exclude<BarcodeLookup['status'], 'found'> | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const handled = useRef(false);

  // Database lookup only — NO AI. Found → confirm (with the scanned code so it
  // fetches the right product); not found → label-photo fallback; failed (offline,
  // timeout, 5xx) → network error with Retry. The lookup goes through the data
  // seam: backend (Open Food Facts / USDA) first, mock DB in dev builds.
  const onDetected = async (code: string) => {
    if (handled.current) return;
    handled.current = true;
    haptics.success(); // barcode caught — feedback before the lookup round-trip
    setLookingUp(true);
    const result = await lookupBarcodeResult(code);
    setLookingUp(false);
    if (result.status === 'found') {
      // The shared food-detail sheet does its own lookup; the code and the meal
      // travel in the subject store, never as a route param.
      openFoodDetail({ mode: 'barcode', code, slot: slotFromParam(slot) });
      router.replace('/food/detail');
    } else {
      setMiss(result.status);
    }
  };

  const retry = () => {
    handled.current = false;
    setMiss(null);
  };

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: color.black }} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
        <View style={{ flex: 1, padding: space.lg, alignItems: 'center', justifyContent: 'center', gap: space.md }}>
          <Icon name="barcode-outline" size={44} color={color.gray400} />
          <Text variant="title3" color={color.black} style={{ textAlign: 'center' }}>
            {t('camera.accessTitle')}
          </Text>
          <Text variant="callout" color={color.gray500} style={{ textAlign: 'center' }}>
            {t('barcodeScan.permissionMessage')}
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

  return (
    // Full-bleed black backdrop so the scanner covers edge-to-edge (incl. under
    // the status bar and home indicator) — no content bleeds through the top.
    <View style={{ flex: 1, backgroundColor: color.black }}>
      <StatusBar style="light" />
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
        onBarcodeScanned={(r) => onDetected(r.data)}
      />

      {/* reticle — centred over the full screen */}
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <View
          style={{
            width: 240,
            height: 150,
            borderWidth: 3,
            borderColor: color.white,
            borderRadius: radius.lg,
          }}
        />
      </View>

      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }} edges={['top']}>
        <View style={{ paddingHorizontal: space.md, paddingTop: space.sm }}>
          <Pressable onPress={() => router.back()} haptic={false} accessibilityLabel={t('barcodeScan.close')}>
            <Icon name="close" size={30} color={color.white} />
          </Pressable>
        </View>
      </SafeAreaView>

      <SafeAreaView style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} edges={['bottom']}>
        <View style={{ alignItems: 'center', gap: space.md, paddingBottom: space.xl }}>
          <Text variant="footnote" color={color.white}>
            {t('barcodeScan.hint')}
          </Text>
          {isDevBuild() ? (
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button title="Simulate scan" variant="secondary" fullWidth={false} onPress={() => onDetected(KNOWN_CODE)} />
              <Button title="Unknown code" variant="tertiary" fullWidth={false} onPress={() => onDetected(UNKNOWN_CODE)} />
            </View>
          ) : null}
        </View>
      </SafeAreaView>

      {/* Lookup in flight — brief overlay so the detect isn't a silent freeze. */}
      {lookingUp ? (
        <View
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: color.overlayStrong,
            alignItems: 'center',
            justifyContent: 'center',
            padding: space.xl,
            gap: space.md,
          }}
        >
          <Icon name="barcode-outline" size={44} color={color.white} />
          <Text variant="title3" color={color.white} style={{ textAlign: 'center' }}>
            {t('barcodeScan.lookingUp')}
          </Text>
        </View>
      ) : null}

      {/* Not-found → no AI lookup matched; fall back to photographing the label. */}
      {miss === 'notFound' ? (
        <View
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: color.overlayStrong,
            alignItems: 'center',
            justifyContent: 'center',
            padding: space.xl,
            gap: space.md,
          }}
        >
          <Icon name="help-circle-outline" size={44} color={color.white} />
          <Text variant="title3" color={color.white} style={{ textAlign: 'center' }}>
            {t('food.productNotFound')}
          </Text>
          <Text variant="callout" color={color.gray300} style={{ textAlign: 'center' }}>
            {t('barcodeScan.notFoundMessage')}
          </Text>
          {/* The label SCANNER, not the meal-photo pipeline — this used to
              route to photo-capture, which runs Gemini food identification on
              a nutrition label (audit 2026-08-06). */}
          <Button title={t('barcodeScan.photographLabel')} fullWidth={false} onPress={() => router.replace('/food/label-scan')} />
          <Button title={t('barcodeScan.tryAnother')} variant="tertiary" fullWidth={false} onPress={retry} />
        </View>
      ) : null}

      {/* Lookup failed (offline, timeout, 5xx): a network problem, not a miss. */}
      {miss === 'failed' ? (
        <View style={{ position: 'absolute', inset: 0, backgroundColor: color.white, justifyContent: 'center' }}>
          <ErrorState
            title={t('barcodeScan.lookupFailedTitle')}
            message={`${t('barcodeScan.lookupFailedReason')} ${t('barcodeScan.lookupFailedHint')}`}
            onRetry={retry}
          />
        </View>
      ) : null}
    </View>
  );
}
