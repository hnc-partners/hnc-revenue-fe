import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatPercent,
  formatPeriod,
  formatDateShort,
  shareCategoryBadgeConfig,
  dealTypeLabel,
} from '../commission-helpers';

describe('formatCurrency', () => {
  it('formats a decimal string as currency', () => {
    const result = formatCurrency('1234.56', 'USD');
    expect(result).toBe('$1,234.56');
  });

  it('formats zero', () => {
    const result = formatCurrency('0', 'EUR');
    expect(result).toContain('0.00');
  });

  it('handles NaN input', () => {
    const result = formatCurrency('invalid', 'USD');
    expect(result).toBe('—');
  });

  it('handles null input', () => {
    expect(formatCurrency(null, 'USD')).toBe('—');
  });

  it('uses EUR as default currency when empty', () => {
    const result = formatCurrency('100', '');
    expect(result).toContain('100.00');
  });

  it('formats negative amounts', () => {
    const result = formatCurrency('-500.00', 'USD');
    expect(result).toContain('500.00');
  });
});

describe('formatPercent', () => {
  it('formats a decimal as percentage', () => {
    expect(formatPercent('0.15')).toBe('15.00%');
  });

  it('formats zero', () => {
    expect(formatPercent('0')).toBe('0.00%');
  });

  it('handles NaN', () => {
    expect(formatPercent('invalid')).toBe('—');
  });

  it('handles null', () => {
    expect(formatPercent(null)).toBe('—');
  });

  it('formats 100%', () => {
    expect(formatPercent('1.0')).toBe('100.00%');
  });
});

describe('formatPeriod', () => {
  it('formats a date range', () => {
    const result = formatPeriod('2026-01-01', '2026-01-31');
    expect(result).toContain('Jan');
    expect(result).toContain('2026');
    expect(result).toContain('-');
  });
});

describe('formatDateShort', () => {
  it('formats a date in short format', () => {
    const result = formatDateShort('2026-03-15');
    expect(result).toContain('Mar');
    expect(result).toContain('15');
  });
});

describe('shareCategoryBadgeConfig', () => {
  it('returns config for POKER', () => {
    const config = shareCategoryBadgeConfig('POKER');
    expect(config.className).toContain('info');
  });

  it('returns config for CASINO', () => {
    const config = shareCategoryBadgeConfig('CASINO');
    expect(config.className).toContain('destructive');
  });

  it('returns config for SPORTS', () => {
    const config = shareCategoryBadgeConfig('SPORTS');
    expect(config.className).toContain('success');
  });

  it('handles case-insensitive lookup', () => {
    const config = shareCategoryBadgeConfig('poker');
    expect(config.className).toContain('info');
  });

  it('returns neutral config for unknown category', () => {
    const config = shareCategoryBadgeConfig('UNKNOWN');
    expect(config.className).toContain('muted-foreground');
    expect(config.label).toBe('UNKNOWN');
  });
});

describe('dealTypeLabel', () => {
  it('returns human-readable labels', () => {
    expect(dealTypeLabel('master_agent')).toBe('Master Agent');
    expect(dealTypeLabel('player')).toBe('Player');
    expect(dealTypeLabel('sub_agent')).toBe('Sub-Agent');
    expect(dealTypeLabel('referrer')).toBe('Referrer');
  });
});
