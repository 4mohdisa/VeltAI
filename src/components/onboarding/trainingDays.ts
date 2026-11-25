// Training days options, shared by the onboarding step and the Goals screen.
// Labels live in onboarding.trainingDays.options, keyed by these values.
import type { TrainingDays } from '@/lib/types';

export const TRAINING_DAYS = ['days_0', 'days_1_2', 'days_3_4', 'days_5_plus'] as const satisfies readonly TrainingDays[];
