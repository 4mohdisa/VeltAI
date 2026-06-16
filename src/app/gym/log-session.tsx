// D2 · Log gym session
// All inputs optional: duration, perceived effort (1–10), energy (1–5), notes.
// "Log it" extends the streak. Idempotent per UTC day.
import { useState } from 'react';
import { router } from 'expo-router';

import { SheetContent } from '@/components/navigation/SheetContent';
import { SliderField } from '@/components/forms/SliderField';
import { Stepper } from '@/components/forms/Stepper';
import { TextField } from '@/components/forms/TextField';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color } from '@/lib/design/tokens';
import { formatDuration } from '@/lib/formatting';

export default function LogSessionScreen() {
  const [duration, setDuration] = useState(60);
  const [effort, setEffort] = useState(7);
  const [energy, setEnergy] = useState(3);
  const [notes, setNotes] = useState('');

  const close = () => {
    if (router.canGoBack()) router.back();
  };

  return (
    <SheetContent
      title="Log session"
      onClose={close}
      onDone={() => {
        showToast({ message: 'Gym logged — streak extended.', tone: 'success' });
        close();
      }}
    >
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
    </SheetContent>
  );
}
