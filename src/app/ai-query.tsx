// Ask Lume — one-question-at-a-time (NOT a chat history). Shows only the latest
// answer. Suggestion chips fill the input (never auto-send). Every AI path
// degrades: `ask` never throws, and a 503/error surfaces the unavailable state
// only after the user has actually sent a question.
import { useEffect, useState } from 'react';
import { track } from '@/lib/analytics';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { TextField } from '@/components/forms/TextField';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { TypingIndicator } from '@/components/ai';
import { useAIQuery } from '@/lib/data/aiBrain';
import { ensureAiConsent } from '@/lib/ai/consent';
import { color, space, radius, layout, surface, categoryAccent } from '@/lib/design/tokens';

const SUGGESTIONS = [
  "How's my protein this week?",
  'Am I eating enough on gym days?',
  "What's my most logged food?",
  'How close am I to my goal?',
] as const;

export default function AIQueryScreen() {
  // Feature entered — one mount event per major surface, so "which features\n  // does anyone actually open?" is answerable without a per-screen scheme.
  useEffect(() => track('feature_used', { name: 'ai_brain' }), []);

  const { ask, loading, unavailable } = useAIQuery();
  const [input, setInput] = useState('');
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [attempted, setAttempted] = useState(false);

  const canSend = input.trim().length > 0 && !loading;

  const onSend = async () => {
    const q = input.trim();
    if (!q || loading) return;
    // 5.1.2(i): the question + data summary are processed by Anthropic —
    // one-time disclosure before the first send.
    if (!(await ensureAiConsent())) return;
    setAttempted(true);
    setQuestion(q);
    setAnswer('');
    setInput('');
    const res = await ask(q); // never throws; '' on unavailable
    setAnswer(res);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header: back control + title + subheading */}
        <View style={{ paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.xs }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Back"
            style={{ alignSelf: 'flex-start' }}
          >
            <Icon name="chevron-back" size={26} color={color.label} />
          </Pressable>
          <View style={{ paddingHorizontal: space.xs, gap: space.xs }}>
            <Text variant="title1" color={color.label}>
              Ask Lume
            </Text>
            <Text variant="callout" color={color.secondaryLabel}>
              Ask anything about your food, nutrition, or habits
            </Text>
          </View>
        </View>

        {/* Answer area (middle) */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, padding: space.xl, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {!attempted ? (
            <View style={{ alignItems: 'center', gap: space.md }}>
              <Icon name="sparkles" size={40} color={categoryAccent.ai} />
              <Text variant="body" color={color.secondaryLabel} style={{ textAlign: 'center' }}>
                Ask a question about your nutrition data
              </Text>
            </View>
          ) : loading ? (
            <View style={{ alignItems: 'flex-start' }}>
              <TypingIndicator />
            </View>
          ) : unavailable ? (
            <View style={{ alignItems: 'center', gap: space.sm }}>
              <Icon name="alert-circle-outline" size={36} color={color.tertiaryLabel} />
              <Text variant="bodyBold" color={color.label} style={{ textAlign: 'center' }}>
                AI analysis unavailable right now
              </Text>
              <Text variant="callout" color={color.secondaryLabel} style={{ textAlign: 'center' }}>
                Your data is still being tracked — try again later
              </Text>
            </View>
          ) : answer ? (
            <View style={{ gap: space.sm }}>
              {question ? (
                <Text variant="footnote" color={color.secondaryLabel}>
                  {question}
                </Text>
              ) : null}
              <Text variant="body" color={color.label}>
                {answer}
              </Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Bottom: always-available suggestion chips + chat-style input */}
        <View style={{ gap: space.md, paddingBottom: space.sm }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.lg }}
          >
            {SUGGESTIONS.map((chip) => (
              <Pressable
                key={chip}
                onPress={() => setInput(chip)}
                minTapTarget={false}
                hitSlop={6}
                accessibilityLabel={chip}
                style={{
                  paddingHorizontal: space.md,
                  paddingVertical: space.sm,
                  backgroundColor: surface.card,
                  borderRadius: radius.pill,
                }}
              >
                <Text variant="footnote" color={color.label}>
                  {chip}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.sm,
              paddingHorizontal: space.lg,
            }}
          >
            <View style={{ flex: 1 }}>
              <TextField
                value={input}
                onChangeText={setInput}
                accessibilityLabel="Ask a question"
                placeholder="e.g. How's my protein intake?"
                editable={!loading}
                returnKeyType="send"
                onSubmitEditing={() => {
                  if (canSend) void onSend();
                }}
              />
            </View>
            <Pressable
              onPress={() => void onSend()}
              disabled={!canSend}
              minTapTarget={false}
              accessibilityLabel="Send"
              style={{
                width: layout.buttonHeight,
                height: layout.buttonHeight,
                borderRadius: radius.full,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: canSend ? color.primary : surface.card,
              }}
            >
              <Icon name="send" size={20} color={canSend ? color.onPrimary : color.tertiaryLabel} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
