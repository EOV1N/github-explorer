import { describe, expect, it } from 'vitest';
import {
  formatCompactNumber,
  formatCount,
  formatRelativeTime,
  minutesUntil,
} from '../utils/formatters';

describe('formatCompactNumber', () => {
  it('returns small numbers as-is', () => {
    expect(formatCompactNumber(0)).toBe('0');
    expect(formatCompactNumber(42)).toBe('42');
    expect(formatCompactNumber(999)).toBe('999');
  });

  it('compacts thousands with one decimal', () => {
    expect(formatCompactNumber(1000)).toBe('1k');
    expect(formatCompactNumber(1200)).toBe('1.2k');
    expect(formatCompactNumber(54_321)).toBe('54.3k');
  });

  it('compacts millions', () => {
    expect(formatCompactNumber(1_500_000)).toBe('1.5M');
  });

  it('drops the decimal for large scaled values', () => {
    expect(formatCompactNumber(245_000)).toBe('245k');
  });

  it('guards against invalid input', () => {
    expect(formatCompactNumber(Number.NaN)).toBe('0');
    expect(formatCompactNumber(-10)).toBe('0');
  });
});

describe('formatCount', () => {
  it('adds thousands separators', () => {
    expect(formatCount(1_234_567)).toBe('1,234,567');
    expect(formatCount(0)).toBe('0');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-02-10T12:00:00Z');

  it('handles recent updates', () => {
    expect(formatRelativeTime('2026-02-10T11:59:40Z', now)).toBe('just now');
    expect(formatRelativeTime('2026-02-10T11:55:00Z', now)).toBe('5 minutes ago');
    expect(formatRelativeTime('2026-02-10T11:00:00Z', now)).toBe('1 hour ago');
  });

  it('handles days and months', () => {
    expect(formatRelativeTime('2026-02-07T12:00:00Z', now)).toBe('3 days ago');
    expect(formatRelativeTime('2025-12-22T12:00:00Z', now)).toBe('1 month ago');
    expect(formatRelativeTime('2025-09-30T12:00:00Z', now)).toBe('4 months ago');
  });

  it('falls back to an absolute date after a year', () => {
    expect(formatRelativeTime('2024-01-15T12:00:00Z', now)).toBe('Jan 15, 2024');
  });

  it('degrades gracefully on invalid input', () => {
    expect(formatRelativeTime('not-a-date', now)).toBe('unknown date');
  });
});

describe('minutesUntil', () => {
  it('rounds up and never goes below one minute', () => {
    const now = new Date('2026-02-10T12:00:00Z');
    const unix = Math.floor(now.getTime() / 1000) + 90; // +90 seconds
    expect(minutesUntil(unix, now)).toBe(2);
    expect(minutesUntil(unix - 5000, now)).toBe(1);
  });
});
