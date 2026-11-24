// Formatting helpers. All display strings flow through here so units and
// locale stay consistent (Australian context: A$, metric-first).
import i18n from '@/lib/i18n';

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('en-AU');
}

export function formatCalories(kcal: number): string {
  return `${formatNumber(kcal)} ${i18n.t('dashboard.kcal')}`;
}

export function formatGrams(grams: number): string {
  return `${Math.round(grams)} ${i18n.t('food.gramsUnit')}`;
}

/** e.g. formatMacro('Protein', 32) → "32 g protein" */
export function formatMacro(name: string, grams: number): string {
  return `${Math.round(grams)} ${i18n.t('food.gramsUnit')} ${name.toLowerCase()}`;
}

export function formatCurrency(amount: number): string {
  return `A$${amount.toFixed(2)}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return i18n.t('gym.loggedMinutes', { minutes: Math.round(minutes) });
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m === 0 ? i18n.t('common.hours', { h }) : i18n.t('common.hoursMinutes', { h, m });
}

export function formatStreak(days: number): string {
  return i18n.t('common.days', { count: days });
}

/** The date-formatting locale for an app language. English is formatted as
 *  Australian English (day before month, dd/mm/yyyy), since Australia is the
 *  first market; a bare 'en' would format US-style ("Nov 25", 11/25/2026). */
export function dateLocale(language: string): string {
  return language === 'en' ? 'en-AU' : language;
}

/** "Wed 10 Jun" — weekday and month names from the app language, in the
 *  design's day-before-month order without the comma Intl puts after the weekday. */
function shortDayMonth(date: Date): string {
  const locale = dateLocale(i18n.language);
  const weekday = date.toLocaleDateString(locale, { weekday: 'short' });
  const month = date.toLocaleDateString(locale, { month: 'short' });
  return `${weekday} ${date.getDate()} ${month}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "Today" / "Yesterday" / "Mon 15 Jun" */
export function formatRelativeDate(date: Date, now: Date = new Date()): string {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, now)) return i18n.t('foodLog.today');
  if (sameDay(date, yesterday)) return i18n.t('history.yesterday');
  return shortDayMonth(date);
}

/** "Mon 29 Jun 2026" — used for trial dates etc. */
export function formatLongDate(date: Date): string {
  return `${shortDayMonth(date)} ${date.getFullYear()}`;
}

/** "Saturday 21 November" in the app language — the full day label. */
export function formatWeekdayDate(date: Date): string {
  return date.toLocaleDateString(dateLocale(i18n.language), { weekday: 'long', day: 'numeric', month: 'long' });
}

/** "November 2026" in the app language — a month heading. */
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString(dateLocale(i18n.language), { month: 'long', year: 'numeric' });
}

/** "18:00" from a Date */
export function formatTime(date: Date): string {
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}
