import { formatDateTime } from '../formatDateTime';

describe('formatDateTime', () => {
  it('타임존 없는 서버 시각을 YYYY.MM.DD HH:mm으로 바꾼다', () => {
    expect(formatDateTime('2026-09-08T17:04:25')).toBe('2026.09.08 17:04');
    expect(formatDateTime('2026-01-02T03:04:05.123')).toBe('2026.01.02 03:04');
  });

  it('시각이 없는 날짜는 날짜만 보여준다', () => {
    expect(formatDateTime('2025-01-15')).toBe('2025.01.15');
  });

  it('비어 있으면 빈 문자열, 해석할 수 없으면 원문을 돌려준다', () => {
    expect(formatDateTime('')).toBe('');
    expect(formatDateTime(undefined)).toBe('');
    expect(formatDateTime('어제')).toBe('어제');
  });
});
