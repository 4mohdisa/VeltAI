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
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatStreak(days: number): string {
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "Today" / "Yesterday" / "Mon 15 Jun" */
export function formatRelativeDate(date: Date, now: Date = new Date()): string {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, now)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** "Mon 29 Jun 2026" — used for trial dates etc. */
export function formatLongDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** "18:00" from a Date */
export function formatTime(date: Date): string {
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}
