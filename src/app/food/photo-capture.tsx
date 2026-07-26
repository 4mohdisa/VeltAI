// C3 · Photo capture — multi-angle (Phase 13 D4).
// Shot 1 is top-down. After it, offer "Add a side angle?" [Add] [Use this].
// Shot 2 guidance: tilt ~45°. Optional shot 3. Thumbnails allow removing a shot
// to retake it. Any single shot still works end-to-end — extra angles are purely
// additive. Capture failure (no camera in the dev binary) falls back to the
// mock single-shot flow so the screen never dead-ends.
import { useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Icon } from '@/components/primitives/Icon';

import { Button } from '@/components/forms/Button';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { CaptureGuidanceOverlay } from '@/components/food/CaptureGuidanceOverlay';
import { showToast } from '@/components/display/toastStore';
import { startMultiPhotoScan, startPhotoScan } from '@/lib/data';
import { color, radius, space } from '@/lib/design/tokens';

type Angle = 'top' | 'side' | 'oblique';
type Shot = { base64: string; angle: Angle; uri?: string };

const ANGLE_ORDER: Angle[] = ['top', 'side', 'oblique'];
const GUIDANCE: Record<Angle, string> = {
  top: 'Hold the camera directly above the plate',
  side: 'Tilt to about 45°',
  oblique: 'One more from another side (optional)',
};

export default function PhotoCaptureScreen() {
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
      message: finalShots.length > 1 ? `Scanning ${finalShots.length} angles…` : 'Scanning your meal…',
      tone: 'info',
    });
  };

  const capture = async () => {
    if (capturing || done) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.6 });
      if (photo?.base64) {
        setShots((prev) => [...prev, { base64: photo.base64 as string, angle: nextAngle, uri: photo.uri }]);
      } else {
        throw new Error('no frame');
      }
    } catch {
      // No camera in this binary → mock single-shot flow (offline experience).
      startPhotoScan();
      router.replace('/(tabs)/food');
      showToast({ message: 'Scanning your meal…', tone: 'info' });
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
            Camera access needed
          </Text>
          <Text variant="callout" color={color.gray500} style={{ textAlign: 'center' }}>
            Lumo uses the camera to scan your meals for accurate calorie tracking.
          </Text>
          <Button title="Allow camera" onPress={requestPermission} fullWidth={false} />
          <Button title="Not now" variant="tertiary" fullWidth={false} onPress={() => router.back()} />
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
          <Pressable onPress={() => router.back()} haptic={false} accessibilityLabel="Close camera">
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
                  <Text variant="caption" color={color.white} style={{ position: 'absolute', bottom: 2, left: 4 }}>
                    {s.angle}
                  </Text>
                  <Pressable
                    onPress={() => removeShot(i)}
                    haptic={false}
                    minTapTarget={false}
                    accessibilityLabel={`Remove ${s.angle} shot`}
                    style={{ position: 'absolute', top: -6, right: -6, backgroundColor: color.black, borderRadius: radius.full }}
                  >
                    <Icon name="close-circle" size={18} color={color.white} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          <Text variant="footnote" color={color.white}>
            {shots.length === 0 ? GUIDANCE.top : done ? 'Three angles captured' : GUIDANCE[nextAngle]}
          </Text>

          {shots.length === 0 ? (
            <Pressable
              onPress={() => void capture()}
              accessibilityLabel="Capture photo"
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
                    title={shots.length === 1 ? 'Add a side angle' : 'Add another angle'}
                    variant="secondary"
                    loading={capturing}
                    onPress={() => void capture()}
                  />
                </View>
              ) : null}
              <View style={{ flex: 1 }}>
                <Button
                  title={shots.length > 1 ? `Use ${shots.length} shots` : 'Use this photo'}
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
