// 테마별 색 값의 단일 출처. className에서는 global.css의 CSS 변수(tailwind 토큰)를 쓰고,
// 아이콘 color prop처럼 className을 쓸 수 없는 곳은 useThemeColors로 이 값을 읽는다.
// global.css와 값이 어긋나지 않는지는 __tests__/palette.test.ts가 확인한다.
export const THEME_COLOR_KEYS = [
  'background',
  'surface',
  'surface-muted',
  'foreground',
  'gray-50',
  'gray-100',
  'gray-200',
  'gray-300',
  'gray-400',
  'gray-500',
  'gray-600',
  'gray-700',
  'gray-800',
  'gray-900',
] as const;

export type ThemeColorKey = (typeof THEME_COLOR_KEYS)[number];
export type ColorSchemeName = 'light' | 'dark';

export const palette: Record<ColorSchemeName, Record<ThemeColorKey, string>> = {
  light: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    'surface-muted': '#F3F4F5',
    foreground: '#000000',
    'gray-50': '#F5F6F8',
    'gray-100': '#EFF0F2',
    'gray-200': '#DBDCDE',
    'gray-300': '#B4B5B7',
    'gray-400': '#A5A6A9',
    'gray-500': '#8F9094',
    'gray-600': '#828387',
    'gray-700': '#666669',
    'gray-800': '#4F4F51',
    'gray-900': '#3C3C3E',
  },
  // 다크에서는 회색 단계를 뒤집어서, 밝은 배경용 단계(50~200)는 어두운 면으로, 진한 글자용
  // 단계(700~900)는 밝은 글자로 바뀐다. 그래서 기존 gray-* 클래스는 그대로 두어도 된다
  dark: {
    background: '#121214',
    surface: '#1C1C1E',
    'surface-muted': '#2C2C2E',
    foreground: '#F5F6F8',
    'gray-50': '#242527',
    'gray-100': '#2E2F31',
    'gray-200': '#3F4042',
    'gray-300': '#5A5B5E',
    'gray-400': '#75767A',
    'gray-500': '#8F9094',
    'gray-600': '#A5A6A9',
    'gray-700': '#C2C3C6',
    'gray-800': '#DBDCDE',
    'gray-900': '#F2F3F5',
  },
};

// 테마와 상관없이 같은 브랜드/상태 색
export const brandColors = {
  main: '#8FC31D',
  sub: '#0075C2',
  sub2: '#F6AC01',
  error: '#DF454A',
  white: '#FFFFFF',
  black: '#000000',
} as const;
