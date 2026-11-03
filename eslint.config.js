const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const security = require('eslint-plugin-security');
const fsdLayers = require('./scripts/eslint/fsd-layers');

module.exports = defineConfig([
  expoConfig,
  security.configs.recommended,
  {
    ignores: ['dist/*'],
  },
  // FSD 레이어 경계(app → view → widget → entity → shared). 규칙: .claude/rules/fsd-architecture.md
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { fsd: { rules: { 'layer-imports': fsdLayers } } },
    rules: {
      'fsd/layer-imports': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [{ group: ['@/*'], message: "src 경로 별칭은 '~/'만 사용합니다." }],
        },
      ],
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
    rules: { '@typescript-eslint/no-explicit-any': 'error' },
  },
  // jest.mock 팩토리·isolateModules 안에서는 호이스팅 때문에 require만 쓸 수 있다.
  {
    files: [
      '**/__tests__/**',
      '**/*.test.{js,jsx,ts,tsx}',
      '__mocks__/**',
      'jest.setup.js',
      'e2e/**',
      'src/test-utils/**',
    ],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]);
