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
  // FSD 레이어 경계(app → view → widget → entity → shared)를 lint로 강제한다(#741).
  // 문서(.claude/rules/fsd-architecture.md)로만 있던 규칙이라 위반이 18건까지 쌓였었다.
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { fsd: { rules: { 'layer-imports': fsdLayers } } },
    rules: { 'fsd/layer-imports': 'error' },
  },
  {
    settings: {
      'import/resolver': {
        'babel-module': {
          root: ['./src'],
          alias: {
            '~': ['./src'],
            '@/app': ['./src/app'],
            '@/shared': ['./src/shared'],
            '@/entity': ['./src/entity'],
            '@/view': ['./src/view'],
            '@/widget': ['./src/widget'],
          },
        },
      },
    },
    rules: {
      'react/display-name': 'off',
      'react-hooks/refs': 'warn',
      'import/no-unresolved': [
        'error',
        {
          ignore: ['^@env$'],
        },
      ],
    },
  },
]);
