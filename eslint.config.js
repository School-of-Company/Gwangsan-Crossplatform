const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const security = require('eslint-plugin-security');

module.exports = defineConfig([
  expoConfig,
  security.configs.recommended,
  {
    ignores: ['dist/*'],
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
