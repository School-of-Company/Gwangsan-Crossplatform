import { SPECIALTIES } from '../specialties';

describe('SPECIALTIES', () => {
  it('6개의 특기 항목을 포함한다', () => {
    expect(SPECIALTIES).toHaveLength(6);
  });

  it('모든 항목이 비어있지 않은 문자열이다', () => {
    SPECIALTIES.forEach((specialty) => {
      expect(typeof specialty).toBe('string');
      expect(specialty.length).toBeGreaterThan(0);
    });
  });

  it('중복된 항목이 없다', () => {
    expect(new Set(SPECIALTIES).size).toBe(SPECIALTIES.length);
  });

  it('특정 항목을 포함한다', () => {
    expect(SPECIALTIES).toContain('빨래하기');
    expect(SPECIALTIES).toContain('이삿짐 나르기');
  });
});
