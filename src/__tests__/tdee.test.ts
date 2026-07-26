// TDEE / target derivation — must match the backend derive.go byte-for-byte, so
// these expected values are computed from the Mifflin–St Jeor formula the backend
// uses (10*kg + 6.25*cm - 5*age + sex offset) × activity factor + goal adjustment.
import { deriveTargets, DEFAULT_HEIGHT_CM, DEFAULT_WEIGHT_KG } from '@/lib/onboarding/deriveTargets';

describe('deriveTargets (mirrors backend goals.DeriveGoals)', () => {
  test('male, moderate, maintain', () => {
    // BMR = 10*80 + 6.25*180 - 5*30 + 5 = 1780; TDEE = 1780*1.55 = 2759; round/10 → 2760
    const r = deriveTargets({ age: 30, sex: 'male', height_cm: 180, weight_kg: 80, activity_level: 'moderate', goal: 'track' });
    expect(r.calories).toBe(2760);
    expect(r.protein).toBe(Math.round(80 * 1.8)); // 144
    expect(r.fat).toBe(Math.round((2760 * 0.25) / 9)); // 77
  });

  test('female, sedentary, lose (−400)', () => {
    // BMR = 10*60 + 6.25*165 - 5*25 - 161 = 1345.25; TDEE = *1.2 = 1614.3; -400 = 1214.3 → 1210
    const r = deriveTargets({ age: 25, sex: 'female', height_cm: 165, weight_kg: 60, activity_level: 'sedentary', goal: 'lose' });
    expect(r.calories).toBe(1210);
  });

  test('muscle goal uses +250 and 2.0 g/kg protein', () => {
    // BMR = 10*75 + 6.25*178 - 5*28 + 5 = 1727.5; TDEE = *1.375 = 2375.3; +250 = 2625.3 → 2630
    const r = deriveTargets({ age: 28, sex: 'male', height_cm: 178, weight_kg: 75, activity_level: 'light', goal: 'muscle' });
    expect(r.calories).toBe(2630);
    expect(r.protein).toBe(Math.round(75 * 2.0)); // 150
  });

  test('very_active multiplier is 1.9', () => {
    // BMR = 10*90 + 6.25*185 - 5*35 + 5 = 1885.25; *1.9 = 3581.975 → 3580
    const r = deriveTargets({ age: 35, sex: 'male', height_cm: 185, weight_kg: 90, activity_level: 'very_active', goal: 'track' });
    expect(r.calories).toBe(3580);
  });

  test('floors at 1200 kcal and 25 g fibre', () => {
    // Tiny inputs would derive < 1200; must clamp.
    const r = deriveTargets({ age: 70, sex: 'female', height_cm: 150, weight_kg: 45, activity_level: 'sedentary', goal: 'lose' });
    expect(r.calories).toBe(1200);
    expect(r.fibre).toBeGreaterThanOrEqual(25);
  });

  test('other sex uses the −78 midpoint offset', () => {
    // BMR = 10*70 + 6.25*170 - 5*30 - 78 = 1534.5; *1.2 = 1841.4 → 1840
    const r = deriveTargets({ age: 30, sex: 'other', height_cm: 170, weight_kg: 70, activity_level: 'sedentary', goal: 'track' });
    expect(r.calories).toBe(1840);
  });

  test('population defaults are the documented medians', () => {
    expect(DEFAULT_HEIGHT_CM).toBe(170);
    expect(DEFAULT_WEIGHT_KG).toBe(70);
  });
});
