// A16 · Lockout setup
// Opt-in toggle. When on: app picker (defaults pre-selected), enforcement window
// and grace period. Skip available — Soft mode still ships for everyone.
import { useState } from 'react';
import { router } from 'expo-router';

import { OnboardingStep } from '@/components/domain/OnboardingStep';
import { SettingsList } from '@/components/display/SettingsList';
import { MultiSelectField } from '@/components/forms/MultiSelectField';
import { SegmentedField } from '@/components/forms/SegmentedField';
import { useOnboarding } from '@/lib/onboarding/store';
import { onboardingHref } from '@/lib/onboarding/steps';

const APPS = ['Instagram', 'TikTok', 'X', 'YouTube', 'Snapchat', 'Reddit'].map((a) => ({
  label: a,
  value: a.toLowerCase(),
}));

export default function LockoutSetupScreen() {
  const lockoutEnabled = useOnboarding((s) => s.lockoutEnabled);
  const set = useOnboarding((s) => s.set);
  const [apps, setApps] = useState(['instagram', 'tiktok', 'x', 'youtube']);
  const [window, setWindow] = useState<'always' | 'evening' | 'custom'>('evening');
  const [grace, setGrace] = useState<'30' | '15' | '0'>('30');

  return (
    <OnboardingStep
      step={16}
      title="Want us to lock distracting apps?"
      subtitle="Locked until you log today's gym session. This is the whole point."
      onSkip={() => router.push(onboardingHref('permissions') as never)}
    >
      <SettingsList
        rows={[
          {
            icon: 'lock-closed-outline',
            label: 'Enable lockout',
            kind: 'toggle',
            switchValue: lockoutEnabled,
            onToggle: (v) => set({ lockoutEnabled: v }),
          },
        ]}
      />

      {lockoutEnabled ? (
        <>
          <MultiSelectField label="Apps to lock" options={APPS} selected={apps} onChange={setApps} />
          <SegmentedField
            label="When to enforce"
            value={window}
            onChange={setWindow}
            options={[
              { label: 'Always', value: 'always' },
              { label: 'Evening', value: 'evening' },
              { label: 'Custom', value: 'custom' },
            ]}
          />
          <SegmentedField
            label="Grace period"
            value={grace}
            onChange={setGrace}
            options={[
              { label: '30 min', value: '30' },
              { label: '15 min', value: '15' },
              { label: 'None', value: '0' },
            ]}
          />
        </>
      ) : null}
    </OnboardingStep>
  );
}
