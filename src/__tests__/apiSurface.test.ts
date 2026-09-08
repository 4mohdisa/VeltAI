// Path/method contract for every plain api.* endpoint wrapper. fetch is mocked;
// no network. Envelope/auth/401 behaviour, goals.get, foodLogs.summary,
// energy.getWeek and integrations.list are already covered by apiClient.test.ts
// and are not repeated here. ai.* is excluded: its accessors map/degrade
// responses (covered by aiFallback.test.ts), not a raw path/method contract.
import { api } from '@/lib/api';

const BASE = 'http://localhost:8080';

let fetchFn: jest.Mock;

beforeEach(() => {
  fetchFn = jest.fn(() =>
    Promise.resolve({ ok: true, status: 200, json: async () => ({ data: {}, error: null }) }),
  );
  (globalThis as unknown as { fetch: unknown }).fetch = fetchFn;
});

type Case = {
  name: string;
  call: () => Promise<unknown>;
  method: string;
  path: string; // expected path incl. query string
  body?: unknown; // expected parsed JSON body; omitted = no body must be sent
};

const cases: Case[] = [
  // --- profile -----------------------------------------------------------------
  { name: 'profile.get', call: () => api.profile.get(), method: 'GET', path: '/api/profile' },
  {
    name: 'profile.update',
    call: () => api.profile.update({ display_name: 'Mo' }),
    method: 'PATCH',
    path: '/api/profile',
    body: { display_name: 'Mo' },
  },
  { name: 'profile.delete', call: () => api.profile.delete(), method: 'DELETE', path: '/api/profile' },

  // --- foodLogs ----------------------------------------------------------------
  { name: 'foodLogs.list (no params)', call: () => api.foodLogs.list(), method: 'GET', path: '/api/food/logs' },
  {
    name: 'foodLogs.list (date + mealType)',
    call: () => api.foodLogs.list({ date: '2026-07-01', mealType: 'lunch' }),
    method: 'GET',
    path: '/api/food/logs?date=2026-07-01&meal_type=lunch',
  },
  {
    name: 'foodLogs.create',
    call: () => api.foodLogs.create({ food_name: 'oats', calories: 380 }),
    method: 'POST',
    path: '/api/food/logs',
    body: { food_name: 'oats', calories: 380 },
  },
  {
    name: 'foodLogs.update',
    call: () => api.foodLogs.update('fl1', { calories: 400 }),
    method: 'PATCH',
    path: '/api/food/logs/fl1',
    body: { calories: 400 },
  },
  { name: 'foodLogs.delete', call: () => api.foodLogs.delete('fl1'), method: 'DELETE', path: '/api/food/logs/fl1' },
  { name: 'foodLogs.get', call: () => api.foodLogs.get('fl 1'), method: 'GET', path: '/api/food/logs/fl%201' },
  { name: 'foodLogs.days (no range)', call: () => api.foodLogs.days(), method: 'GET', path: '/api/food/days' },
  {
    name: 'foodLogs.days (from + to)',
    call: () => api.foodLogs.days({ from: '2026-09-01', to: '2026-09-30' }),
    method: 'GET',
    path: '/api/food/days?from=2026-09-01&to=2026-09-30',
  },
  {
    name: 'foodLogs.quickAdd',
    call: () => api.foodLogs.quickAdd({ calories: 250, meal_type: 'snack' }),
    method: 'POST',
    path: '/api/food/quick-add',
    body: { calories: 250, meal_type: 'snack' },
  },
  {
    name: 'foodLogs.portionMemory',
    call: () => api.foodLogs.portionMemory('oats'),
    method: 'GET',
    path: '/api/food/portion-memory?food_name=oats',
  },

  // --- foodSearch --------------------------------------------------------------
  { name: 'foodSearch.search', call: () => api.foodSearch.search('milk'), method: 'GET', path: '/api/food/search?q=milk' },
  {
    name: 'foodSearch.barcode (encodes)',
    call: () => api.foodSearch.barcode('93 33'),
    method: 'GET',
    path: '/api/food/barcode/93%2033',
  },

  // --- savedFoods --------------------------------------------------------------
  { name: 'savedFoods.list', call: () => api.savedFoods.list(), method: 'GET', path: '/api/food/saved' },
  {
    name: 'savedFoods.create',
    call: () => api.savedFoods.create({ food_name: 'egg', calories: 155, protein: 13, carbs: 1, fat: 11, fibre: 0 }),
    method: 'POST',
    path: '/api/food/saved',
    body: { food_name: 'egg', calories: 155, protein: 13, carbs: 1, fat: 11, fibre: 0 },
  },
  { name: 'savedFoods.delete', call: () => api.savedFoods.delete('sf1'), method: 'DELETE', path: '/api/food/saved/sf1' },

  // --- scan --------------------------------------------------------------------
  {
    name: 'scan.analyze (default mime)',
    call: () => api.scan.analyze('b64'),
    method: 'POST',
    path: '/api/scan',
    body: { image_base64: 'b64', mime_type: 'image/jpeg' },
  },
  {
    name: 'scan.pipeline',
    call: () => api.scan.pipeline('b64', 'image/png'),
    method: 'POST',
    path: '/api/scan/pipeline',
    body: { image_base64: 'b64', mime_type: 'image/png' },
  },
  {
    name: 'scan.pipelineMulti',
    call: () =>
      api.scan.pipelineMulti([
        { image_base64: 'a', angle: 'top' },
        { image_base64: 'b', angle: 'side', mime_type: 'image/png' },
      ]),
    method: 'POST',
    path: '/api/scan/pipeline',
    body: { images: [{ image_base64: 'a', angle: 'top' }, { image_base64: 'b', angle: 'side', mime_type: 'image/png' }] },
  },
  {
    name: 'scan.confirm',
    call: () => api.scan.confirm({ food_name: 'toast', scan_session_id: 'ss1' }),
    method: 'POST',
    path: '/api/scan/confirm',
    body: { food_name: 'toast', scan_session_id: 'ss1' },
  },
  {
    name: 'scan.label',
    call: () => api.scan.label('b64'),
    method: 'POST',
    path: '/api/scan/label',
    body: { image_base64: 'b64', mime_type: 'image/jpeg' },
  },
  {
    name: 'scan.correction',
    call: () =>
      api.scan.correction({
        scan_session_id: 'ss1',
        food_name_original: 'rice',
        food_name_corrected: 'fried rice',
        weight_original_g: 100,
        weight_corrected_g: 150,
        calories_original: 130,
        calories_corrected: 250,
        protein_original: 3,
        protein_corrected: 6,
        carbs_original: 28,
        carbs_corrected: 30,
        fat_original: 0,
        fat_corrected: 9,
        time_to_correction_seconds: 12,
        macro_source_original: 'usda',
      }),
    method: 'POST',
    path: '/api/scan/correction',
    body: {
      scan_session_id: 'ss1',
      food_name_original: 'rice',
      food_name_corrected: 'fried rice',
      weight_original_g: 100,
      weight_corrected_g: 150,
      calories_original: 130,
      calories_corrected: 250,
      protein_original: 3,
      protein_corrected: 6,
      carbs_original: 28,
      carbs_corrected: 30,
      fat_original: 0,
      fat_corrected: 9,
      time_to_correction_seconds: 12,
      macro_source_original: 'usda',
    },
  },
  { name: 'scan.calibration', call: () => api.scan.calibration(), method: 'GET', path: '/api/scan/calibration' },
  {
    name: 'scan.calibrationReport',
    call: () => api.scan.calibrationReport(),
    method: 'GET',
    path: '/api/scan/calibration-report',
  },
  {
    name: 'scan.feedback',
    call: () => api.scan.feedback('ss1', 'spot_on'),
    method: 'POST',
    path: '/api/scan/feedback',
    body: { scan_session_id: 'ss1', rating: 'spot_on' },
  },

  // --- savedMeals --------------------------------------------------------------
  { name: 'savedMeals.list', call: () => api.savedMeals.list(), method: 'GET', path: '/api/saved-meals' },
  {
    name: 'savedMeals.create',
    call: () => api.savedMeals.create({ name: 'Brekky', items: [] }),
    method: 'POST',
    path: '/api/saved-meals',
    body: { name: 'Brekky', items: [] },
  },
  {
    name: 'savedMeals.log',
    call: () => api.savedMeals.log('sm1', 'breakfast', '2026-07-01'),
    method: 'POST',
    path: '/api/saved-meals/sm1/log',
    body: { meal_type: 'breakfast', date: '2026-07-01' },
  },
  { name: 'savedMeals.delete', call: () => api.savedMeals.delete('sm1'), method: 'DELETE', path: '/api/saved-meals/sm1' },

  // --- recipes -----------------------------------------------------------------
  { name: 'recipes.list', call: () => api.recipes.list(), method: 'GET', path: '/api/recipes' },
  { name: 'recipes.get', call: () => api.recipes.get('r1'), method: 'GET', path: '/api/recipes/r1' },
  {
    name: 'recipes.create',
    call: () => api.recipes.create({ name: 'Curry', ingredients: [] }),
    method: 'POST',
    path: '/api/recipes',
    body: { name: 'Curry', ingredients: [] },
  },
  {
    name: 'recipes.update',
    call: () => api.recipes.update('r1', { serving_count: 4 }),
    method: 'PATCH',
    path: '/api/recipes/r1',
    body: { serving_count: 4 },
  },
  { name: 'recipes.delete', call: () => api.recipes.delete('r1'), method: 'DELETE', path: '/api/recipes/r1' },
  {
    name: 'recipes.log',
    call: () => api.recipes.log('r1', 2, 'dinner', '2026-07-01'),
    method: 'POST',
    path: '/api/recipes/r1/log',
    body: { servings: 2, meal_type: 'dinner', date: '2026-07-01' },
  },

  // --- gym: sessions + exercises ----------------------------------------------
  { name: 'gym.listSessions (no params)', call: () => api.gym.listSessions(), method: 'GET', path: '/api/gym/sessions' },
  {
    name: 'gym.listSessions (range)',
    call: () => api.gym.listSessions({ from: '2026-07-01', to: '2026-07-07' }),
    method: 'GET',
    path: '/api/gym/sessions?from=2026-07-01&to=2026-07-07',
  },
  {
    name: 'gym.createSession',
    call: () => api.gym.createSession({ date: '2026-07-01', name: 'Push' }),
    method: 'POST',
    path: '/api/gym/sessions',
    body: { date: '2026-07-01', name: 'Push' },
  },
  {
    name: 'gym.updateSession',
    call: () => api.gym.updateSession('s1', { notes: 'pb day' }),
    method: 'PATCH',
    path: '/api/gym/sessions/s1',
    body: { notes: 'pb day' },
  },
  { name: 'gym.deleteSession', call: () => api.gym.deleteSession('s1'), method: 'DELETE', path: '/api/gym/sessions/s1' },
  {
    name: 'gym.addExercise (parameters + rpe passthrough)',
    call: () =>
      api.gym.addExercise('s1', { name: 'Row', sets: 3, reps: 8, parameters: { incline: 5, speed_kmh: 8 }, rpe: 7 }),
    method: 'POST',
    path: '/api/gym/sessions/s1/exercises',
    body: { name: 'Row', sets: 3, reps: 8, parameters: { incline: 5, speed_kmh: 8 }, rpe: 7 },
  },
  {
    name: 'gym.updateExercise (parameters + rpe passthrough)',
    call: () => api.gym.updateExercise('e1', { rpe: 9, parameters: { duration_min: 30 } }),
    method: 'PATCH',
    path: '/api/gym/exercises/e1',
    body: { rpe: 9, parameters: { duration_min: 30 } },
  },
  { name: 'gym.deleteExercise', call: () => api.gym.deleteExercise('e1'), method: 'DELETE', path: '/api/gym/exercises/e1' },
  { name: 'gym.streak', call: () => api.gym.streak(), method: 'GET', path: '/api/gym/streak' },
  { name: 'gym.freeze', call: () => api.gym.freeze(), method: 'POST', path: '/api/gym/streak/freeze' },
  {
    name: 'gym.previewCalories',
    call: () => api.gym.previewCalories('ex1', { incline: 2, duration_min: 20 }),
    method: 'POST',
    path: '/api/gym/calories/preview',
    body: { exercise_id: 'ex1', parameters: { incline: 2, duration_min: 20 } },
  },
  { name: 'gym.lastLogged', call: () => api.gym.lastLogged('ex1'), method: 'GET', path: '/api/gym/last-logged/ex1' },

  // --- gym: library / templates / schedule -------------------------------------
  { name: 'gym.getExercises (no filters)', call: () => api.gym.getExercises(), method: 'GET', path: '/api/gym/exercises' },
  {
    name: 'gym.getExercises (filters)',
    call: () => api.gym.getExercises({ category: 'strength', q: 'press' }),
    method: 'GET',
    path: '/api/gym/exercises?category=strength&q=press',
  },
  { name: 'gym.getExerciseById', call: () => api.gym.getExerciseById('ex1'), method: 'GET', path: '/api/gym/exercises/ex1' },
  { name: 'gym.getTemplates', call: () => api.gym.getTemplates(), method: 'GET', path: '/api/gym/templates' },
  {
    name: 'gym.createTemplate',
    call: () => api.gym.createTemplate({ name: 'Legs', exercises: [{ exercise_id: 'ex1', planned_sets: 3 }] }),
    method: 'POST',
    path: '/api/gym/templates',
    body: { name: 'Legs', exercises: [{ exercise_id: 'ex1', planned_sets: 3 }] },
  },
  { name: 'gym.getTemplate', call: () => api.gym.getTemplate('t1'), method: 'GET', path: '/api/gym/templates/t1' },
  {
    name: 'gym.updateTemplate',
    call: () => api.gym.updateTemplate('t1', { name: 'Legs 2' }),
    method: 'PATCH',
    path: '/api/gym/templates/t1',
    body: { name: 'Legs 2' },
  },
  { name: 'gym.deleteTemplate', call: () => api.gym.deleteTemplate('t1'), method: 'DELETE', path: '/api/gym/templates/t1' },
  {
    name: 'gym.addExerciseToTemplate',
    call: () => api.gym.addExerciseToTemplate('t1', { exercise_id: 'ex1', sort_order: 2 }),
    method: 'POST',
    path: '/api/gym/templates/t1/exercises',
    body: { exercise_id: 'ex1', sort_order: 2 },
  },
  {
    name: 'gym.updateTemplateExercise',
    call: () => api.gym.updateTemplateExercise('te1', { planned_reps: 12 }),
    method: 'PATCH',
    path: '/api/gym/template-exercises/te1',
    body: { planned_reps: 12 },
  },
  {
    name: 'gym.removeTemplateExercise',
    call: () => api.gym.removeTemplateExercise('te1'),
    method: 'DELETE',
    path: '/api/gym/template-exercises/te1',
  },
  { name: 'gym.getSchedule', call: () => api.gym.getSchedule(), method: 'GET', path: '/api/gym/schedule' },
  {
    name: 'gym.setScheduleDay',
    call: () => api.gym.setScheduleDay(3, 't1'),
    method: 'PUT',
    path: '/api/gym/schedule/3',
    body: { template_id: 't1' },
  },
  {
    name: 'gym.setScheduleDay (rest day: null template)',
    call: () => api.gym.setScheduleDay(0, null),
    method: 'PUT',
    path: '/api/gym/schedule/0',
    body: { template_id: null },
  },
  {
    name: 'gym.setFullSchedule',
    call: () => api.gym.setFullSchedule([{ day_of_week: 0, template_id: null }, { day_of_week: 1, template_id: 't1' }]),
    method: 'PUT',
    path: '/api/gym/schedule',
    body: { schedule: [{ day_of_week: 0, template_id: null }, { day_of_week: 1, template_id: 't1' }] },
  },
  { name: 'gym.getToday', call: () => api.gym.getToday(), method: 'GET', path: '/api/gym/today' },
  {
    name: 'gym.completeSession',
    call: () => api.gym.completeSession('s1', 0.8),
    method: 'POST',
    path: '/api/gym/sessions/s1/complete',
    body: { completion_rate: 0.8 },
  },
  {
    name: 'gym.getExerciseProgress (encodes name, limit param)',
    call: () => api.gym.getExerciseProgress('Bench Press', 5),
    method: 'GET',
    path: '/api/gym/progress/Bench%20Press?limit=5',
  },
  { name: 'gym.getGymPatterns', call: () => api.gym.getGymPatterns(), method: 'GET', path: '/api/gym/patterns' },

  // --- goals / bodyWeight / subscription ---------------------------------------
  {
    name: 'goals.put',
    call: () => api.goals.put({ calorie_target: 2200 }),
    method: 'PUT',
    path: '/api/goals',
    body: { calorie_target: 2200 },
  },
  { name: 'bodyWeight.list', call: () => api.bodyWeight.list(), method: 'GET', path: '/api/body-weight' },
  {
    name: 'bodyWeight.create',
    call: () => api.bodyWeight.create({ date: '2026-07-01', weight: 82.5, unit: 'kg' }),
    method: 'POST',
    path: '/api/body-weight',
    body: { date: '2026-07-01', weight: 82.5, unit: 'kg' },
  },
  { name: 'bodyWeight.delete', call: () => api.bodyWeight.delete('bw1'), method: 'DELETE', path: '/api/body-weight/bw1' },
  { name: 'subscription.get', call: () => api.subscription.get(), method: 'GET', path: '/api/subscription' },

  // --- energy / integrations ---------------------------------------------------
  {
    name: 'energy.getBalance (date param)',
    call: () => api.energy.getBalance('2026-07-01'),
    method: 'GET',
    path: '/api/energy-balance?date=2026-07-01',
  },
  {
    name: 'integrations.connectStrava',
    call: () => api.integrations.connectStrava(),
    method: 'GET',
    path: '/api/integrations/strava/connect',
  },
  {
    name: 'integrations.connectWhoop',
    call: () => api.integrations.connectWhoop(),
    method: 'GET',
    path: '/api/integrations/whoop/connect',
  },
  {
    name: 'integrations.syncStrava',
    call: () => api.integrations.syncStrava(),
    method: 'POST',
    path: '/api/integrations/strava/sync',
  },
  {
    name: 'integrations.syncWhoop',
    call: () => api.integrations.syncWhoop(),
    method: 'POST',
    path: '/api/integrations/whoop/sync',
  },
  {
    name: 'integrations.disconnect',
    call: () => api.integrations.disconnect('strava'),
    method: 'DELETE',
    path: '/api/integrations/strava',
  },
];

describe('api surface: path + method contract', () => {
  test.each(cases)('$name', async ({ call, method, path, body }) => {
    await call();
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(BASE + path);
    expect(init.method).toBe(method);
    if (body !== undefined) {
      expect(JSON.parse(init.body as string)).toEqual(body);
      expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    } else {
      expect(init.body).toBeUndefined();
    }
  });
});
