import { isVersionLower } from '../versionCompare';

describe('isVersionLower', () => {
  it('문자열 비교로는 틀리는 1.9.0 < 1.10.0을 올바르게 판단한다', () => {
    expect(isVersionLower('1.9.0', '1.10.0')).toBe(true);
    expect(isVersionLower('1.10.0', '1.9.0')).toBe(false);
  });

  it('같은 버전이면 false를 반환한다', () => {
    expect(isVersionLower('1.1.4', '1.1.4')).toBe(false);
  });

  it('patch/minor/major 자리를 각각 비교한다', () => {
    expect(isVersionLower('1.1.4', '1.1.5')).toBe(true);
    expect(isVersionLower('1.2.0', '2.0.0')).toBe(true);
    expect(isVersionLower('2.0.0', '1.99.99')).toBe(false);
  });

  it('자리수가 다르면 없는 자리를 0으로 본다', () => {
    expect(isVersionLower('1.1', '1.1.1')).toBe(true);
    expect(isVersionLower('1.1.0', '1.1')).toBe(false);
  });

  it('숫자가 아닌 값은 0으로 취급해 크래시하지 않는다', () => {
    expect(isVersionLower('1.1.0', '')).toBe(false);
    expect(isVersionLower('', '1.0.0')).toBe(true);
  });
});
