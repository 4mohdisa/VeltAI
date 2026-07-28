// E6 · Notification preferences
// Per-type toggles + quiet hours (native iOS time pickers). No daily cap.
// Prefs live in the settings store so they survive unmount (not just useState).
import { View } from 'react-native';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';

import { Screen } from '@/components/navigation/Screen';
import { SettingsList } from '@/components/display/SettingsList';
import { Card } from '@/components/display/Card';
import { Text } from '@/components/primitives/Text';
import { Icon } from '@/components/primitives/Icon';
import { color, space } from '@/lib/design/tokens';
import { useSettingsStore, type NotificationPrefs } from '@/lib/settings/store';

export default function NotificationPrefsScreen() {
  const prefs = useSettingsStore((s) => s.notificationPrefs);
  const setPrefs = useSettingsStore((s) => s.setNotificationPrefs);

  const toggle = (key: keyof NotificationPrefs) => (value: boolean) => setPrefs({ [key]: value });

  return (
    <Screen grouped title="Notifications" showBack backLabel="Settings">
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
          <QuietRow icon="moon-outline" label="From" value={prefs.quietFrom} onChange={(d) => setPrefs({ quietFrom: d })} first />
          <QuietRow icon="sunny-outline" label="To" value={prefs.quietTo} onChange={(d) => setPrefs({ quietTo: d })} />
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
      />
    </View>
  );
}
