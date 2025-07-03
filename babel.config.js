module.exports = function (api) {
  api.cache(true);
  let plugins = [
    [
      'module-resolver',
      {
        root: ['./src'],
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
    'expo-router/babel',
  ];

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins,
  };
};
