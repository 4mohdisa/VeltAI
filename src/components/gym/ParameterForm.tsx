// ParameterForm — renders an exercise's parameter_schema as the right control per
// field, computes a live (debounced) calorie preview, and surfaces the engine's
// working. Pre-fill precedence: template planned value → user's last logged value
// → schema default. Preview failure never blocks saving — the parent still gets
// the current params via onParamsChange.
import type { JSX } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Switch, View } from 'react-native';

import { TextField } from '@/components/forms/TextField';
import { SliderField } from '@/components/forms/SliderField';
import { SegmentedField } from '@/components/forms/SegmentedField';
import { Text } from '@/components/primitives/Text';
import { Pressable } from '@/components/primitives/Pressable';
import { Icon } from '@/components/primitives/Icon';
import { accent, color, radius, space, surface } from '@/lib/design/tokens';
import { api, type CalorieResult, type LoggedParameters, type ParameterField, type ParameterSchema } from '@/lib/api';

type RawValue = number | string | boolean;
type RawValues = Record<string, RawValue>;

const isNumeric = (t: ParameterField['type']) => t === 'number' || t === 'slider';

// initialRaw seeds each field: planned → default (last-logged merges in later).
function initialRaw(schema: ParameterSchema, planned?: LoggedParameters): RawValues {
  const raw: RawValues = {};
  for (const f of schema.fields) {
    const p = planned?.[f.key];
    const v = p ?? f.default;
    if (v == null) continue;
    raw[f.key] = isNumeric(f.type) ? String(v) : (v as RawValue);
  }
  return raw;
}

// toParams converts the raw form values into the API's typed parameter map,
// dropping blank optionals.
function toParams(schema: ParameterSchema, raw: RawValues): LoggedParameters {
  const out: LoggedParameters = {};
  for (const f of schema.fields) {
    const v = raw[f.key];
    if (v == null || v === '') continue;
    if (isNumeric(f.type)) {
      const n = Number(v);
      if (Number.isFinite(n)) out[f.key] = n;
    } else if (f.type === 'toggle') {
      out[f.key] = Boolean(v);
    } else {
      out[f.key] = String(v);
    }
  }
  return out;
}

const CONFIDENCE_TINT: Record<CalorieResult['confidence'], string> = {
  high: accent.green,
  medium: accent.orange,
  low: color.tertiaryLabel,
};

export function ParameterForm({
  exerciseId,
  schema,
  planned,
  onParamsChange,
}: {
  exerciseId: string;
  schema: ParameterSchema;
  planned?: LoggedParameters;
  onParamsChange: (params: LoggedParameters) => void;
}): JSX.Element {
  const [raw, setRaw] = useState<RawValues>(() => initialRaw(schema, planned));
  const [preview, setPreview] = useState<CalorieResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const touched = useRef<Set<string>>(new Set());
  const changeRef = useRef(onParamsChange);
  // Keep the latest callback in a ref (updated in an effect, not during render).
  useEffect(() => {
    changeRef.current = onParamsChange;
  }, [onParamsChange]);

  const params = useMemo(() => toParams(schema, raw), [schema, raw]);
  const paramsKey = useMemo(() => JSON.stringify(params), [params]);

  const setField = useCallback(
    (key: string, value: RawValue | undefined) => {
      touched.current.add(key);
      setRaw((prev) => {
        const next = { ...prev };
        if (value === undefined || value === '') delete next[key];
        else next[key] = value;
        changeRef.current(toParams(schema, next));
        return next;
      });
    },
    [schema],
  );

  // Pull the user's last logged values once, and fill any field they haven't
  // touched and the template didn't already plan (planned → last-logged → default).
  useEffect(() => {
    let alive = true;
    api.gym
      .lastLogged(exerciseId)
      .then((res) => {
        if (!alive || !res.parameters) return;
        setRaw((prev) => {
          const next = { ...prev };
          for (const f of schema.fields) {
            const ll = res.parameters?.[f.key];
            if (ll == null) continue;
            if (touched.current.has(f.key) || planned?.[f.key] != null) continue;
            next[f.key] = isNumeric(f.type) ? String(ll) : (ll as RawValue);
          }
          changeRef.current(toParams(schema, next));
          return next;
        });
      })
      .catch(() => {
        /* pre-fill is best-effort */
      });
    return () => {
      alive = false;
    };
  }, [exerciseId, schema, planned]);

  // Notify the parent of the initial params (so a save with zero edits still works).
  useEffect(() => {
    changeRef.current(toParams(schema, raw));
    // Run once on mount; subsequent changes are pushed by setField/lastLogged.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced live preview. Loading/fetch happen inside the timer callback, so no
  // synchronous setState in the effect body.
  useEffect(() => {
    let alive = true;
    const id = setTimeout(() => {
      setPreviewLoading(true);
      api.gym
        .previewCalories(exerciseId, params)
        .then((res) => {
          if (!alive) return;
          setPreview(res);
          setPreviewFailed(false);
        })
        .catch(() => {
          if (alive) setPreviewFailed(true);
        })
        .finally(() => {
          if (alive) setPreviewLoading(false);
        });
    }, 400);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [exerciseId, paramsKey, params]);

  return (
    <View style={{ gap: space.md }}>
      {schema.fields.map((f) => (
        <Field key={f.key} field={f} raw={raw[f.key]} onChange={(v) => setField(f.key, v)} />
      ))}

      {/* Live preview */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xs }}>
        <View
          style={{
            width: space.sm,
            height: space.sm,
            borderRadius: radius.full,
            backgroundColor: preview ? CONFIDENCE_TINT[preview.confidence] : color.light3,
          }}
        />
        <Text variant="bodyMedium" color={color.label}>
          {previewLoading && !preview
            ? 'Calculating…'
            : previewFailed && !preview
              ? 'Preview unavailable'
              : preview
                ? `≈ ${Math.round(preview.calories)} kcal`
                : '—'}
        </Text>
        {preview ? (
          <Pressable
            onPress={() => setShowExplain((s) => !s)}
            haptic={false}
            minTapTarget={false}
            hitSlop={10}
            accessibilityLabel="How is this calculated?"
            style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: space.xs }}
          >
            <Text variant="footnote" color={color.secondaryLabel}>
              How is this calculated?
            </Text>
            <Icon name={showExplain ? 'chevron-up' : 'chevron-down'} size={14} color={color.secondaryLabel} />
          </Pressable>
        ) : null}
      </View>

      {showExplain && preview ? (
        <View style={{ gap: space.xs, padding: space.md, borderRadius: radius.md, backgroundColor: surface.tile }}>
          <Text variant="footnote" color={color.secondaryLabel}>
            {preview.explanation}
          </Text>
          <Text variant="caption" color={color.secondaryLabel}>
            {`${preview.computed_met} MET · ${preview.confidence} confidence`}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// Field renders one parameter control by type.
function Field({ field, raw, onChange }: { field: ParameterField; raw: RawValue | undefined; onChange: (v: RawValue | undefined) => void }): JSX.Element {
  const label = field.unit ? `${field.label} (${field.unit})` : field.label;

  if (field.type === 'slider') {
    return (
      <SliderField
        label={label}
        value={typeof raw === 'number' ? raw : Number(raw ?? field.default ?? field.min ?? 0)}
        min={field.min ?? 0}
        max={field.max ?? 100}
        step={field.step ?? 1}
        onValueChange={(n) => onChange(n)}
      />
    );
  }
  if (field.type === 'select') {
    const options = field.options ?? [];
    return (
      <SegmentedField
        label={field.label}
        value={String(raw ?? field.default ?? options[0]?.value ?? '')}
        onChange={(v) => onChange(v)}
        options={options}
        variant="inset"
      />
    );
  }
  if (field.type === 'toggle') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="body" color={color.label}>
          {field.label}
        </Text>
        <Switch value={Boolean(raw)} onValueChange={(v) => onChange(v)} trackColor={{ true: color.primary, false: color.light2 }} />
      </View>
    );
  }
  // number
  return (
    <TextField
      label={label}
      value={raw == null ? '' : String(raw)}
      onChangeText={(t) => onChange(t)}
      keyboardType="numeric"
      placeholder={field.default != null ? String(field.default) : ''}
      required={field.required}
    />
  );
}
