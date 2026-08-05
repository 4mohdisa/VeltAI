// Lume API client — typed fetch wrapper over the Go backend.
//
// Every backend response uses the envelope { data: T, error: string | null }
// (backend/internal/httpx). Non-2xx or error != null throws an ApiError.
// Field names are snake_case, matching the Postgres schema
// (supabase/migrations/20260711000001_initial_schema.sql).

// Deploy-time config, no code edit needed: set EXPO_PUBLIC_API_URL to the
// deployed backend origin (see CONFIG.md). Dev default matches
// backend/internal/config/config.go config.BaseURL. Scheme-agnostic: an https
// origin works as-is. A trailing slash is stripped so 'https://api.x.com/'
// doesn't produce '//api/...'.
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080').replace(/\/+$/, '');

/**
 * True when a RELEASE build was packaged without EXPO_PUBLIC_API_URL, so every
 * request would target http://localhost:8080 — which on iOS is additionally
 * blocked by ATS, since app.json declares no NSAppTransportSecurity exception.
 *
 * This used to be silent. The app would launch, every request would fail, and
 * useHydration swallows failures by design (error stays null), so the user got
 * a plausible-looking but permanently empty app with no error state and no way
 * to distinguish a mis-packaged binary from a real outage. Silent degradation
 * in a release build is a bug; the root layout renders a configuration error,
 * matching the AuthGate treatment of a missing Clerk key.
 *
 * __DEV__ is read inline rather than via lib/env so this module stays
 * dependency-free; undefined (jest) counts as dev, same semantics as isDevBuild.
 */
export const IS_MISCONFIGURED_RELEASE =
  (typeof __DEV__ === 'undefined' ? false : !__DEV__) && !process.env.EXPO_PUBLIC_API_URL;

// Network posture (all env-tunable, all with sane defaults):
//   EXPO_PUBLIC_API_TIMEOUT_MS         per-attempt deadline for a normal request
//   EXPO_PUBLIC_API_UPLOAD_TIMEOUT_MS  ditto for image uploads (megabytes, slow uplink)
//   EXPO_PUBLIC_API_RETRIES            retries for idempotent GETs (0 disables)
const num = (v: string | undefined, d: number): number =>
  v === undefined || v === '' || !Number.isFinite(Number(v)) ? d : Number(v);
const TIMEOUT_MS = num(process.env.EXPO_PUBLIC_API_TIMEOUT_MS, 15_000);
const UPLOAD_TIMEOUT_MS = num(process.env.EXPO_PUBLIC_API_UPLOAD_TIMEOUT_MS, 60_000);
const GET_RETRIES = Math.max(0, num(process.env.EXPO_PUBLIC_API_RETRIES, 2));
const RETRY_BASE_MS = 300;

// Scan payloads carry base64 image data — one shot is ~1-3 MB, a multi-angle
// capture up to three. On a real uplink that is nowhere near the normal budget.
const isUploadBody = (b: unknown): boolean =>
  typeof b === 'object' && b !== null && ('image_base64' in b || 'images' in b);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Clerk's getToken() performs a real network call to its Frontend API whenever
// the cached session JWT is stale — routinely, not exceptionally. It sat OUTSIDE
// withTimeout, so a captive portal / half-open TCP / DNS blackhole hung it
// forever: request() never reached the deadline it advertises, and every api.*
// call in the app hung with no abort and no rejection. The launch gate awaits
// one of those, so the symptom was an infinite spinner on the first screen with
// no route out. Treat a token we cannot obtain in time as "no token" and let the
// request proceed unauthenticated — the server answers 401, which the app
// already handles, instead of nothing at all.
const TOKEN_TIMEOUT_MS = num(process.env.EXPO_PUBLIC_API_TOKEN_TIMEOUT_MS, 10_000);

function withTokenDeadline(p: Promise<string | null>): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    const timer = setTimeout(() => resolve(null), TOKEN_TIMEOUT_MS);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });
}

/**
 * Bound a request. fetch() has NO default timeout, so a hung connection would
 * spin the UI forever. The signal frees the socket; the explicit reject makes
 * the failure deterministic even if the platform's fetch ignores the signal.
 *
 * ponytail: the deadline covers the fetch call, which on RN resolves only once
 * the whole body has arrived — i.e. the whole request. On a streaming fetch a
 * slow body read would be unbounded; bound the read too if that ever matters.
 */
function withTimeout<T>(p: Promise<T>, ms: number, controller: AbortController, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      controller.abort();
      const e = new Error(`request timed out after ${ms}ms: ${label}`);
      (e as { timedOut?: boolean }).timedOut = true;
      reject(e);
    }, ms);
    p.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

// A request that burned its whole deadline is NOT retried: a second 15s wait
// rarely helps and would triple the worst case a user stares at a spinner
// (the launch gate in src/app/index.tsx awaits a GET). Cheap failures —
// connection refused, 5xx — are the ones worth another go.
const timedOut = (e: unknown): boolean => (e as { timedOut?: boolean } | null)?.timedOut === true;

export class ApiError extends Error {
  status: number;
  /** True when the backend's entitlement gate refused a Pro feature (402).
   *  Callers present the paywall rather than a generic error. */
  upgradeRequired: boolean;
  /** Which feature was gated ('ai_scan' | 'ai_insights' | 'integrations'). */
  feature?: string;
  constructor(status: number, message: string, gate?: { upgradeRequired?: boolean; feature?: string }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.upgradeRequired = gate?.upgradeRequired ?? false;
    this.feature = gate?.feature;
  }
}

/** The backend's error field is normally a string; the entitlement gate sends a
 *  structured object so the client can branch. Normalise both shapes. */
function parseApiError(status: number, error: unknown): ApiError {
  if (error != null && typeof error === 'object') {
    const e = error as { message?: unknown; upgrade_required?: unknown; feature?: unknown };
    return new ApiError(status, typeof e.message === 'string' ? e.message : `HTTP ${status}`, {
      upgradeRequired: e.upgrade_required === true,
      feature: typeof e.feature === 'string' ? e.feature : undefined,
    });
  }
  return new ApiError(status, typeof error === 'string' ? error : `HTTP ${status}`);
}

// --- Auth seam ---------------------------------------------------------------
// The ClerkBridge (src/lib/auth/ClerkBridge.tsx) registers all three when a
// Clerk key is configured:
//   setAuthTokenProvider(getToken)                 — attaches the bearer token
//   setTokenRefreshHandler(getToken skipCache)     — one forced refresh on 401
//   setUnauthorizedHandler(dispatch UNAUTHORIZED)  — machine sign-out path
// With no key (local dev auth mode) none are set: no Authorization header goes
// out and a 401 simply throws.

let tokenProvider: (() => Promise<string | null>) | null = null;
let unauthorizedHandler: (() => void) | null = null;
let tokenRefreshHandler: (() => Promise<string | null>) | null = null;

export function setAuthTokenProvider(fn: () => Promise<string | null>): void {
  tokenProvider = fn;
}

export function setUnauthorizedHandler(fn: () => void): void {
  unauthorizedHandler = fn;
}

/** Register the forced-refresh used on a 401 (Clerk getToken({skipCache:true})).
 *  Resolve a fresh token to retry with, or null when refresh failed. */
export function setTokenRefreshHandler(fn: (() => Promise<string | null>) | null): void {
  tokenRefreshHandler = fn;
}

// --- Request helper ----------------------------------------------------------

type Query = Record<string, string | number | undefined>;

function qs(params?: Query): string {
  const entries = Object.entries(params ?? {}).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

// issue performs one fetch with the given bearer token (null → no header),
// bounded by the request (or upload) deadline.
async function issue(method: string, path: string, body: unknown, extraHeaders: Record<string, string> | undefined, token: string | null): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json', ...extraHeaders };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const controller = new AbortController();
  return withTimeout(
    fetch(BASE_URL + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    }),
    isUploadBody(body) ? UPLOAD_TIMEOUT_MS : TIMEOUT_MS,
    controller,
    `${method} ${path}`,
  );
}

async function request<T>(method: string, path: string, body?: unknown, extraHeaders?: Record<string, string>): Promise<T> {
  const token = tokenProvider ? await withTokenDeadline(tokenProvider()) : null;
  // Retry ONLY idempotent GETs (network failure/timeout or 5xx), with backoff.
  // A write is never retried here: without server-side dedup a replayed POST is
  // a duplicate row. Writes that must survive a flaky network go through the
  // offline queue, which carries an Idempotency-Key (src/lib/offline/queue.ts).
  const retries = method === 'GET' ? GET_RETRIES : 0;
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await issue(method, path, body, extraHeaders, token);
    } catch (e) {
      if (attempt >= retries || timedOut(e)) throw e;
      await sleep(RETRY_BASE_MS * 3 ** attempt);
      continue;
    }

    // 401 → ONE forced token refresh + retry; only a second 401 (or a failed
    // refresh) signs the user out (Phase 13 machine: expired → refresh → signOut).
    if (res.status === 401 && tokenRefreshHandler) {
      // Bounded for the same reason as the initial token fetch above: a hung
      // refresh would strand the request past its deadline.
      const fresh = await withTokenDeadline(tokenRefreshHandler());
      if (fresh) {
        res = await issue(method, path, body, extraHeaders, fresh);
      }
    }
    if (res.status === 401) unauthorizedHandler?.(); // machine sign-out path; still throws below

    if (res.status >= 500 && attempt < retries) {
      await sleep(RETRY_BASE_MS * 3 ** attempt);
      continue;
    }

    let envelope: { data: T; error: unknown } | undefined;
    try {
      envelope = (await res.json()) as { data: T; error: unknown };
    } catch {
      // Non-JSON body (proxy error page, empty body) — fall through to status check.
    }
    if (!res.ok || (envelope?.error != null && envelope.error !== '')) {
      throw parseApiError(res.status, envelope?.error);
    }
    if (envelope === undefined) throw new ApiError(res.status, 'invalid response envelope');
    return envelope.data;
  }
}

const req = {
  get: <T>(path: string, params?: Query) => request<T>('GET', path + qs(params)),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};

// Replay a queued write with its idempotency key (offline queue). The backend's
// partial unique index makes a duplicate key a no-op that returns the existing row.
export function replayQueuedPost<T>(path: string, body: unknown, idempotencyKey: string): Promise<T> {
  return request<T>('POST', path, body, idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined);
}

/** Worth queuing for a later replay: a network failure, or a status that says
 *  "try again" rather than "this request is wrong" — 5xx (server/proxy down,
 *  deploy in progress), 429 (rate limited), 408 (request timeout). A 4xx is
 *  permanent: replaying it would fail identically forever. */
export function isTransient(e: unknown): boolean {
  if (!(e instanceof ApiError)) return true;
  return e.status >= 500 || e.status === 429 || e.status === 408;
}

// --- Types (snake_case, matching the API/schema) -------------------------------

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Onboarding = {
  id?: string; // omitted (omitzero) when no row exists yet
  user_id?: string;
  completed: boolean;
  age: number | null;
  sex: string | null;
  height: number | null;
  height_unit: string | null;
  weight: number | null;
  weight_unit: string | null;
  activity_level: string | null;
  goal: string | null;
  created_at?: string;
};
// The onboarding POST also carries cuisine + dietary selections, which the
// backend uses to seed saved foods and prime the AI brain (they aren't columns
// on the onboarding row itself, so they're additive to the base Onboarding shape).
export type OnboardingInput = Partial<Omit<Onboarding, 'id' | 'user_id' | 'created_at'>> & {
  cuisines?: string[];
  dietary_requirements?: string[];
};

export type FoodLog = {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  meal_type: string | null;
  food_name: string;
  brand: string | null;
  barcode: string | null;
  quantity: number | null;
  unit: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  source: string | null;
  created_at: string;
  // Status lifecycle for scanned logs: analyzing → ready → confirmed (also
  // 'failed'). Non-scan rows are 'confirmed'. scan_results holds the pipeline's
  // per-region breakdown + confidence (present once status is 'ready').
  status?: string;
  scan_results?: ScanResults | null;
};

// One factor contributing to a scan's confidence score.
export type ScanConfidenceFactor = { name: string; points: number; message: string };
export type ScanConfidence = { score: number; label: string; factors?: ScanConfidenceFactor[] };
export type ScanEstimate = {
  region_id: number;
  food_name: string;
  food_category?: string;
  weight_g: number;
  confidence: number;
  macro_source: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fibre_per_100g: number;
  reasoning?: string;
  notes?: string[];
};
// food_logs.scan_results — the pipeline outcome plus its scan_session_id.
export type ScanResults = {
  scan_session_id: string;
  estimates?: ScanEstimate[];
  confidence?: ScanConfidence;
  quality?: unknown;
  geometry?: unknown;
  // Multi-angle capture (Phase 13) — absent on single-image scans.
  image_count?: number;
  angle_agreement?: number | null;
  needs_user_confirmation?: boolean;
  alternate_estimates?: ScanEstimate[];
  reconciliation_note?: string;
  // Repeat-meal detection (Phase 13 signal 5) — set when the identified foods
  // look like a meal the user already logs.
  matched_meal?: { name: string; typical_weights: Record<string, number> } | null;
};

// One shot in a multi-angle scan.
export type ScanAngleImage = { image_base64: string; mime_type?: string; angle: 'top' | 'side' | 'oblique' };

// POST /api/scan/pipeline — kicks off the async 5-pass pipeline; the food_log
// starts as 'analyzing' and the client polls GET /api/food/logs/:id for 'ready'.
export type ScanPipelineStart = { log_id: string; scan_session_id: string; status: string };

// POST /api/scan/label — nutrition-label OCR, returned as per-100g values.
export type ScanLabelResult = {
  food_name: string;
  serving_size_g: number;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fibre_per_100g: number;
  confidence: number;
  macro_source: string;
};
export type FoodLogInput = {
  date?: string;
  meal_type?: string;
  food_name: string;
  brand?: string;
  barcode?: string;
  quantity?: number;
  unit?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fibre?: number;
  source?: string;
};
export type FoodLogPatch = Partial<FoodLogInput>;

export type DailySummary = {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
};

export type FoodSearchResult = {
  food_name: string;
  brand: string; // '' when unknown
  barcode: string;
  calories: number; // per 100 g/ml
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  serving_size: number; // 0 when unknown
  serving_unit: string;
  source: string; // 'off' | 'usda'
};

export type SavedFood = {
  id: string;
  user_id: string;
  food_name: string;
  brand: string | null;
  barcode: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  serving_size: number | null;
  serving_unit: string | null;
  created_at: string;
};
export type SavedFoodInput = Omit<SavedFood, 'id' | 'user_id' | 'created_at' | 'brand' | 'barcode' | 'serving_size' | 'serving_unit'> & {
  brand?: string;
  barcode?: string;
  serving_size?: number;
  serving_unit?: string;
};

export type ScanResult = {
  food_name: string;
  brand: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  confidence: number; // 0..1
  // POST /api/scan creates a scan_sessions row and returns its id so the client
  // can attach it to a later /confirm, /correction, or /feedback call.
  scan_session_id?: string;
};
export type ScanConfirmInput = {
  date?: string; // YYYY-MM-DD, defaults to today server-side
  meal_type?: string;
  food_name: string;
  quantity?: number;
  unit?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fibre?: number;
  scan_session_id?: string; // links the confirmed log back to its scan session
};
export type ScanConfirmed = ScanConfirmInput & { id: string; source: string; user_id: string };

// POST /api/scan/correction — records what the user changed from the scan's
// estimate; the backend logs it and updates EWMA portion calibration.
export type ScanCorrectionInput = {
  scan_session_id: string;
  food_name_original: string;
  food_name_corrected: string;
  weight_original_g: number;
  weight_corrected_g: number;
  calories_original: number;
  calories_corrected: number;
  protein_original: number;
  protein_corrected: number;
  carbs_original: number;
  carbs_corrected: number;
  fat_original: number;
  fat_corrected: number;
  time_to_correction_seconds: number;
  macro_source_original: string;
  // Phase 13 learning: explicit type ('portion'|'identity'|'macro'|'discard' —
  // derived server-side when omitted), meal slot, and local hour of the log.
  correction_type?: string;
  meal_type?: string;
  logged_hour?: number;
};
export type ScanCorrectionResult = { success: boolean; calibration_updated: boolean };

// GET /api/scan/calibration-report — global confidence-calibration health.
export type CalibrationBandStat = {
  predicted_band: string;
  sample_count: number;
  mean_correction_magnitude: number | null;
};
export type CalibrationReport = {
  bands: CalibrationBandStat[];
  warnings: string[];
  discards: {
    discarded_count: number;
    kept_count: number;
    mean_quality_discarded: number | null;
    mean_quality_kept: number | null;
  };
};

// GET /api/scan/calibration
export type CalibrationFactor = { food_name: string; multiplier: number; sample_count: number };
export type ScanAccuracySummary = {
  total_scans: number;
  corrected_count: number;
  avg_correction_magnitude: number;
  most_underestimated: string[];
  most_overestimated: string[];
};
export type ScanCalibration = { factors: CalibrationFactor[]; accuracy_summary: ScanAccuracySummary };

export type ScanFeedbackRating = 'way_off' | 'a_bit_off' | 'pretty_good' | 'spot_on';

// GET /api/food/portion-memory?food_name=
export type PortionMemory = {
  found: boolean;
  typical_weight_g: number | null;
  logged_count: number;
  typical_meal_type: string | null;
};

// POST /api/food/quick-add
export type QuickAddInput = { calories: number; meal_type?: string; date?: string; label?: string };

// --- Meal builder (recipes + saved meals) -------------------------------------

export type RecipeIngredient = {
  food_name: string;
  quantity_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
};
export type Recipe = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fibre: number;
  serving_count: number;
  ingredients: RecipeIngredient[]; // populated on GET /api/recipes/:id
  created_at: string;
  updated_at: string;
};
export type RecipeInput = {
  name: string;
  description?: string;
  serving_count?: number;
  ingredients: RecipeIngredient[];
};
export type RecipePatch = {
  name?: string;
  description?: string;
  serving_count?: number;
  ingredients?: RecipeIngredient[];
};

export type SavedMealItem = {
  food_name: string;
  quantity_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
};
export type SavedMeal = {
  id: string;
  user_id: string;
  name: string;
  meal_type: string | null;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fibre: number;
  items: SavedMealItem[];
  logged_count: number;
  last_logged: string | null;
  auto_generated: boolean;
  created_at: string;
};
export type SavedMealInput = { name: string; meal_type?: string; items: SavedMealItem[] };

// Both recipe-log and saved-meal-log return how many food_logs rows they created.
export type LogEntriesResult = { entries_created: number };

// --- Exercise parameters (Phase 12) ------------------------------------------

// One prompt in a parameter schema.
export type ParameterField = {
  key: string;
  label: string;
  type: 'number' | 'slider' | 'select' | 'toggle';
  unit?: string;
  required: boolean;
  default?: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
};
// exercise_library.parameter_schema — which fields to prompt + the calorie formula.
export type ParameterSchema = { fields: ParameterField[]; calorie_formula: string };
// The values a user logged for an exercise's parameters.
export type LoggedParameters = Record<string, number | string | boolean>;
// POST /api/gym/calories/preview and the create/patch responses — the transparent burn.
export type CalorieResult = {
  calories: number;
  computed_met: number;
  formula: string;
  inputs: LoggedParameters;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
};

export type GymExercise = {
  id: string;
  session_id: string;
  name: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  weight_unit: string | null;
  rest_seconds: number | null;
  notes: string | null;
  rpe?: number | null;
  parameters?: LoggedParameters | null;
  calorie_formula?: string | null;
  computed_met?: number | null;
  calorie_result?: CalorieResult | null; // computed on write only
};
export type GymExerciseInput = {
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  weight_unit?: string;
  rest_seconds?: number;
  notes?: string;
  parameters?: LoggedParameters;
  rpe?: number;
};

export type GymSession = {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  name: string | null;
  notes: string | null;
  duration_minutes: number | null;
  created_at: string;
  exercises?: GymExercise[];
};
export type GymSessionInput = {
  date: string; // YYYY-MM-DD — required: POST /api/gym/sessions 400s without it
  name?: string;
  notes?: string;
  duration_minutes?: number;
};

export type GymStreak = {
  current_streak: number;
  longest_streak: number;
  last_gym_date: string | null;
  freeze_used: boolean;
};

// --- Gym schedule (exercise library, templates, weekly schedule, adherence) ---

export type ExerciseLibraryItem = {
  id: string;
  name: string;
  muscle_group_primary: string;
  muscle_groups_secondary: string[];
  category: string;
  exercise_type: string; // 'strength' | 'cardio'
  equipment: string;
  difficulty: string;
  description: string;
  met_value: number; // Metabolic Equivalent of Task, for calorie-burn math
  parameter_schema?: ParameterSchema | null; // Phase 12: which params to prompt for
};

export type TemplateExercise = {
  id: string;
  template_id: string;
  exercise_id: string;
  planned_sets: number | null;
  planned_reps: number | null;
  planned_weight: number | null;
  planned_weight_unit: string | null;
  planned_duration_minutes: number | null;
  rest_seconds: number | null;
  sort_order: number;
  created_at: string;
  exercise?: ExerciseLibraryItem; // joined library detail
};

export type WorkoutTemplate = {
  id: string;
  user_id: string;
  name: string;
  estimated_duration_minutes: number | null;
  created_at: string;
  updated_at: string;
  exercises: TemplateExercise[];
};

export type ScheduleDay = {
  day_of_week: number;
  day_name: string;
  is_rest_day: boolean;
  template_id: string | null;
  template: WorkoutTemplate | null;
};
export type WeeklySchedule = ScheduleDay[]; // always 7 rows, day 0..6

export type TodayWorkout = {
  day_of_week: number;
  day_name: string;
  is_rest_day: boolean;
  template: WorkoutTemplate | null;
  exercises: TemplateExercise[];
  already_checked_in: boolean;
  session_id: string | null;
};

export type AdherenceResult = {
  scheduled_date: string;
  template_id: string | null;
  checked_in: boolean;
  completion_rate: number;
  customized: boolean;
};

export type GymPatterns = {
  most_trained_muscles: string[];
  least_trained_muscles: string[];
  avg_sessions_per_week: number;
  adherence_rate: number;
  customization_rate: number;
  most_missed_day: string | null;
  muscle_volume_map: Record<string, number> | null;
  last_rebuilt: string | null;
};

export type ProgressEntry = { date: string; weight: number | null; reps: number | null; sets: number | null };
export type PersonalBest = { weight: number; reps: number | null; date: string };
export type ExerciseProgress = {
  exercise_name: string;
  history: ProgressEntry[];
  personal_best: PersonalBest | null;
  trend: string; // 'improving' | 'declining' | 'maintaining' | 'insufficient_data'
};

// Input shapes.
export type TemplateExerciseInput = {
  exercise_id: string;
  planned_sets?: number;
  planned_reps?: number;
  planned_weight?: number;
  planned_weight_unit?: string;
  planned_duration_minutes?: number;
  rest_seconds?: number;
  sort_order?: number;
};
export type TemplateInput = {
  name: string;
  estimated_duration_minutes?: number;
  exercises: TemplateExerciseInput[];
};
export type TemplatePatch = { name?: string; estimated_duration_minutes?: number };
export type ExerciseFilters = { category?: string; muscle?: string; type?: string; equipment?: string; q?: string };

// --- Energy balance (intake vs BMR + exercise vs goal) ------------------------

// GET /api/energy-balance?date= — pointer fields are null when their input is
// missing (no body stats → no bmr/total/net; no goal → no target/variance).
export type EnergyBalance = {
  date: string;
  calories_in: number;
  calories_out_bmr: number | null;
  calories_out_exercise: number;
  calories_out_total: number | null;
  net_balance: number | null;
  target: number | null;
  variance: number | null;
  status: string; // 'deficit' | 'surplus' | 'on_target' | 'no_target'
};

// GET /api/energy-balance/week — last 7 days (oldest first) + rolled-up averages.
export type WeeklyEnergyBalance = {
  days: EnergyBalance[];
  weekly_average_in: number;
  weekly_average_out: number;
  weekly_net: number;
};

// --- Integrations (Strava / WHOOP OAuth) --------------------------------------

// GET /api/integrations — per-provider status (never carries tokens).
export type IntegrationConnection = {
  provider: string; // 'strava' | 'whoop'
  connected: boolean;
  last_sync_at: string | null;
  external_user_id?: string;
};

// POST /api/integrations/:provider/sync
export type IntegrationSyncResult = { imported: number; skipped: number };

export type Goals = {
  id: string;
  user_id: string;
  calorie_target: number | null;
  protein_target: number | null;
  carb_target: number | null;
  fat_target: number | null;
  fibre_target: number | null;
  weight_goal: string | null;
  target_weight: number | null;
  weight_unit: string | null;
  activity_level: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
};
export type GoalsInput = Partial<Omit<Goals, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type BodyWeight = {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  weight: number;
  unit: string;
  notes: string | null;
  created_at: string;
};
export type BodyWeightInput = { date: string; weight: number; unit?: string; notes?: string };

// POST /api/analytics/events — one first-party product event (batched, max 50
// per request). No user_id: the backend derives it from the auth token.
export type AnalyticsEventInput = {
  name: string;
  properties?: Record<string, string | number | boolean>;
  session_id: string;
  client_ts: string; // RFC3339
};

export type SubscriptionStatus = {
  status: string; // 'none' | 'trialing' | 'active' | 'cancelled' | 'expired' | 'past_due'
  is_active: boolean;
  platform: string | null;
  plan_interval: string | null;
  expires_at: string | null;
};

// The computed pattern document (backend ai.Brain — rich, evolving shape).
// `state: 'not_enough_data'` replaces the body when < 3 distinct logged days.
export type AiBrain = { last_rebuilt?: string; state?: 'not_enough_data'; [key: string]: unknown };

export type AiInsight = {
  id: string;
  type: string;
  title: string;
  body: string;
  created_at: string;
};

// Raw backend shapes (the real endpoints). The rich UI-facing types below are
// what screens consume; the ai.* client functions map raw → rich.
export type MorningBriefResponse = { brief?: string; state?: 'not_enough_data' };
export type AiAnswer = { answer?: string; state?: 'not_enough_data' };

// ---------------------------------------------------------------------------
// AI brain — UI-facing types. NOTE: the real backend exposes GET
// /api/ai/morning-brief (a string), GET /api/ai/insights, POST
// /api/ai/insights/:id/dismiss, GET /api/ai/brain, and POST /api/ai/query.
// The richer per-brief metadata (id/category/engaged), the PATCH mark-shown/
// engaged calls, the /api/ai/anomalies feed, and GET /api/ai/profile do NOT
// exist server-side — the client maps what exists and degrades the rest to
// empty/null (see the ai.* functions). See DECISIONS.md.
// ---------------------------------------------------------------------------

export type MorningBrief = {
  id: string;
  brief: string;
  brief_date: string;
  category: string | null;
  shown_at: string | null;
  engaged: boolean;
  generated_at: string;
};

export type AIInsight = {
  id: string;
  type: string | null;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  shown_at: string | null;
  dismissed: boolean;
  created_at: string;
};

export type AIAnomaly = {
  id: string;
  title?: string;
  body?: string;
  dismissed: boolean;
  created_at: string;
  [key: string]: unknown; // backend shape may vary
};

export type AIBrainProfile = {
  typical_daily_calories: number | null;
  typical_macros: Record<string, number> | null;
  goal_adherence_score: number | null;
  eating_patterns: Record<string, unknown> | null;
  gym_patterns: Record<string, unknown> | null;
  scan_accuracy_profile: Record<string, unknown> | null;
  last_rebuilt: string | null;
  not_enough_data?: boolean;
};

// --- AI brain mapping helpers --------------------------------------------------

const asNumber = (v: unknown): number | null => (typeof v === 'number' ? v : null);
const asRecord = (v: unknown): Record<string, unknown> | null =>
  v !== null && typeof v === 'object' ? (v as Record<string, unknown>) : null;

// mapBrainToProfile turns the loose AiBrain document into the typed profile,
// coercing each field defensively (the brain is `[key]: unknown`).
function mapBrainToProfile(b: AiBrain): AIBrainProfile {
  if (b.state === 'not_enough_data') {
    return {
      typical_daily_calories: null,
      typical_macros: null,
      goal_adherence_score: null,
      eating_patterns: null,
      gym_patterns: null,
      scan_accuracy_profile: null,
      last_rebuilt: null,
      not_enough_data: true,
    };
  }
  return {
    typical_daily_calories: asNumber(b['typical_daily_calories']),
    typical_macros: asRecord(b['typical_macros']) as Record<string, number> | null,
    goal_adherence_score: asNumber(b['goal_adherence_score']),
    eating_patterns: asRecord(b['eating_patterns']),
    gym_patterns: asRecord(b['gym_patterns']),
    scan_accuracy_profile: asRecord(b['scan_accuracy_profile']),
    last_rebuilt: typeof b.last_rebuilt === 'string' ? b.last_rebuilt : null,
    not_enough_data: false,
  };
}

// --- Endpoints -----------------------------------------------------------------

// GET /api/export — the user's own data, one array of rows per table.
type ExportDocument = Record<string, unknown>;

export const api = {
  profile: {
    get: () => req.get<Profile>('/api/profile'),
    update: (patch: { display_name?: string; avatar_url?: string }) => req.patch<Profile>('/api/profile', patch),
    // Permanently deletes the account (Clerk identity + cascade to every user table).
    delete: () => req.del<{ deleted: boolean }>('/api/profile'),
    // Everything the user owns, keyed by table (GDPR access / privacy posture).
    export: () => req.get<ExportDocument>('/api/export'),
  },

  onboarding: {
    get: () => req.get<Onboarding>('/api/onboarding'),
    post: (input: OnboardingInput) => req.post<Onboarding>('/api/onboarding', input),
  },

  foodLogs: {
    list: (params?: { date?: string; mealType?: string }) =>
      req.get<FoodLog[]>('/api/food/logs', { date: params?.date, meal_type: params?.mealType }),
    create: (input: FoodLogInput) => req.post<FoodLog>('/api/food/logs', input),
    update: (id: string, patch: FoodLogPatch) => req.patch<FoodLog>(`/api/food/logs/${id}`, patch),
    delete: (id: string) => req.del<{ deleted: boolean }>(`/api/food/logs/${id}`),
    get: (id: string) => req.get<FoodLog>(`/api/food/logs/${encodeURIComponent(id)}`),
    summary: (date?: string) => req.get<DailySummary>('/api/food/summary', { date }),
    quickAdd: (input: QuickAddInput) => req.post<FoodLog>('/api/food/quick-add', input),
    portionMemory: (foodName: string) =>
      req.get<PortionMemory>('/api/food/portion-memory', { food_name: foodName }),
  },

  foodSearch: {
    search: (q: string) => req.get<FoodSearchResult[]>('/api/food/search', { q }),
    barcode: (code: string) => req.get<FoodSearchResult>(`/api/food/barcode/${encodeURIComponent(code)}`),
  },

  savedFoods: {
    list: () => req.get<SavedFood[]>('/api/food/saved'),
    create: (input: SavedFoodInput) => req.post<SavedFood>('/api/food/saved', input),
    delete: (id: string) => req.del<{ deleted: boolean }>(`/api/food/saved/${id}`),
  },

  scan: {
    analyze: (imageBase64: string, mimeType = 'image/jpeg') =>
      req.post<ScanResult>('/api/scan', { image_base64: imageBase64, mime_type: mimeType }),
    // Async 5-pass pipeline: returns immediately with a log id to poll.
    pipeline: (imageBase64: string, mimeType = 'image/jpeg') =>
      req.post<ScanPipelineStart>('/api/scan/pipeline', { image_base64: imageBase64, mime_type: mimeType }),
    // Multi-angle variant (1–3 shots with angle hints); same async contract.
    pipelineMulti: (images: ScanAngleImage[]) =>
      req.post<ScanPipelineStart>('/api/scan/pipeline', { images }),
    confirm: (input: ScanConfirmInput) => req.post<ScanConfirmed>('/api/scan/confirm', input),
    // Nutrition-label OCR → per-100g values. 503 when GEMINI_API_KEY unset.
    label: (imageBase64: string, mimeType = 'image/jpeg') =>
      req.post<ScanLabelResult>('/api/scan/label', { image_base64: imageBase64, mime_type: mimeType }),
    correction: (input: ScanCorrectionInput) => req.post<ScanCorrectionResult>('/api/scan/correction', input),
    calibration: () => req.get<ScanCalibration>('/api/scan/calibration'),
    calibrationReport: () => req.get<CalibrationReport>('/api/scan/calibration-report'),
    feedback: (scanSessionId: string, rating: ScanFeedbackRating) =>
      req.post<{ updated: boolean }>('/api/scan/feedback', { scan_session_id: scanSessionId, rating }),
  },

  savedMeals: {
    list: () => req.get<SavedMeal[]>('/api/saved-meals'),
    create: (input: SavedMealInput) => req.post<SavedMeal>('/api/saved-meals', input),
    log: (id: string, mealType: string, date: string) =>
      req.post<LogEntriesResult>(`/api/saved-meals/${id}/log`, { meal_type: mealType, date }),
    delete: (id: string) => req.del<{ deleted: boolean }>(`/api/saved-meals/${id}`),
  },

  recipes: {
    list: () => req.get<Recipe[]>('/api/recipes'),
    get: (id: string) => req.get<Recipe>(`/api/recipes/${id}`),
    create: (input: RecipeInput) => req.post<Recipe>('/api/recipes', input),
    update: (id: string, patch: RecipePatch) => req.patch<Recipe>(`/api/recipes/${id}`, patch),
    delete: (id: string) => req.del<{ deleted: boolean }>(`/api/recipes/${id}`),
    log: (id: string, servings: number, mealType: string, date: string) =>
      req.post<LogEntriesResult>(`/api/recipes/${id}/log`, { servings, meal_type: mealType, date }),
  },

  gym: {
    listSessions: (params?: { from?: string; to?: string }) => req.get<GymSession[]>('/api/gym/sessions', params),
    createSession: (input: GymSessionInput) => req.post<GymSession>('/api/gym/sessions', input),
    updateSession: (id: string, patch: Partial<GymSessionInput>) => req.patch<GymSession>(`/api/gym/sessions/${id}`, patch),
    deleteSession: (id: string) => req.del<{ deleted: boolean }>(`/api/gym/sessions/${id}`),
    addExercise: (sessionId: string, input: GymExerciseInput) =>
      req.post<GymExercise>(`/api/gym/sessions/${sessionId}/exercises`, input),
    updateExercise: (id: string, patch: Partial<GymExerciseInput>) =>
      req.patch<GymExercise>(`/api/gym/exercises/${id}`, patch),
    deleteExercise: (id: string) => req.del<{ deleted: boolean }>(`/api/gym/exercises/${id}`),
    streak: () => req.get<GymStreak>('/api/gym/streak'),
    freeze: () => req.post<GymStreak>('/api/gym/streak/freeze'),

    // --- Exercise parameters (Phase 12) ---
    // Live calorie preview for a set of parameters, without persisting anything.
    previewCalories: (exerciseId: string, parameters: LoggedParameters) =>
      req.post<CalorieResult>('/api/gym/calories/preview', { exercise_id: exerciseId, parameters }),
    // The user's most recent logged parameters for an exercise (for form pre-fill).
    lastLogged: (exerciseId: string) =>
      req.get<{ parameters: LoggedParameters | null }>(`/api/gym/last-logged/${encodeURIComponent(exerciseId)}`),

    // --- Schedule / templates / adherence (Phase 7) ---
    getExercises: (filters?: ExerciseFilters) =>
      req.get<ExerciseLibraryItem[]>('/api/gym/exercises', filters),
    getExerciseById: (id: string) => req.get<ExerciseLibraryItem>(`/api/gym/exercises/${encodeURIComponent(id)}`),
    getTemplates: () => req.get<WorkoutTemplate[]>('/api/gym/templates'),
    createTemplate: (data: TemplateInput) => req.post<WorkoutTemplate>('/api/gym/templates', data),
    getTemplate: (id: string) => req.get<WorkoutTemplate>(`/api/gym/templates/${id}`),
    updateTemplate: (id: string, patch: TemplatePatch) => req.patch<WorkoutTemplate>(`/api/gym/templates/${id}`, patch),
    deleteTemplate: (id: string) => req.del<{ deleted: boolean }>(`/api/gym/templates/${id}`),
    addExerciseToTemplate: (templateId: string, data: TemplateExerciseInput) =>
      req.post<TemplateExercise>(`/api/gym/templates/${templateId}/exercises`, data),
    updateTemplateExercise: (id: string, data: Partial<TemplateExerciseInput>) =>
      req.patch<TemplateExercise>(`/api/gym/template-exercises/${id}`, data),
    removeTemplateExercise: (id: string) => req.del<{ deleted: boolean }>(`/api/gym/template-exercises/${id}`),
    getSchedule: () => req.get<WeeklySchedule>('/api/gym/schedule'),
    setScheduleDay: (day: number, templateId: string | null) =>
      req.put<WeeklySchedule>(`/api/gym/schedule/${day}`, { template_id: templateId }),
    setFullSchedule: (schedule: { day_of_week: number; template_id: string | null }[]) =>
      req.put<WeeklySchedule>('/api/gym/schedule', { schedule }),
    getToday: () => req.get<TodayWorkout>('/api/gym/today'),
    completeSession: (sessionId: string, completionRate?: number) =>
      req.post<AdherenceResult>(`/api/gym/sessions/${sessionId}/complete`, { completion_rate: completionRate }),
    getExerciseProgress: (name: string, limit?: number) =>
      req.get<ExerciseProgress>(`/api/gym/progress/${encodeURIComponent(name)}`, { limit }),
    getGymPatterns: () => req.get<GymPatterns | null>('/api/gym/patterns'),
  },

  energy: {
    getBalance: (date?: string) => req.get<EnergyBalance>('/api/energy-balance', { date }),
    // end = the client's LOCAL date anchoring the 7-day window (server clock
    // may sit in a different calendar day near midnight).
    getWeek: (end?: string) => req.get<WeeklyEnergyBalance>('/api/energy-balance/week', { end }),
  },

  integrations: {
    list: () => req.get<IntegrationConnection[]>('/api/integrations'),
    // connect returns the provider's OAuth URL to open in a browser.
    connectStrava: () => req.get<{ url: string }>('/api/integrations/strava/connect'),
    connectWhoop: () => req.get<{ url: string }>('/api/integrations/whoop/connect'),
    syncStrava: () => req.post<IntegrationSyncResult>('/api/integrations/strava/sync'),
    syncWhoop: () => req.post<IntegrationSyncResult>('/api/integrations/whoop/sync'),
    disconnect: (provider: string) => req.del<{ disconnected: boolean }>(`/api/integrations/${provider}`),
  },

  goals: {
    get: () => req.get<Goals>('/api/goals'),
    put: (input: GoalsInput) => req.put<Goals>('/api/goals', input),
  },

  bodyWeight: {
    // No range params: the backend returns every row for the user (goals.go listBodyWeight reads no query).
    list: () => req.get<BodyWeight[]>('/api/body-weight'),
    create: (input: BodyWeightInput) => req.post<BodyWeight>('/api/body-weight', input),
    delete: (id: string) => req.del<{ deleted: boolean }>(`/api/body-weight/${id}`),
  },

  subscription: {
    get: () => req.get<SubscriptionStatus>('/api/subscription'),
  },

  analytics: {
    events: (events: AnalyticsEventInput[]) =>
      req.post<{ accepted: number }>('/api/analytics/events', { events }),
  },

  ai: {
    // Raw accessors (kept for completeness; screens use the mapped ones below).
    brain: () => req.get<AiBrain>('/api/ai/brain'),
    rebuild: () => req.post<AiBrain>('/api/ai/brain/rebuild'),
    morningBriefRaw: () => req.get<MorningBriefResponse>('/api/ai/morning-brief'),

    // AI-partner consent (5.1.2(i)). The server keeps its own record because a
    // device flag cannot gate the backend's background rebuild sweep.
    getConsent: () => req.get<{ consented: boolean; consented_at: string | null }>('/api/ai/consent'),
    setConsent: () => req.post<{ consented: boolean }>('/api/ai/consent'),
    revokeConsent: () => req.del<{ consented: boolean }>('/api/ai/consent'),

    // --- UI-facing (mapped) accessors. Real endpoints are mapped; the ones the
    // backend doesn't expose (mark-shown/engaged, anomalies) degrade to no-op/[]
    // so the UI wiring is complete and the app still runs with no backend. ---
    getMorningBrief: (): Promise<MorningBrief | null> =>
      req
        .get<MorningBriefResponse>('/api/ai/morning-brief')
        .then((r) => {
          if (!r.brief || r.state === 'not_enough_data') return null;
          const now = new Date();
          const today = now.toISOString().slice(0, 10);
          return {
            id: `brief-${today}`,
            brief: r.brief,
            brief_date: today,
            category: null,
            shown_at: null,
            engaged: false,
            generated_at: now.toISOString(),
          } satisfies MorningBrief;
        })
        .catch(() => null),
    // No PATCH endpoint exists server-side — best-effort no-ops.
    markBriefShown: (_id: string): Promise<void> => Promise.resolve(),
    markBriefEngaged: (_id: string): Promise<void> => Promise.resolve(),

    getInsights: (): Promise<AIInsight[]> =>
      req
        .get<AiInsight[]>('/api/ai/insights')
        .then((rows) =>
          rows.map(
            (r): AIInsight => ({
              id: r.id,
              type: r.type ?? null,
              title: r.title,
              body: r.body,
              data: null,
              shown_at: null,
              dismissed: false,
              created_at: r.created_at,
            }),
          ),
        )
        .catch(() => []),
    dismissInsight: (id: string): Promise<void> =>
      req.post<{ dismissed: boolean }>(`/api/ai/insights/${id}/dismiss`).then(() => undefined),

    // No /api/ai/anomalies endpoint exists — resolves empty against the real
    // backend, so the anomaly banner/cards simply never appear.
    getAnomalies: (): Promise<AIAnomaly[]> => req.get<AIAnomaly[]>('/api/ai/anomalies').catch(() => []),
    dismissAnomaly: (id: string): Promise<void> =>
      req
        .post<unknown>(`/api/ai/anomalies/${id}/dismiss`)
        .then(() => undefined)
        .catch(() => undefined),

    // Maps GET /api/ai/brain (the real endpoint; the task's /api/ai/profile
    // doesn't exist) → AIBrainProfile, honouring the not_enough_data state.
    getProfile: (): Promise<AIBrainProfile | null> =>
      req.get<AiBrain>('/api/ai/brain').then(mapBrainToProfile).catch(() => null),

    // 503 (ANTHROPIC_API_KEY unset) throws an ApiError the caller inspects.
    query: (question: string, screen?: string): Promise<AiAnswer> =>
      req.post<AiAnswer>('/api/ai/query', { question, screen }),
  },
};
