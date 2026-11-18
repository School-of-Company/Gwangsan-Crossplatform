const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const security = require('eslint-plugin-security');
const fsdLayers = require('./scripts/eslint/fsd-layers');
const slicePublicApi = require('./scripts/eslint/slice-public-api');

const aliasPattern = { group: ['@/*'], message: "src 경로 별칭은 '~/'만 사용합니다." };

module.exports = defineConfig([
  expoConfig,
  security.configs.recommended,
  {
    ignores: ['dist/*'],
  },
  // FSD 레이어 경계(app → view → widget → entity → shared). 규칙: .claude/rules/fsd-architecture.md
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      fsd: { rules: { 'layer-imports': fsdLayers, 'slice-public-api': slicePublicApi } },
    },
    rules: {
      'fsd/layer-imports': 'error',
      'no-restricted-imports': ['error', { patterns: [aliasPattern] }],
    },
  },
  {
    settings: {
      'import/resolver': {
        'babel-module': {
          root: ['./src'],
          alias: {
            '~': ['./src'],
          },
        },
      },
    },
    rules: {
      'react/display-name': 'off',
      'react-hooks/refs': 'warn',
      'import/no-unresolved': 'error',
      // 배열 인덱스·유니온 키 조회까지 모두 잡아 경고가 전부 오탐이다. 사용자 입력을 키로 쓰는 곳은 리뷰로 막는다
      'security/detect-object-injection': 'off',
    },
  },
  // axios.create는 default export의 정식 API라 named export와 겹친다는 경고가 오탐이다
  {
    files: [
      'src/shared/lib/apiInstance.ts',
      'src/shared/lib/publicInstance.ts',
      'src/shared/api/kakaoLocalSearch.ts',
      'src/mocks/__tests__/mocks.test.ts',
    ],
    rules: {
      'import/no-named-as-default-member': 'off',
    },
  },
  // 빌드 설정·Expo 플러그인·E2E·테스트는 앱 밖에서 도는 Node 코드라 경로가 사용자 입력이 아니다
  {
    files: [
      'app.config.ts',
      'plugins/**',
      'e2e/**',
      '**/__tests__/**',
      '**/*.test.{js,jsx,ts,tsx}',
    ],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
    },
  },
  // 테스트의 문자열 비교는 비밀값 검증이 아니다
  {
    files: ['**/__tests__/**', '**/*.test.{js,jsx,ts,tsx}'],
    rules: {
      'security/detect-possible-timing-attacks': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**', '**/*.test.{ts,tsx}', 'src/test-utils/**'],
    // 테스트는 jest.mock으로 개별 모듈을 바꿔 끼우므로 슬라이스 내부 경로 import를 허용한다
    rules: {
      'fsd/slice-public-api': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['StyleSheet'],
              message: 'NativeWind className으로 스타일을 지정합니다.',
            },
          ],
          patterns: [aliasPattern],
        },
      ],
    },
  },
  // jest.mock 팩토리·isolateModules 안에서는 호이스팅 때문에 require만 쓸 수 있다.
  {
    files: [
      '**/__tests__/**',
      '**/*.test.{js,jsx,ts,tsx}',
      '__mocks__/**',
      'jest.setup.js',
      'jest.setup.after-env.js',
      'e2e/**',
      'src/test-utils/**',
    ],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]);
