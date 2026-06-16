// C5 · Uncertainty prompt
// One question card at a time with four options and a live calorie preview.
// Stacks to the next uncertainty after each answer. Answering just improves
// accuracy and saves the meal — it grants no reward.
import { useState } from 'react';
import { router } from 'expo-router';

import { SheetContent } from '@/components/navigation/SheetContent';
import { Button } from '@/components/forms/Button';
import { UncertaintyPromptCard } from '@/components/domain/UncertaintyPromptCard';
import { showToast } from '@/components/display/toastStore';
import { aiUncertaintyPrompts } from '@/lib/mock/ai';

export default function UncertaintyScreen() {
  const prompts = aiUncertaintyPrompts;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const current = prompts[index];
  const isLast = index === prompts.length - 1;
  const answered = !!answers[current.id];

  // Multi-step Q&A: the glass X bails out of the scan; an explicit in-body
  // Next/Save button drives progression (a single trailing tick can't convey
  // "Next" — documented deviation from the X/Done pattern).
  const dismiss = () => {
    router.dismissAll?.();
    router.replace('/(tabs)/food');
  };

  const next = () => {
    if (isLast) {
      showToast({ message: 'Meal saved.', tone: 'success' });
      dismiss();
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <SheetContent title="Quick check" onClose={dismiss}>
      <UncertaintyPromptCard
        prompt={current}
        index={index}
        total={prompts.length}
        selectedLabel={answers[current.id]}
        onSelect={(label) => setAnswers((a) => ({ ...a, [current.id]: label }))}
      />
      <Button title={isLast ? 'Save meal' : 'Next'} disabled={!answered} onPress={next} />
    </SheetContent>
  );
}
