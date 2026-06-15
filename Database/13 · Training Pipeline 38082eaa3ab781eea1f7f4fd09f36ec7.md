# 13 · Training Pipeline

Company AI training data pipeline. **No user access** — service role only.

---

## `training_dataset`

Anonymised food scan corrections ready for fine-tuning runs.

```sql
CREATE TABLE training_dataset (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_correction_id  UUID,                 -- original food_scan_corrections.id (anonymised reference)

  scan_type             TEXT NOT NULL,        -- photo_fresh | photo_packaged | voice
  image_storage_path    TEXT,                  -- anonymised food image path

  ai_guess              JSONB NOT NULL,        -- what the model originally guessed
  correct_answer        JSONB NOT NULL,        -- what the user confirmed

  correction_type       TEXT NOT NULL,
    -- oil_type_corrected | oil_quantity_corrected
    -- ingredient_added | ingredient_removed
    -- quantity_adjusted | item_name_corrected

  cuisine_category      TEXT,                  -- pakistani | italian | etc. (for stratified training)

  added_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  training_run_id       TEXT,                  -- which fine-tune used this row
  training_run_at       TIMESTAMPTZ
);

CREATE INDEX idx_training_pending ON training_dataset(training_run_id)
  WHERE training_run_id IS NULL;
CREATE INDEX idx_training_correction_type ON training_dataset(correction_type);
CREATE INDEX idx_training_cuisine ON training_dataset(cuisine_category);

-- No RLS user policies. Only service role can access.
```

---

## `training_runs`

Log of each fine-tuning job.

```sql
CREATE TABLE training_runs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id              TEXT NOT NULL UNIQUE,
  base_model          TEXT NOT NULL,           -- e.g. "meta-llama/Llama-3-8b-hf"
  fine_tuned_model    TEXT,                    -- resulting model identifier
  training_rows       INT,
  status              TEXT NOT NULL DEFAULT 'pending',
    -- pending | running | completed | failed
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  eval_metrics        JSONB,
  deployed_at         TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Training rules

### What to train on

Only `food_scan_corrections` where the user **explicitly changed** the AI's guess. These rows have `correction_type` set to one of:

- `oil_type_corrected`
- `oil_quantity_corrected`
- `ingredient_added`
- `ingredient_removed`
- `quantity_adjusted`
- `item_name_corrected`

### What NOT to train on

**Never train on passive approvals.**

If the user simply tapped OK on the AI's guess without changing anything, that data has selection bias. Users prefer lower calorie estimates and accept them uncritically. Training on passive approvals teaches the model to underestimate.

This is exactly what made Cal AI silently underestimate calories by 25–50%.

### Cadence

- **Months 1–5**: collect data only
- **Month 6+**: first fine-tune once > 5,000 corrections are accumulated
- **Ongoing**: monthly fine-tunes
- **Deploy**: only if eval metrics improve on held-out test set

### Minimum sizes

- Don't run training with < 1,000 examples of any correction type — causes overfitting
- Stratify by cuisine to avoid model regressing on under-represented cuisines

### Provider

Together AI for fine-tuning. ~$0.48 per 1M training tokens. Llama 3.x base models.

The fine-tuned model becomes a fallback to reduce Gemini costs as user base grows. Gemini stays the primary model.