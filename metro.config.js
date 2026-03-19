const { withNativeWind } = require('nativewind/metro');
const path = require('path');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getSentryExpoConfig(__dirname);
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
