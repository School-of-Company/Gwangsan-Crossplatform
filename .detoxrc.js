/* global __dirname */
const path = require('path');
const root = __dirname;

/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'jest.e2e.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: path.join(root, 'ios/build/Build/Products/Debug-iphonesimulator/app.app'),
      build: [
        'xcodebuild',
        `-workspace ${path.join(root, 'ios/app.xcworkspace')}`,
        '-scheme app',
        '-configuration Debug',
        '-sdk iphonesimulator',
        `-derivedDataPath ${path.join(root, 'ios/build')}`,
        'ARCHS=arm64',
        '"EXCLUDED_ARCHS[sdk=iphonesimulator*]=x86_64"',
        'ONLY_ACTIVE_ARCH=YES',
        'CODE_SIGN_IDENTITY=""',
        'CODE_SIGNING_REQUIRED=NO',
        'CODE_SIGNING_ALLOWED=NO',
        '-quiet',
        'build',
      ].join(' '),
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: path.join(root, 'android/app/build/outputs/apk/debug/app-debug.apk'),
      testBinaryPath: path.join(
        root,
        'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk'
      ),
      build: `cd ${path.join(root, 'android')} && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug`,
      reversePorts: [8081],
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 16',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_API_33',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
  },
};
