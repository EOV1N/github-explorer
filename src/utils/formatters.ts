/**
 * Pure formatting helpers. Kept framework-free so they are trivial to unit test.
 */

/** 999 -> "999", 1_200 -> "1.2k", 1_500_000 -> "1.5M" */
export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';
  if (value < 1000) return String(Math.floor(value));

  const units = [
    { threshold: 1_000_000, suffix: 'M' },
    { threshold: 1_000, suffix: 'k' },
  ] as const;

  for (const unit of units) {
    if (value >= unit.threshold) {
      const scaled = value / unit.threshold;
      const rounded = scaled >= 100 ? Math.round(scaled) : Math.round(scaled * 10) / 10;
      return `${rounded}${unit.suffix}`;
    }
  }
  return String(value);
}

/** 1234567 -> "1,234,567" (locale thousands separators). */
export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('en-US').format(value);
}

function plural(amount: number, unit: string): string {
  return `${amount} ${unit}${amount === 1 ? '' : 's'} ago`;
}

/**
 * Human-friendly relative time: "just now", "5 minutes ago", "3 days ago".
 * Older than a year falls back to an absolute date, e.g. "Mar 12, 2024".
 * `now` is injectable to keep the function deterministic in tests.
 */
export function formatRelativeTime(isoDate: string, now: Date = new Date()): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'unknown date';

  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return plural(minutes, 'minute');

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return plural(hours, 'hour');

  const days = Math.floor(hours / 24);
  if (days < 30) return plural(days, 'day');

  const months = Math.floor(days / 30);
  if (months < 12) return plural(months, 'month');

  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Minutes until a unix timestamp, rounded up — used for rate-limit messaging. */
export function minutesUntil(unixSeconds: number, now: Date = new Date()): number {
  const ms = unixSeconds * 1000 - now.getTime();
  return Math.max(1, Math.ceil(ms / 60_000));
}
