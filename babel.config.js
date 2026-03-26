module.exports = function (api) {
  api.cache.using(() => process.env.NODE_ENV);
  const isTest = api.env('test');

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
  };
};
