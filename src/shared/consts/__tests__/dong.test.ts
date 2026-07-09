import { DONG } from '../dong';

describe('DONG', () => {
  it('20개의 동 이름을 포함한다', () => {
    expect(DONG).toHaveLength(20);
  });

  it('모든 항목이 비어있지 않은 문자열이다', () => {
    DONG.forEach((dong) => {
      expect(typeof dong).toBe('string');
      expect(dong.length).toBeGreaterThan(0);
    });
  });

  it('중복된 동 이름이 없다', () => {
    const unique = new Set(DONG);
    expect(unique.size).toBe(DONG.length);
  });

  it('특정 동 이름을 포함한다', () => {
    expect(DONG).toContain('수완동');
    expect(DONG).toContain('첨단1동');
  });
});
