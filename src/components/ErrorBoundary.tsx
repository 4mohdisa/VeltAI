// App-wide error boundary. A render crash otherwise produces a white void; this
// shows a recovery screen with the error (collapsed) and a Reload button that
// resets the boundary to re-attempt rendering. Class component — React error
// boundaries require getDerivedStateFromError / componentDidCatch.
import { Component, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/forms/Button';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';

type Props = { children: ReactNode };
type State = { error: Error | null; showDetail: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, showDetail: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error): void {
    if (__DEV__) console.error('[ErrorBoundary]', error);
  }

  reset = (): void => this.setState({ error: null, showDetail: false });

  render(): ReactNode {
    const { error, showDetail } = this.state;
    if (!error) return this.props.children;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: space.xl, gap: space.lg }}>
          <View style={{ alignItems: 'center', gap: space.md }}>
            <Icon name="alert-circle-outline" size={48} color={color.label} />
            <Text variant="title2" color={color.label} style={{ textAlign: 'center' }}>
              Something went wrong
            </Text>
            <Text variant="body" color={color.secondaryLabel} style={{ textAlign: 'center' }}>
              The app hit an unexpected error. Reloading usually fixes it — your saved data is safe.
            </Text>
          </View>

          <Pressable
            onPress={() => this.setState((s) => ({ showDetail: !s.showDetail }))}
            haptic={false}
            minTapTarget={false}
            accessibilityLabel="Toggle error details"
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs }}
          >
            <Text variant="footnote" color={color.tertiaryLabel}>
              {showDetail ? 'Hide details' : 'Show details'}
            </Text>
            <Icon name={showDetail ? 'chevron-up' : 'chevron-down'} size={14} color={color.tertiaryLabel} />
          </Pressable>

          {showDetail ? (
            <View style={{ padding: space.md, borderRadius: radius.md, backgroundColor: color.gray50 }}>
              <Text variant="caption" color={color.secondaryLabel}>
                {error.message || String(error)}
              </Text>
            </View>
          ) : null}

          <Button title="Reload" onPress={this.reset} />
        </ScrollView>
      </SafeAreaView>
    );
  }
}
