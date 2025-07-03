const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);
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
