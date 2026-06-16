// C7 · Barcode scan
// Camera in barcode-detect mode (no shutter). A reticle frames the code; on
// detect we move to the product confirm. A "Simulate" button stands in where no
// physical barcode is available.
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

export default function BarcodeScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const handled = useRef(false);

  const onDetected = () => {
    if (handled.current) return;
    handled.current = true;
    router.replace('/food/barcode-confirm');
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
            Camera access needed
          </Text>
          <Text variant="callout" color={color.gray500} style={{ textAlign: 'center' }}>
            Veltai uses the camera to scan barcodes on packaged foods.
          </Text>
          <Button title="Allow camera" onPress={requestPermission} fullWidth={false} />
          <Button title="Not now" variant="tertiary" fullWidth={false} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.black }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
        onBarcodeScanned={onDetected}
      />

      {/* reticle + controls overlay */}
      <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
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
        <View style={{ padding: space.sm }}>
          <Pressable onPress={() => router.back()} haptic={false} accessibilityLabel="Close scanner">
            <Icon name="close" size={30} color={color.white} />
          </Pressable>
        </View>
      </SafeAreaView>

      <SafeAreaView style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} edges={['bottom']}>
        <View style={{ alignItems: 'center', gap: space.sm, paddingBottom: space.lg }}>
          <Text variant="footnote" color={color.white}>
            Point at a barcode — it scans automatically
          </Text>
          <Button title="Simulate scan" variant="secondary" fullWidth={false} onPress={onDetected} />
        </View>
      </SafeAreaView>
    </View>
  );
}
