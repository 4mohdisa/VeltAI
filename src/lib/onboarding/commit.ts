// Onboarding bridge (Task 2) — on completion, write the collected answers into the
// app's user + settings state so the app reflects the user's REAL numbers (not
// generic mock). The goal target is then derived from these metrics (see
// lib/goals/derive) and shown as the editable "AI recommendation".
import { setUserProfile } from '@/lib/data';
import { useSettingsStore } from '@/lib/settings/store';
import type { OnboardingAnswers } from './store';

export function commitOnboarding(a: OnboardingAnswers): void {
  // Body metrics + dietary prefs → user profile (canonical SI).
  setUserProfile({
    weightKg: a.weight,
    heightCm: a.height,
    age: a.age,
    sex: a.sex,
    goal: a.goal,
    targetWeightKg: a.targetWeight,
    gymTargetPerWeek: a.gymTarget,
    restrictions: a.restrictions,
    allergies: a.allergies,
    cuisines: a.cuisines,
  });

  const settings = useSettingsStore.getState();
  settings.setSystem(a.units); //        units the user chose
  settings.setGoalMode('ai'); //         use the freshly derived recommendation
  settings.resetGoalsToAi(); //          reseed the custom fields from the new profile
}
