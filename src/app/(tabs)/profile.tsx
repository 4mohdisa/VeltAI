// E1 · Profile
// TODO: Avatar, rank + progress bar, XP, streak, recent XP, settings list
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          E1 · Profile
        </Text>
      </View>
    </SafeAreaView>
  );
}
