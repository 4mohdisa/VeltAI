// E6 · Notification preferences
// Per-type toggles + quiet hours (native iOS time pickers). No daily cap.
import { useState } from 'react';
import { View } from 'react-native';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';

import { Screen } from '@/components/navigation/Screen';
import { SettingsList } from '@/components/display/SettingsList';
import { Card } from '@/components/display/Card';
import { Text } from '@/components/primitives/Text';
import { Icon } from '@/components/primitives/Icon';
import { color, space } from '@/lib/design/tokens';

type Prefs = {
  gymReminder: boolean;
  mealReminders: boolean;
  streakAtRisk: boolean;
  aiNudges: boolean;
  weeklyRecap: boolean;
};

// Build a Date set to today at the given hour/minute (quiet-hours mock seed).
function timeToday(hours: number, minutes: number): Date {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export default function NotificationPrefsScreen() {
  const [prefs, setPrefs] = useState<Prefs>({
    gymReminder: true,
    mealReminders: true,
    streakAtRisk: true,
    aiNudges: true,
    weeklyRecap: false,
  });
  const [quietFrom, setQuietFrom] = useState(() => timeToday(22, 0));
  const [quietTo, setQuietTo] = useState(() => timeToday(7, 0));

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

      <View>
        <Text
          variant="footnote"
          color={color.gray500}
          style={{ marginBottom: space.sm, textTransform: 'uppercase', letterSpacing: 1 }}
        >
          Quiet hours
        </Text>
        <Card padded={false}>
          <QuietRow icon="moon-outline" label="From" value={quietFrom} onChange={setQuietFrom} first />
          <QuietRow icon="sunny-outline" label="To" value={quietTo} onChange={setQuietTo} />
        </Card>
      </View>
    </Screen>
  );
}

function QuietRow({
  icon,
  label,
  value,
  onChange,
  first,
}: {
  icon: string;
  label: string;
  value: Date;
  onChange: (d: Date) => void;
  first?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingHorizontal: space.lg,
        paddingVertical: space.sm,
        minHeight: 52,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: color.gray100,
      }}
    >
      <Icon name={icon} size={18} color={color.gray500} />
      <Text variant="body" color={color.black} style={{ flex: 1 }}>
        {label}
      </Text>
      <DateTimePicker
        mode="time"
        display="compact"
        value={value}
        onChange={(_event, date) => date && onChange(date)}
        style={{ width: 96, height: 40 }}
      />
    </View>
  );
}
