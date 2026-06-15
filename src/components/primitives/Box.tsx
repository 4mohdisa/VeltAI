// Box — the unstyled layout building block. A thin View pass-through so other
// components can compose without importing react-native View directly.
import { View, type ViewProps } from 'react-native';

export type BoxProps = ViewProps;

export function Box(props: BoxProps) {
  return <View {...props} />;
}
