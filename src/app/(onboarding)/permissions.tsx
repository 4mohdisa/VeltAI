// A17 · Permissions
// Our explainer first, then the native prompts (mocked). HealthKit (steps,
// sleep, heart rate, active energy) and Notifications.
import { useState } from 'react';
import { View } from 'react-native';
import { Icon } from '@/components/primitives/Icon';

import { OnboardingStep } from '@/components/domain/OnboardingStep';
import { Card } from '@/components/display/Card';
import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';

type PermCardProps = {
  icon: string;
  title: string;
  body: string;
  granted: boolean;
  onAllow: () => void;
};

function PermCard({ icon, title, body, granted, onAllow }: PermCardProps) {
  return (
    <Card>
      <View style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.full,
              backgroundColor: color.accentLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={icon} size={22} color={color.accentText} />
          </View>
          <Text variant="title3" color={color.black} style={{ flex: 1 }}>
            {title}
          </Text>
        </View>
        <Text variant="callout" color={color.gray500}>
          {body}
        </Text>
        <Button
          title={granted ? 'Allowed' : 'Allow'}
          icon={granted ? 'checkmark' : undefined}
          variant={granted ? 'secondary' : 'primary'}
          disabled={granted}
          onPress={onAllow}
        />
      </View>
    </Card>
  );
}

export default function PermissionsScreen() {
  const [health, setHealth] = useState(false);
  const [notif, setNotif] = useState(false);

  return (
    <OnboardingStep step={17} title="Two quick permissions" subtitle="You can change these any time in Settings.">
      <PermCard
        icon="heart-outline"
        title="Apple Health"
        body="We read your workouts, sleep and activity to auto-detect gym sessions and spot patterns. We never write to Health."
        granted={health}
        onAllow={() => setHealth(true)}
      />
      <PermCard
        icon="notifications-outline"
        title="Notifications"
        body="Gym reminders before your preferred time, and a heads-up when your streak is at risk. No spam — you set the cap."
        granted={notif}
        onAllow={() => setNotif(true)}
      />
    </OnboardingStep>
  );
}
