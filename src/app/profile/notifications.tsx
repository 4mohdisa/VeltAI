// E6 · Notification preferences
// Per-type toggles, quiet hours (placeholder time rows), daily cap stepper.
import { useState } from 'react';

import { Screen } from '@/components/navigation/Screen';
import { SettingsList } from '@/components/display/SettingsList';
import { Stepper } from '@/components/forms/Stepper';
import { showToast } from '@/components/display/toastStore';

type Prefs = {
  gymReminder: boolean;
  mealReminders: boolean;
  streakAtRisk: boolean;
  aiNudges: boolean;
  weeklyRecap: boolean;
};

export default function NotificationPrefsScreen() {
  const [prefs, setPrefs] = useState<Prefs>({
    gymReminder: true,
    mealReminders: true,
    streakAtRisk: true,
    aiNudges: true,
    weeklyRecap: false,
  });
  const [dailyCap, setDailyCap] = useState(6);

  const toggle = (key: keyof Prefs) => (value: boolean) => setPrefs((p) => ({ ...p, [key]: value }));

  return (
    <Screen title="Notifications" showBack>
      <SettingsList
        title="What we send"
        rows={[
          { icon: 'barbell-outline', label: 'Gym reminder', kind: 'toggle', switchValue: prefs.gymReminder, onToggle: toggle('gymReminder') },
          { icon: 'restaurant-outline', label: 'Meal reminders', kind: 'toggle', switchValue: prefs.mealReminders, onToggle: toggle('mealReminders') },
          { icon: 'flame-outline', label: 'Streak at risk', kind: 'toggle', switchValue: prefs.streakAtRisk, onToggle: toggle('streakAtRisk') },
          { icon: 'sparkles-outline', label: 'AI nudges', kind: 'toggle', switchValue: prefs.aiNudges, onToggle: toggle('aiNudges') },
          { icon: 'calendar-outline', label: 'Weekly recap', kind: 'toggle', switchValue: prefs.weeklyRecap, onToggle: toggle('weeklyRecap') },
        ]}
      />

      <SettingsList
        title="Quiet hours"
        rows={[
          { icon: 'moon-outline', label: 'From', value: '22:00', onPress: () => showToast({ message: 'Opens a time picker on device.', tone: 'info' }) },
          { icon: 'sunny-outline', label: 'To', value: '07:00', onPress: () => showToast({ message: 'Opens a time picker on device.', tone: 'info' }) },
        ]}
      />

      <Stepper label="Daily notification cap" value={dailyCap} min={1} max={12} onChange={setDailyCap} />
    </Screen>
  );
}
