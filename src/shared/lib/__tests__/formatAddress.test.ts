import { formatDisplayAddress } from '../formatAddress';

describe('formatDisplayAddress', () => {
  it('"전남광주통합특별시" 접두사를 제거하고 뒷부분만 반환한다', () => {
    expect(formatDisplayAddress('전남광주통합특별시 광산구 하남산단6번로 123')).toBe(
      '광산구 하남산단6번로 123'
    );
  });

  it('접두사가 없으면 원본 그대로 반환한다', () => {
    expect(formatDisplayAddress('광주 광산구 하남산단6번로 123')).toBe(
      '광주 광산구 하남산단6번로 123'
    );
  });

  it('접두사만 있고 뒤에 아무것도 없으면 빈 문자열을 반환한다', () => {
    expect(formatDisplayAddress('전남광주통합특별시')).toBe('');
  });

  it('빈 문자열을 그대로 반환한다', () => {
    expect(formatDisplayAddress('')).toBe('');
  });
});
