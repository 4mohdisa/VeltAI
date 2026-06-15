// Screen — shared page scaffold so every screen gets consistent safe-area,
// optional NavBar (our chrome), scrolling body, and an optional sticky footer
// for a primary CTA. Keeps the ~50 feature screens uniform and short.
import type { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NavBar } from './NavBar';
import { color, space } from '@/lib/design/tokens';

export type ScreenProps = {
  title?: string;
  showBack?: boolean;
  headerRight?: ReactNode;
  borderlessHeader?: boolean;
  scroll?: boolean;
  padded?: boolean;
  footer?: ReactNode;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
};

export function Screen({
  title,
  showBack = false,
  headerRight,
  borderlessHeader,
  scroll = true,
  padded = true,
  footer,
  children,
  contentStyle,
  backgroundColor = color.white,
}: ScreenProps) {
  const hasHeader = showBack || title !== undefined || headerRight !== undefined;
  const padding = padded ? { padding: space.lg } : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={['top']}>
      {hasHeader ? (
        <NavBar title={title} showBack={showBack} right={headerRight} borderless={borderlessHeader} />
      ) : null}

      {scroll ? (
        <ScrollView
          contentContainerStyle={[{ gap: space.lg, paddingBottom: space['3xl'] }, padding, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, gap: space.lg }, padding, contentStyle]}>{children}</View>
      )}

      {footer ? (
        <View style={{ padding: space.lg, borderTopWidth: 1, borderTopColor: color.gray200 }}>{footer}</View>
      ) : null}
    </SafeAreaView>
  );
}
