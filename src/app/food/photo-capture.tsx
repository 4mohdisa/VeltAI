// C3 · Photo capture — multi-angle (Phase 13 D4).
// Shot 1 is top-down. After it, offer "Add a side angle?" [Add] [Use this].
// Shot 2 guidance: tilt ~45°. Optional shot 3. Thumbnails allow removing a shot
// to retake it. Any single shot still works end-to-end — extra angles are purely
// additive. Capture failure (no camera in the dev binary) falls back to the
// mock single-shot flow so the screen never dead-ends.
import { useRef, useState } from 'react';
import { Image, Linking, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ensureAiConsent } from '@/lib/ai/consent';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/primitives/Icon';

import { Button } from '@/components/forms/Button';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { CaptureGuidanceOverlay } from '@/components/food/CaptureGuidanceOverlay';
import { showToast } from '@/components/display/toastStore';
import { startMultiPhotoScan, startPhotoScan } from '@/lib/data';
import { color, radius, space } from '@/lib/design/tokens';
import { isDevBuild } from '@/lib/env';

type Angle = 'top' | 'side' | 'oblique';
type Shot = { base64: string; angle: Angle; uri?: string };

const ANGLE_ORDER: Angle[] = ['top', 'side', 'oblique'];
// i18n keys per angle: the capture prompt and the thumbnail caption.
const GUIDANCE_KEY: Record<Angle, string> = {
  top: 'photoCapture.guidanceTop',
  side: 'photoCapture.guidanceSide',
  oblique: 'photoCapture.guidanceOblique',
};
const ANGLE_KEY: Record<Angle, string> = {
  top: 'photoCapture.angleTop',
  side: 'photoCapture.angleSide',
  oblique: 'photoCapture.angleOblique',
};

export default function PhotoCaptureScreen() {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [capturing, setCapturing] = useState(false);

  const nextAngle: Angle = ANGLE_ORDER[Math.min(shots.length, 2)];
  const done = shots.length >= 3;

  const finish = (finalShots: Shot[]) => {
    if (finalShots.length === 0) return;
    startMultiPhotoScan(finalShots.map((s) => ({ image_base64: s.base64, mime_type: 'image/jpeg', angle: s.angle })));
    router.replace('/(tabs)/food');
    showToast({
      message:
        finalShots.length > 1
          ? t('photoCapture.scanningAngles', { shots: finalShots.length })
          : t('photoCapture.scanningMeal'),
      tone: 'info',
    });
  };

  const capture = async () => {
    if (capturing || done) return;
    // 5.1.2(i): photos go to Google Gemini — one-time disclosure before the
    // first capture; nothing is taken or uploaded without it.
    if (!(await ensureAiConsent())) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.6 });
      if (photo?.base64) {
        setShots((prev) => [...prev, { base64: photo.base64 as string, angle: nextAngle, uri: photo.uri }]);
      } else {
        throw new Error('no frame');
      }
    } catch {
      // A capture failure must never look like a successful scan. This used to
      // call startPhotoScan() with no image and toast 'Scanning your meal…',
      // which logged three invented foods into the user's day. Dev keeps that
      // path so the flow is reviewable without a camera; a real build reports
      // the failure and stays put so the user can retry.
      if (isDevBuild()) {
        startPhotoScan();
        router.replace('/(tabs)/food');
        showToast({ message: t('photoCapture.scanningMeal'), tone: 'info' });
      } else {
        showToast({ message: t('photoCapture.captureFailed'), tone: 'error' });
      }
    } finally {
      setCapturing(false);
    }
  };

  const removeShot = (index: number) => setShots((prev) => prev.filter((_, i) => i !== index));

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: color.black }} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
        <View style={{ flex: 1, padding: space.lg, alignItems: 'center', justifyContent: 'center', gap: space.md }}>
          <Icon name="camera-outline" size={44} color={color.gray400} />
          <Text variant="title3" color={color.black} style={{ textAlign: 'center' }}>
            {t('camera.accessTitle')}
          </Text>
          <Text variant="callout" color={color.gray500} style={{ textAlign: 'center' }}>
            {t('photoCapture.permissionMessage')}
          </Text>
          {permission.canAskAgain ? (
            <Button title={t('camera.allow')} onPress={requestPermission} fullWidth={false} />
          ) : (
            // Permanently denied — the system prompt can't re-appear; send the
            // user to Settings instead of a silent no-op.
            <Button title={t('camera.openSettings')} onPress={() => void Linking.openSettings()} fullWidth={false} />
          )}
          <Button title={t('camera.notNow')} variant="tertiary" fullWidth={false} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.black }}>
      <StatusBar style="light" />
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      <CaptureGuidanceOverlay />
      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }} edges={['top']}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', paddingHorizontal: space.md, paddingTop: space.sm }}>
          <Pressable onPress={() => router.back()} haptic={false} accessibilityLabel={t('photoCapture.close')}>
            <Icon name="close" size={30} color={color.white} />
          </Pressable>
        </View>
      </SafeAreaView>

      <SafeAreaView style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} edges={['bottom']}>
        <View style={{ alignItems: 'center', gap: space.md, paddingBottom: space.xl }}>
          {/* Captured thumbnails — tap ✕ to remove and retake that angle. */}
          {shots.length > 0 ? (
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              {shots.map((s, i) => (
                <View key={`${s.angle}-${i}`} style={{ position: 'relative' }}>
                  {s.uri ? (
                    <Image source={{ uri: s.uri }} style={{ width: 48, height: 48, borderRadius: radius.sm }} />
                  ) : (
                    <View style={{ width: 48, height: 48, borderRadius: radius.sm, backgroundColor: color.gray700 }} />
                  )}
                  <Text
                    variant="caption"
                    color={color.white}
                    style={{
                      position: 'absolute',
                      bottom: 2,
                      left: 2,
                      backgroundColor: color.overlayStrong,
                      borderRadius: radius.sm,
                      paddingHorizontal: space.xs,
                    }}
                  >
                    {t(ANGLE_KEY[s.angle])}
                  </Text>
                  <Pressable
                    onPress={() => removeShot(i)}
                    haptic={false}
                    minTapTarget={false}
                    hitSlop={13}
                    accessibilityLabel={t('photoCapture.removeShot', { angle: t(ANGLE_KEY[s.angle]) })}
                    style={{ position: 'absolute', top: -6, right: -6, backgroundColor: color.black, borderRadius: radius.full }}
                  >
                    <Icon name="close-circle" size={18} color={color.white} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          <Text variant="footnote" color={color.white}>
            {shots.length === 0
              ? t(GUIDANCE_KEY.top)
              : done
                ? t('photoCapture.threeCaptured')
                : t(GUIDANCE_KEY[nextAngle])}
          </Text>

          {shots.length === 0 ? (
            <Pressable
              onPress={() => void capture()}
              accessibilityLabel={t('photoCapture.capturePhoto')}
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
          ) : (
            // After shot 1: offer another angle, or use what we have.
            <View style={{ flexDirection: 'row', gap: space.md, paddingHorizontal: space.xl }}>
              {!done ? (
                <View style={{ flex: 1 }}>
                  <Button
                    title={shots.length === 1 ? t('photoCapture.addSide') : t('photoCapture.addAnother')}
                    variant="secondary"
                    loading={capturing}
                    onPress={() => void capture()}
                    // Solid fill — the transparent secondary is unreadable over
                    // a live camera feed.
                    style={{ backgroundColor: color.white }}
                  />
                </View>
              ) : null}
              <View style={{ flex: 1 }}>
                <Button
                  title={shots.length > 1 ? t('photoCapture.useShots', { shots: shots.length }) : t('photoCapture.usePhoto')}
                  onPress={() => finish(shots)}
                />
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
