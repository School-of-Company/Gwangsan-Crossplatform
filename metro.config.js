const { withNativeWind } = require('nativewind/metro');
const path = require('path');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getSentryExpoConfig(__dirname);
config.resolver.unstable_enablePackageExports = true;
config.resolver.assetExts.push('ico');
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
