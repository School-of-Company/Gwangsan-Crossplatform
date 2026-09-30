import { renderHook } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import { resolveColorScheme, useThemeColors } from '../useThemeColors';
import { palette } from '../palette';

describe('useThemeColors', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('시스템이 다크 모드면 다크 팔레트를 돌려준다', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
    const { result } = renderHook(() => useThemeColors());

    expect(result.current.isDark).toBe(true);
    expect(result.current.background).toBe(palette.dark.background);
    expect(result.current.foreground).toBe(palette.dark.foreground);
  });

  it('시스템이 라이트 모드면 라이트 팔레트를 돌려준다', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
    const { result } = renderHook(() => useThemeColors());

    expect(result.current.isDark).toBe(false);
    expect(result.current.background).toBe(palette.light.background);
  });

  it('브랜드 색은 테마와 상관없이 같다', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
    const { result } = renderHook(() => useThemeColors());

    expect(result.current.main).toBe('#8FC31D');
  });
});

describe('resolveColorScheme', () => {
  it.each([
    ['dark', 'dark'],
    ['light', 'light'],
    [null, 'light'],
    [undefined, 'light'],
    ['unspecified', 'light'],
  ])('%s → %s', (input, expected) => {
    expect(resolveColorScheme(input)).toBe(expected);
  });
});
