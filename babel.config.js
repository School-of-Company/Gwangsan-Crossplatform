module.exports = function (api) {
  api.cache.using(() => process.env.NODE_ENV);
  const isTest = api.env('test');
  const isE2ECoverage = process.env.E2E_COVERAGE === 'true';

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: isTest ? undefined : 'nativewind',
          reanimated: isTest ? false : undefined,
        },
      ],
      ...(isTest ? [] : ['nativewind/babel']),
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
          alias: {
            '~': './src',
            '@/app': './src/app',
            '@/shared': './src/shared',
            '@/entity': './src/entity',
            '@/view': './src/view',
            '@/widget': './src/widget',
          },
        },
      ],
      ...(isE2ECoverage
        ? [
            [
              'istanbul',
              {
                exclude: ['e2e/**', '**/__tests__/**'],
              },
            ],
          ]
        : []),
    ],
    // react-native-dotenv statically inlines every `process.env.X` it sees at transform time
    // using whatever value that key holds in the current process. Metro's transform workers
    // (built on the `jest-worker` package) set JEST_WORKER_ID, so if this plugin were allowed
    // to touch node_modules it would bake `process.env.JEST_WORKER_ID` into a truthy literal
    // inside react-native-worklets, permanently flipping its IS_JEST flag to true and causing
    // "[Worklets] Tried to synchronously call a non-worklet function" crashes at runtime.
    // Scoping it to app source (which is the only place `@env` is imported) avoids that.
    // `exclude` must be a function rather than a RegExp: Metro computes a Babel cache key by
    // resolving this config with no filename, and Babel throws
    // "Configuration contains string/RegExp pattern, but no filename was passed to Babel"
    // when an overrides pattern is a RegExp/string in that filename-less call.
    overrides: [
      {
        exclude: (path) => typeof path === 'string' && path.includes('node_modules'),
        plugins: [
          [
            'module:react-native-dotenv',
            {
              moduleName: '@env',
              path: '.env',
              blacklist: null,
              whitelist: null,
              safe: false,
              allowUndefined: true,
            },
          ],
        ],
      },
    ],
  };
};
