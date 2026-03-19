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
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/app.app',
      build: [
        'xcodebuild',
        '-workspace ios/app.xcworkspace',
        '-scheme app',
        '-configuration Debug',
        '-sdk iphonesimulator',
        '-derivedDataPath ios/build',
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
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      testBinaryPath: 'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd ..',
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
