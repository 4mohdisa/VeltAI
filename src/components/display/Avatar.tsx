// Avatar — circular profile image, or initials on a neutral fill when there is
// no photo. Sizes are fixed pixel diameters (not spacing tokens) by design.
import { View } from 'react-native';
import { Image } from 'expo-image';

import { Text } from '@/components/primitives/Text';
import { color, radius } from '@/lib/design/tokens';

export type AvatarProps = {
  name?: string;
  uri?: string;
  size?: number;
  testID?: string;
};

function initials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

export function Avatar({ name, uri, size = 64, testID }: AvatarProps) {
  const dimension = { width: size, height: size, borderRadius: radius.full };

  if (uri) {
    return (
      <Image
        testID={testID}
        source={{ uri }}
        style={dimension}
        contentFit="cover"
        accessibilityLabel={name ? `${name} avatar` : 'Avatar'}
      />
    );
  }

  return (
    <View
      testID={testID}
      accessibilityLabel={name ? `${name} avatar` : 'Avatar'}
      style={[
        dimension,
        {
          backgroundColor: color.gray100,
          borderWidth: 1,
          borderColor: color.gray200,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      <Text variant="title3" color={color.gray700}>
        {initials(name)}
      </Text>
    </View>
  );
}
