import { describe, expect, it } from 'vitest';
import { isOverlapping, isWithinBusinessHours } from '../src/services/bookingService.js';

const t = (hhmm: string) => new Date(`2026-11-16T${hhmm}:00+08:00`);

describe('isOverlapping', () => {
  it('完全相同的時段會衝突', () => {
    expect(isOverlapping(t('10:00'), t('11:00'), t('10:00'), t('11:00'))).toBe(true);
  });

  it('部分重疊會衝突', () => {
    expect(isOverlapping(t('10:30'), t('11:30'), t('10:00'), t('11:00'))).toBe(true);
  });

  it('相鄰的時段也算衝突（會議室需要交接時間）', () => {
    expect(isOverlapping(t('11:00'), t('12:00'), t('10:00'), t('11:00'))).toBe(true);
  });

  it('完全錯開的時段不衝突', () => {
    expect(isOverlapping(t('13:00'), t('14:00'), t('10:00'), t('11:00'))).toBe(false);
  });
});

describe('isWithinBusinessHours', () => {
  it('09:00–10:00 在營業時間內', () => {
    expect(isWithinBusinessHours(t('09:00'), t('10:00'))).toBe(true);
  });

  it('06:00–07:00 不在營業時間內', () => {
    expect(isWithinBusinessHours(t('06:00'), t('07:00'))).toBe(false);
  });
});
