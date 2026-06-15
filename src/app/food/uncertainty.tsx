// C5 · Uncertainty prompt
// One question card at a time with four options and a live calorie preview.
// Stacks to the next uncertainty after each answer. Completing all earns the
// +3 XP bonus and saves the meal.
import { useState } from 'react';

import { Screen } from '@/components/navigation/Screen';
import { Button } from '@/components/forms/Button';
import { UncertaintyPromptCard } from '@/components/domain/UncertaintyPromptCard';
import { showToast } from '@/components/display/toastStore';
import { aiUncertaintyPrompts } from '@/lib/mock/ai';
import { router } from 'expo-router';

export default function UncertaintyScreen() {
  const prompts = aiUncertaintyPrompts;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const current = prompts[index];
  const isLast = index === prompts.length - 1;
  const answered = !!answers[current.id];

  const next = () => {
    if (isLast) {
      showToast({ message: '+8 XP (+3 bonus) · Meal saved.', tone: 'success' });
      router.dismissAll?.();
      router.replace('/(tabs)/food');
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <Screen
      title="Quick check"
      showBack
      footer={
        <Button title={isLast ? 'Save meal' : 'Next'} disabled={!answered} onPress={next} />
      }
    >
      <UncertaintyPromptCard
        prompt={current}
        index={index}
        total={prompts.length}
        selectedLabel={answers[current.id]}
        onSelect={(label) => setAnswers((a) => ({ ...a, [current.id]: label }))}
      />
    </Screen>
  );
}
