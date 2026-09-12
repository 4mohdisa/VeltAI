// D2 · Log gym session
// All inputs optional: duration, perceived effort (1–10), energy (1–5), notes.
// "Log it" extends the streak. Idempotent per UTC day.
import { Button } from '@/components/forms/Button';
import { useEffect, useState } from 'react';
import { track } from '@/lib/analytics';
import { router } from 'expo-router';

import { SheetContent } from '@/components/navigation/SheetContent';
import { SliderField } from '@/components/forms/SliderField';
import { Stepper } from '@/components/forms/Stepper';
import { TextField } from '@/components/forms/TextField';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color } from '@/lib/design/tokens';
import { formatDuration } from '@/lib/formatting';
import { logGymSession, useGym } from '@/lib/data';

export default function LogSessionScreen() {
  // Feature entered — one mount event per major surface, so "which features\n  // does anyone actually open?" is answerable without a per-screen scheme.
  useEffect(() => track('feature_used', { name: 'gym_logging' }), []);

  const {
    data: { streak },
  } = useGym();
  // Starts at "Not set": the slider's own 0 label. A duration the user never
  // chose would be sent to the server and turned into exercise calories.
  const [duration, setDuration] = useState(0);
  const [effort, setEffort] = useState(7);
  const [energy, setEnergy] = useState(3);
  const [notes, setNotes] = useState('');

  const close = () => {
    if (router.canGoBack()) router.back();
  };

  const save = () => {
    if (streak.gymLoggedToday) {
      showToast({ message: 'Already logged today.', tone: 'info' });
      close();
      return;
    }
    logGymSession({ durationMin: duration > 0 ? duration : undefined, effort, energy, notes: notes.trim() || undefined });
    showToast({ message: 'Gym logged — streak extended.', tone: 'success' });
    close();
  };

  return (
    <SheetContent variant="leading" title="Log session" onClose={close}>
      <Text variant="callout" color={color.gray500}>
        Everything here is optional — a one-tap log still counts.
      </Text>

      <SliderField
        label="Duration"
        value={duration}
        min={0}
        max={180}
        step={5}
        onValueChange={setDuration}
        formatValue={(v) => (v === 0 ? 'Not set' : formatDuration(v))}
      />

      <Stepper label="Perceived effort (1–10)" value={effort} min={1} max={10} onChange={setEffort} />

      <Stepper label="Energy level (1–5)" value={energy} min={1} max={5} onChange={setEnergy} />

      <TextField
        label="Notes"
        placeholder="Push day, felt strong…"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      {/* The design saves with a pill at the end of the sheet, not a header tick. */}
      <Button title="Log session" onPress={save} />
    </SheetContent>
  );
}
