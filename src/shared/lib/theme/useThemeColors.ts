import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { brandColors, palette, type ColorSchemeName } from './palette';

export const resolveColorScheme = (scheme: string | null | undefined): ColorSchemeName =>
  scheme === 'dark' ? 'dark' : 'light';

// 시스템 설정(라이트/다크)에 맞는 색을 돌려준다. 앱이 켜진 상태에서 설정이 바뀌어도
// useColorScheme이 다시 렌더링을 일으켜 바로 반영된다
export const useThemeColors = () => {
  const scheme = resolveColorScheme(useColorScheme());
  return useMemo(
    () => ({ ...palette[scheme], ...brandColors, scheme, isDark: scheme === 'dark' }),
    [scheme]
  );
};

export type ThemeColors = ReturnType<typeof useThemeColors>;
