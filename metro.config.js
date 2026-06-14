const { withNativeWind } = require('nativewind/metro');
const path = require('path');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getSentryExpoConfig(__dirname);

// scrolloop ships untranspiled CJS with private class fields (#x, #y, etc.)
// that hermesc cannot compile — force Metro/Babel to transpile it
config.transformer.transformIgnorePatterns = [
  'node_modules/(?!(scrolloop|react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/.*|sentry-expo|native-base|react-native-svg|react-native-keyboard-controller)/)',
];

config.resolver.unstable_enablePackageExports = true;
config.resolver.assetExts.push('ico');
const defaultResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'scrolloop/native') {
    return {
      filePath: require.resolve('./node_modules/scrolloop/packages/react-native/dist/index.cjs'),
      type: 'sourceFile',
    };
  }
  return defaultResolver
    ? defaultResolver(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};
config.resolver.alias = {
  '~': path.resolve(__dirname, 'src'),
  '@/app': path.resolve(__dirname, 'src/app'),
  '@/shared': path.resolve(__dirname, 'src/shared'),
  '@/entity': path.resolve(__dirname, 'src/entity'),
  '@/view': path.resolve(__dirname, 'src/view'),
  '@/widget': path.resolve(__dirname, 'src/widget'),
  'expo-router/entry-classic': path.resolve(__dirname, 'node_modules/expo-router/entry-classic.js'),
};

module.exports = withNativeWind(config, { input: './global.css' });
