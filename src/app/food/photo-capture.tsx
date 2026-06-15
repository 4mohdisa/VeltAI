// C3 · Photo capture
// TODO: Camera viewfinder, capture button, add-label prompt
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function PhotoCaptureScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          C3 · Photo capture
        </Text>
      </View>
    </SafeAreaView>
  );
}
