import { describe, expect, it } from 'vitest';
import { formatDateLabel } from './time';

describe('formatDateLabel', () => {
  it('顯示月/日與星期', () => {
    expect(formatDateLabel('2026-11-16')).toBe('11/16（一）');
  });
});
