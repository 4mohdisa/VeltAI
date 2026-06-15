// A11 · Your day
// Wake, sleep and preferred gym time. (Native time pickers in production; here
// they're 15-minute steppers to avoid an extra native dependency overnight.)
import { OnboardingStep } from '@/components/domain/OnboardingStep';
import { Stepper } from '@/components/forms/Stepper';
import { useOnboarding } from '@/lib/onboarding/store';

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
function toHHMM(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export default function ScheduleScreen() {
  const { wakeTime, sleepTime, gymTime } = useOnboarding();
  const set = useOnboarding((s) => s.set);

  const timeStepper = (label: string, value: string, key: 'wakeTime' | 'sleepTime' | 'gymTime') => (
    <Stepper
      label={label}
      value={toMinutes(value)}
      min={0}
      max={1425}
      step={15}
      onChange={(m) => set({ [key]: toHHMM(m) })}
      formatValue={(m) => toHHMM(m)}
    />
  );

  return (
    <OnboardingStep step={11} title="What does your day look like?" subtitle="We schedule your plan around it.">
      {timeStepper('Wake time', wakeTime, 'wakeTime')}
      {timeStepper('Preferred gym time', gymTime, 'gymTime')}
      {timeStepper('Sleep time', sleepTime, 'sleepTime')}
    </OnboardingStep>
  );
}
