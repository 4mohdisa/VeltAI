// C3 · Photo capture
// Full-screen camera viewfinder with a capture button. After capture we offer
// an optional label photo, then move to review. Handles the permission gate.
import { useRef } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Icon } from '@/components/primitives/Icon';

import { Button } from '@/components/forms/Button';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';

export default function PhotoCaptureScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

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
            Veltai uses the camera to scan your meals for accurate calorie tracking.
          </Text>
          <Button title="Allow camera" onPress={requestPermission} fullWidth={false} />
          <Button title="Not now" variant="tertiary" fullWidth={false} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const capture = () => router.replace('/food/photo-review');

  return (
    <View style={{ flex: 1, backgroundColor: color.black }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }} edges={['top']}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', padding: space.sm }}>
          <Pressable onPress={() => router.back()} haptic={false} accessibilityLabel="Close camera">
            <Icon name="close" size={30} color={color.white} />
          </Pressable>
        </View>
      </SafeAreaView>

      <SafeAreaView style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} edges={['bottom']}>
        <View style={{ alignItems: 'center', gap: space.sm, paddingBottom: space.lg }}>
          <Text variant="footnote" color={color.white}>
            Tap to capture · you can add a label photo next
          </Text>
          <Pressable
            onPress={capture}
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
        </View>
      </SafeAreaView>
    </View>
  );
}
