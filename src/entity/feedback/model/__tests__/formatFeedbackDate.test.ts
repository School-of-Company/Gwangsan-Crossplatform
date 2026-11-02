import { formatFeedbackDate } from '../formatFeedbackDate';

describe('formatFeedbackDate', () => {
  it('날짜만 YYYY.MM.DD로 표시한다', () => {
    expect(formatFeedbackDate('2026-03-04T09:05:00')).toBe('2026.03.04');
  });

  it('withTime이면 HH:mm까지 표시한다', () => {
    expect(formatFeedbackDate('2026-03-04T09:05:00', true)).toBe('2026.03.04 09:05');
  });

  it('값이 없으면 빈 문자열을 반환한다', () => {
    expect(formatFeedbackDate(null)).toBe('');
    expect(formatFeedbackDate(undefined)).toBe('');
  });

  it('날짜로 읽을 수 없으면 원래 문자열을 반환한다', () => {
    expect(formatFeedbackDate('잘못된 값')).toBe('잘못된 값');
  });
});
