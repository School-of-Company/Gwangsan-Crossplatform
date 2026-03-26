import { getLightColor } from '../handleLightColor';

describe('getLightColor', () => {
  it.each<[number, string]>([
    [-100, 'bg-black'],
    [0, 'bg-black'],
    [1, 'bg-black'],
    [2, 'bg-sub2-900'],
    [10, 'bg-sub2-900'],
    [11, 'bg-sub2-800'],
    [20, 'bg-sub2-800'],
    [21, 'bg-sub2-700'],
    [30, 'bg-sub2-700'],
    [31, 'bg-sub2-600'],
    [40, 'bg-sub2-600'],
    [41, 'bg-sub2-500'],
    [50, 'bg-sub2-500'],
    [51, 'bg-sub2-400'],
    [60, 'bg-sub2-400'],
    [61, 'bg-sub2-300'],
    [70, 'bg-sub2-300'],
    [71, 'bg-sub2-200'],
    [80, 'bg-sub2-200'],
    [81, 'bg-sub2-100'],
    [90, 'bg-sub2-100'],
    [91, 'bg-white'],
    [100, 'bg-white'],
    [1000, 'bg-white'],
  ])('level %i → %s', (level, expected) => {
    expect(getLightColor(level)).toBe(expected);
  });

  it('경계값 1과 2는 서로 다른 색상이다', () => {
    expect(getLightColor(1)).not.toBe(getLightColor(2));
  });

  it('경계값 10과 11은 서로 다른 색상이다', () => {
    expect(getLightColor(10)).not.toBe(getLightColor(11));
  });

  it('경계값 90과 91은 서로 다른 색상이다', () => {
    expect(getLightColor(90)).not.toBe(getLightColor(91));
  });
});
