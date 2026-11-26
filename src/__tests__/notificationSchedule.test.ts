// Row 10a: pure notification scheduling. `now` is injected as a fixed Date, so
// no real timers run. Times are read back as wall clock times in the zone.
import { scheduleNotifications } from '@/lib/notifications/schedule';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type MealLogTimes,
  type NotificationCategory,
  type NotificationSettings,
  type ScheduledNotification,
} from '@/lib/notifications/types';

const PARIS = 'Europe/Paris';
const NEW_YORK = 'America/New_York';
// Saturday 13 June 2026, 06:00 in Paris (CEST, UTC+2). Tomorrow is Sunday.
const SAT_PARIS = new Date('2026-06-13T04:00:00Z');

const settings = (over: Partial<NotificationSettings> = {}): NotificationSettings => ({
  ...DEFAULT_NOTIFICATION_SETTINGS,
  quietHours: null,
  ...over,
});

const local = (d: Date, timeZone: string) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone, dateStyle: 'short', timeStyle: 'short', hourCycle: 'h23' }).format(d);

const run = (s: NotificationSettings, logs: MealLogTimes = {}, now = SAT_PARIS, tz = PARIS) =>
  scheduleNotifications(now, tz, s, logs);

const of = (list: ScheduledNotification[], category: NotificationCategory) => list.filter((n) => n.category === category);
const times = (list: ScheduledNotification[], tz = PARIS) => list.map((n) => local(n.fireAt, tz));
const breakfast = (list: ScheduledNotification[]) => list.filter((n) => n.slot === 'Breakfast');

describe('categories', () => {
  test('with everything on, each category is scheduled at its time', () => {
    const list = run(settings({ promotionalOptIn: true }));
    expect(times(of(list, 'workout_reminder'))).toEqual(['2026-06-13 17:00', '2026-06-14 17:00']);
    expect(times(of(list, 'streak_at_risk'))).toEqual(['2026-06-13 20:00', '2026-06-14 20:00']);
    expect(times(of(list, 'weekly_summary'))).toEqual(['2026-06-14 18:00']);
    expect(times(of(list, 'promotional'))).toEqual(['2026-06-13 11:00']);
    expect(of(list, 'meal_reminder')).toHaveLength(8);
    expect(list.every((n) => n.titleKey === `notifications.${n.category}.title`)).toBe(true);
  });

  test.each(['meal_reminder', 'workout_reminder', 'streak_at_risk', 'weekly_summary'] as const)(
    'turning %s off removes only that category',
    (category) => {
      const list = run(settings({ enabled: { ...DEFAULT_NOTIFICATION_SETTINGS.enabled, [category]: false } }));
      expect(of(list, category)).toEqual([]);
      const others = (['meal_reminder', 'workout_reminder', 'streak_at_risk', 'weekly_summary'] as const).filter(
        (c) => c !== category,
      );
      for (const c of others) expect(of(list, c).length).toBeGreaterThan(0);
    },
  );

  test('everything off schedules nothing', () => {
    const enabled = { meal_reminder: false, workout_reminder: false, streak_at_risk: false, weekly_summary: false };
    expect(run(settings({ enabled, promotionalOptIn: false }))).toEqual([]);
  });

  test('promotional is off by default and only sent after opting in', () => {
    expect(DEFAULT_NOTIFICATION_SETTINGS.promotionalOptIn).toBe(false);
    expect(of(run(DEFAULT_NOTIFICATION_SETTINGS), 'promotional')).toEqual([]);
    expect(of(run(settings()), 'promotional')).toEqual([]);
    expect(of(run(settings({ promotionalOptIn: true })), 'promotional')).toHaveLength(1);
  });

  test('nothing is in the past and the list is in time order', () => {
    const list = run(settings({ promotionalOptIn: true }), {}, new Date('2026-06-13T13:00:00Z')); // 15:00 Paris
    expect(list.every((n) => n.fireAt > new Date('2026-06-13T13:00:00Z'))).toBe(true);
    expect(times(of(list, 'promotional'))).toEqual([]); // 11:00 has passed
    const fire = list.map((n) => n.fireAt.getTime());
    expect(fire).toEqual([...fire].sort((a, b) => a - b));
  });
});

describe('meal reminder times', () => {
  test('fewer than 3 logs uses the default time', () => {
    expect(times(breakfast(run(settings(), { Breakfast: [420, 430] })))).toEqual(['2026-06-13 08:00', '2026-06-14 08:00']);
  });

  test('3 logs use the median of the real times', () => {
    expect(times(breakfast(run(settings(), { Breakfast: [600, 420, 430] })))[0]).toBe('2026-06-13 07:10');
  });

  test('an even count uses the middle two, rounded', () => {
    expect(times(breakfast(run(settings(), { Breakfast: [420, 425, 430, 800] })))[0]).toBe('2026-06-13 07:08');
  });

  test('other slots keep their defaults', () => {
    const lunch = run(settings(), { Breakfast: [420, 420, 420] }).filter((n) => n.slot === 'Lunch');
    expect(times(lunch)).toEqual(['2026-06-13 12:30', '2026-06-14 12:30']);
  });
});

describe('quiet hours', () => {
  const workouts = (quietHours: NotificationSettings['quietHours']) =>
    times(of(run(settings({ quietHours })), 'workout_reminder'));

  test('a reminder at the start is inside and moves to the end', () => {
    expect(workouts({ start: 17 * 60, end: 18 * 60 })).toEqual(['2026-06-13 18:00', '2026-06-14 18:00']);
  });

  test('a reminder at the end is outside and stays', () => {
    expect(workouts({ start: 16 * 60, end: 17 * 60 })).toEqual(['2026-06-13 17:00', '2026-06-14 17:00']);
  });

  test('a window past midnight moves the reminder to the next morning', () => {
    expect(workouts({ start: 16 * 60 + 30, end: 7 * 60 })).toEqual(['2026-06-14 07:00', '2026-06-15 07:00']);
  });

  test('an empty window changes nothing', () => {
    expect(workouts({ start: 17 * 60, end: 17 * 60 })).toEqual(['2026-06-13 17:00', '2026-06-14 17:00']);
  });

  test('categories that drop are removed instead of moved', () => {
    const list = run(settings({ quietHours: { start: 18 * 60, end: 21 * 60 } }));
    expect(list.filter((n) => n.slot === 'Dinner')).toEqual([]);
    expect(of(list, 'streak_at_risk')).toEqual([]);
    expect(times(of(list, 'weekly_summary'))).toEqual(['2026-06-14 21:00']);
  });

  test('the default 22:00 to 07:00 window keeps the default times', () => {
    expect(times(of(run(DEFAULT_NOTIFICATION_SETTINGS), 'workout_reminder'))).toEqual([
      '2026-06-13 17:00',
      '2026-06-14 17:00',
    ]);
  });
});

describe('time zones', () => {
  test.each([
    [PARIS, '2026-06-13T15:00:00.000Z'],
    [NEW_YORK, '2026-06-13T21:00:00.000Z'],
    ['Australia/Sydney', '2026-06-13T07:00:00.000Z'],
    ['Asia/Kolkata', '2026-06-13T11:30:00.000Z'],
  ])('%s: the 17:00 workout reminder is 17:00 local', (tz, utc) => {
    // 00:30 UTC is already 13 June locally in every zone here except New York (12 June, 20:30).
    const now = new Date('2026-06-13T00:30:00Z');
    const fires = of(scheduleNotifications(now, tz, settings(), {}), 'workout_reminder').map((n) => n.fireAt.toISOString());
    expect(fires).toContain(utc);
    for (const iso of fires) expect(local(new Date(iso), tz).endsWith('17:00')).toBe(true);
  });
});

describe('daylight saving in New York', () => {
  test('spring forward: a 02:30 reminder fires at 03:00', () => {
    const now = new Date('2026-03-08T05:00:00Z'); // 00:00 EST, Sunday 8 March 2026
    const first = breakfast(scheduleNotifications(now, NEW_YORK, settings(), { Breakfast: [150, 150, 150] }))[0];
    expect(local(first.fireAt, NEW_YORK)).toBe('2026-03-08 03:00');
    expect(first.fireAt.toISOString()).toBe('2026-03-08T07:00:00.000Z');
  });

  test('fall back: a 01:30 reminder fires once, at the first 01:30', () => {
    const now = new Date('2026-11-01T04:00:00Z'); // 00:00 EDT, Sunday 1 November 2026
    const list = breakfast(scheduleNotifications(now, NEW_YORK, settings(), { Breakfast: [90, 90, 90] }));
    const onTheDay = list.filter((n) => local(n.fireAt, NEW_YORK).startsWith('2026-11-01'));
    expect(onTheDay.map((n) => n.fireAt.toISOString())).toEqual(['2026-11-01T05:30:00.000Z']);
    expect(local(list[1].fireAt, NEW_YORK)).toBe('2026-11-02 01:30');
  });
});
