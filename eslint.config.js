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
