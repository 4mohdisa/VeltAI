// The debug UI: a draggable bubble, the quick report sheet, and the tag wrapper.
//
// Everything here is inside impl/, so metro.config.js resolves this whole file
// to the stub when EXPO_PUBLIC_DEBUG_CAPTURE !== '1' — it is not in a
// production bundle at all.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Accelerometer } from 'expo-sensors';

import { Text } from '@/components/primitives/Text';
import { KINDS, SEVERITIES, AREAS, type Kind, type Severity, type Trigger } from '../types';
import { capture, areaForRoute, setActiveTag } from './capture';

const INK = '#1C1C1E';
const PAPER = '#FFFFFF';
const MUTED = '#6B6B6B';

// --- the quick sheet ---------------------------------------------------------

type SheetProps = {
  visible: boolean;
  route: string;
  onClose: () => void;
  trigger: Trigger;
};

/** Two taps to file: type a title, hit Save. Everything else is optional and
 *  pre-filled — severity defaults to minor, kind to bug, area from the route. */
export function ReportSheet({ visible, route, onClose, trigger }: SheetProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [severity, setSeverity] = useState<Severity>('minor');
  const [kind, setKind] = useState<Kind>('bug');
  // Initialised from the route, not synced by an effect: DebugBubble remounts
  // this sheet per open (see its key), so the initialiser IS the reset.
  const [area, setArea] = useState<string>(() => areaForRoute(route));
  const [tag, setTag] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await capture(trigger, {
        title: title.trim(),
        notes: notes.trim() || undefined,
        severity,
        kind,
        area,
        componentTag: tag.trim() || undefined,
      });
    } finally {
      setSaving(false);
      setTitle('');
      setNotes('');
      setTag('');
      onClose();
    }
  };

  const chip = (label: string, on: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: on ? INK : '#F0F0F0',
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text variant="footnote" color={on ? PAPER : INK}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: PAPER, padding: 20, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text variant="title2" color={INK} style={{ flex: 1 }}>
            New report
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text variant="body" color={MUTED}>
              Cancel
            </Text>
          </Pressable>
        </View>

        <Text variant="footnote" color={MUTED}>
          {route}
        </Text>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="What happened? (required)"
          placeholderTextColor={MUTED}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={save}
          style={{ borderWidth: 1, borderColor: '#DDD', borderRadius: 12, padding: 12, fontSize: 17, color: INK }}
        />

        <Pressable
          onPress={save}
          disabled={!title.trim() || saving}
          style={{
            backgroundColor: title.trim() ? INK : '#CCC',
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
          }}
        >
          <Text variant="body" color={PAPER}>
            {saving ? 'Saving…' : 'Save report'}
          </Text>
        </Pressable>

        <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
          <Text variant="footnote" color={MUTED} style={{ marginBottom: 6 }}>
            Severity
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {SEVERITIES.map((s) => chip(s, severity === s, () => setSeverity(s)))}
          </View>

          <Text variant="footnote" color={MUTED} style={{ marginBottom: 6, marginTop: 8 }}>
            Kind
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{KINDS.map((k) => chip(k, kind === k, () => setKind(k)))}</View>

          <Text variant="footnote" color={MUTED} style={{ marginBottom: 6, marginTop: 8 }}>
            Area (from route — change if wrong)
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{AREAS.map((a) => chip(a, area === a, () => setArea(a)))}</View>

          <Text variant="footnote" color={MUTED} style={{ marginBottom: 6, marginTop: 8 }}>
            Notes
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional"
            placeholderTextColor={MUTED}
            multiline
            style={{
              borderWidth: 1,
              borderColor: '#DDD',
              borderRadius: 12,
              padding: 12,
              minHeight: 90,
              textAlignVertical: 'top',
              fontSize: 15,
              color: INK,
            }}
          />

          <Text variant="footnote" color={MUTED} style={{ marginBottom: 6, marginTop: 8 }}>
            Component tag (optional)
          </Text>
          <TextInput
            value={tag}
            onChangeText={setTag}
            placeholder="e.g. ScanReviewCard"
            placeholderTextColor={MUTED}
            style={{ borderWidth: 1, borderColor: '#DDD', borderRadius: 12, padding: 12, fontSize: 15, color: INK }}
          />
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// --- the floating bubble -----------------------------------------------------

/** Draggable so it never blocks the thing being tested. Long-press opens the
 *  sheet; a plain tap is ignored on purpose, so a mis-tap while testing does
 *  not interrupt. */
export function DebugBubble({ route, onOpenList }: { route: string; onOpenList: () => void }) {
  const { width, height } = useWindowDimensions();
  const [sheet, setSheet] = useState(false);
  const x = useSharedValue(width - 76);
  const y = useSharedValue(height - 220);

  const drag = Gesture.Pan()
    .onChange((e) => {
      x.value += e.changeX;
      y.value += e.changeY;
    })
    .onEnd(() => {
      // Snap to the nearer edge and stay on screen.
      x.value = withSpring(x.value + 28 < width / 2 ? 12 : width - 68);
      y.value = withSpring(Math.min(Math.max(y.value, 60), height - 120));
    });

  const open = Gesture.LongPress()
    .minDuration(350)
    .onStart(() => runOnJS(setSheet)(true));

  const double = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => runOnJS(onOpenList)());

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }] }));

  return (
    <>
      <GestureDetector gesture={Gesture.Simultaneous(drag, Gesture.Exclusive(open, double))}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: INK,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.85,
              zIndex: 9999,
              elevation: 9999,
            },
            style,
          ]}
        >
          <Text variant="footnote" color={PAPER}>
            REC
          </Text>
        </Animated.View>
      </GestureDetector>
      {/* Keyed so each open starts from a clean sheet with the current route. */}
      <ReportSheet key={`${String(sheet)}-${route}`} visible={sheet} route={route} trigger="bubble" onClose={() => setSheet(false)} />
    </>
  );
}

// --- shake to report ---------------------------------------------------------

/** Shake detection with a debounce, so one shake files one report. */
export function useShake(onShake: () => void, enabled: boolean): void {
  const last = useRef(0);
  useEffect(() => {
    if (!enabled) return;
    Accelerometer.setUpdateInterval(120);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const g = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();
      // ~1g at rest; 1.8 is a deliberate shake, not a brisk walk.
      if (g > 1.8 && now - last.current > 1500) {
        last.current = now;
        onShake();
      }
    });
    return () => sub.remove();
  }, [onShake, enabled]);
}

// --- component tagging -------------------------------------------------------

/** Wrap any component while testing; reports raised while it is mounted carry
 *  its name. A no-op in production (the stub exports a passthrough). */
export function DebugTag({ name, children }: { name: string; children: React.ReactNode }) {
  useEffect(() => {
    setActiveTag(name);
    return () => setActiveTag(null);
  }, [name]);
  return <>{children}</>;
}

export function useShakeCallback(route: string): () => void {
  return useCallback(() => {
    // Shake files a DRAFT immediately with no sheet: the tester's hands are
    // busy and the point is to not lose the moment. Title it from the route.
    void capture('shake', { title: `Shake capture — ${route}` }, { draft: true });
  }, [route]);
}
