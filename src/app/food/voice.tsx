// C6 · Voice entry
// Big mic button centre-screen with a live transcript building above it. Stop →
// the parsed items appear in the same review layout as the photo flow.
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/primitives/Icon';

import { Screen } from '@/components/navigation/Screen';
import { Button } from '@/components/forms/Button';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { DetectedItemsReview } from '@/components/domain/DetectedItemsReview';
import { FoodItemEditSheet, type EditableItem } from '@/components/domain/FoodItemEditSheet';
import { showToast } from '@/components/display/toastStore';
import { color, radius, space } from '@/lib/design/tokens';
import { aiVoiceItems, aiVoiceTranscript, type DetectedItem } from '@/lib/mock/ai';

const WORDS = aiVoiceTranscript.split(' ');

export default function VoiceEntryScreen() {
  const [listening, setListening] = useState(false);
  const [shownWords, setShownWords] = useState(0);
  const [done, setDone] = useState(false);
  const [items, setItems] = useState<DetectedItem[]>(aiVoiceItems);
  const [editing, setEditing] = useState<DetectedItem | null>(null);

  const applyEdit = (next: EditableItem) => {
    setItems((arr) => arr.map((x) => (x.id === next.id ? { ...x, ...next } : x)));
    setEditing(null);
  };
  const removeItem = (id: string) => {
    setItems((arr) => arr.filter((x) => x.id !== id));
    setEditing(null);
  };

  useEffect(() => {
    if (!listening) return;
    const timer = setInterval(() => {
      setShownWords((n) => {
        if (n >= WORDS.length) {
          clearInterval(timer);
          return n;
        }
        return n + 1;
      });
    }, 220);
    return () => clearInterval(timer);
  }, [listening]);

  const transcript = WORDS.slice(0, shownWords).join(' ');

  if (done) {
    return (
      <Screen
        title="Review meal"
        showBack
        footer={
          <Button
            title="Save meal"
            icon="checkmark"
            onPress={() => {
              showToast({ message: 'Meal saved.', tone: 'success' });
              router.replace('/(tabs)/food');
            }}
          />
        }
      >
        <Text variant="callout" color={color.gray500}>
          “{aiVoiceTranscript}”
        </Text>
        <DetectedItemsReview items={items} onEditItem={setEditing} />

        <FoodItemEditSheet item={editing} onClose={() => setEditing(null)} onSave={applyEdit} onDelete={removeItem} />
      </Screen>
    );
  }

  return (
    <Screen title="Voice entry" showBack scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xl }}>
        <Text variant="title3" color={color.gray700} style={{ textAlign: 'center', minHeight: 60 }}>
          {transcript || (listening ? 'Listening…' : 'Tap the mic and describe your meal')}
        </Text>

        <Pressable
          onPress={() => {
            if (listening) {
              setListening(false);
              setDone(true);
            } else {
              setShownWords(0);
              setListening(true);
            }
          }}
          accessibilityLabel={listening ? 'Stop recording' : 'Start recording'}
          minTapTarget={false}
          style={{
            width: 96,
            height: 96,
            borderRadius: radius.full,
            backgroundColor: listening ? color.black : color.black,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={listening ? 'stop' : 'mic'} size={40} color={color.white} />
        </Pressable>

        <Text variant="footnote" color={color.gray500}>
          {listening ? 'Tap to stop' : 'e.g. “chicken and rice with salad”'}
        </Text>
      </View>
    </Screen>
  );
}
