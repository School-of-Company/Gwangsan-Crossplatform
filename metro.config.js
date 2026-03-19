const { withNativeWind } = require('nativewind/metro');
const path = require('path');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getSentryExpoConfig(__dirname);
config.resolver.unstable_enablePackageExports = false;
config.resolver.extraNodeModules = {
  'scrolloop/native': require.resolve('./node_modules/scrolloop/packages/react-native/dist/index.cjs'),
};
config.resolver.assetExts.push('ico');
config.resolver.alias = {
  '~': path.resolve(__dirname, 'src'),
  '@/app': path.resolve(__dirname, 'src/app'),
  '@/shared': path.resolve(__dirname, 'src/shared'),
  '@/entity': path.resolve(__dirname, 'src/entity'),
  '@/view': path.resolve(__dirname, 'src/view'),
  '@/widget': path.resolve(__dirname, 'src/widget'),
};

module.exports = withNativeWind(config, { input: './global.css' });
