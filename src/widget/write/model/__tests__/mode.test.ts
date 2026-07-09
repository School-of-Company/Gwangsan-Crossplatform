import { MODE } from '../mode';

describe('MODE', () => {
  it('2개의 모드를 포함한다', () => {
    expect(Object.keys(MODE)).toHaveLength(2);
  });

  it.each([
    ['GIVER', 'GIVER'],
    ['RECEIVER', 'RECEIVER'],
  ] as const)('%s 키의 값은 "%s"이다', (key, value) => {
    expect(MODE[key]).toBe(value);
  });

  it('중복되는 값이 없다', () => {
    const values = Object.values(MODE);
    expect(new Set(values).size).toBe(values.length);
  });
});
