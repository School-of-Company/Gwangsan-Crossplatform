import { assertValidId, isValidId } from '../validateId';

describe('assertValidId', () => {
  it('양의 정수 문자열이면 그대로 반환한다', () => {
    expect(assertValidId('1')).toBe('1');
    expect(assertValidId('12345')).toBe('12345');
  });

  it.each(['', '0', '-1', '1.5', 'NaN', 'abc', '1e5', '1; DROP TABLE post;', ' 1', '1 '])(
    '%s는 유효하지 않은 ID로 취급해 throw한다',
    (invalid) => {
      expect(() => assertValidId(invalid)).toThrow();
    }
  );
});

describe('isValidId', () => {
  it('양의 정수 문자열이면 true를 반환한다', () => {
    expect(isValidId('1')).toBe(true);
  });

  it.each([undefined, '', '0', '-1', 'NaN', 'abc'])('%s는 false를 반환한다', (invalid) => {
    expect(isValidId(invalid)).toBe(false);
  });
});
