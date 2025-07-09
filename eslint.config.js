/* eslint-env node */
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
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
      'import/no-unresolved': [
        'error',
        {
          ignore: ['^@env$'],
        },
      ],
    },
  },
]);
