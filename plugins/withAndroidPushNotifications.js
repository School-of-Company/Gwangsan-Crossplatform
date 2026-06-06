const {
  withAndroidManifest,
  withProjectBuildGradle,
  withAppBuildGradle,
} = require('@expo/config-plugins');

const GOOGLE_SERVICES_CLASSPATH = "classpath('com.google.gms:google-services:4.4.2')";
const GOOGLE_SERVICES_PLUGIN = 'apply plugin: "com.google.gms.google-services"';

/** @type {import('@expo/config-plugins').ConfigPlugin} */
const withAndroidPushNotifications = (config) => {
  config = withAndroidManifest(config, (expoConfig) => {
    const manifest = expoConfig.modResults.manifest;
    const permissions = manifest['uses-permission'] ?? [];

    const hasPermission = permissions.some(
      (p) => p.$?.['android:name'] === 'android.permission.POST_NOTIFICATIONS'
    );

    if (!hasPermission) {
      permissions.push({ $: { 'android:name': 'android.permission.POST_NOTIFICATIONS' } });
      manifest['uses-permission'] = permissions;
    }

    return expoConfig;
  });

  config = withProjectBuildGradle(config, (expoConfig) => {
    const contents = expoConfig.modResults.contents;
    if (!contents.includes(GOOGLE_SERVICES_CLASSPATH)) {
      expoConfig.modResults.contents = contents.replace(
        /classpath\('org\.jetbrains\.kotlin:kotlin-gradle-plugin'\)/,
        `classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')\n    ${GOOGLE_SERVICES_CLASSPATH}`
      );
    }
    return expoConfig;
  });

  config = withAppBuildGradle(config, (expoConfig) => {
    const contents = expoConfig.modResults.contents;
    if (!contents.includes(GOOGLE_SERVICES_PLUGIN)) {
      expoConfig.modResults.contents = contents.replace(
        /apply plugin: "com\.facebook\.react"/,
        `apply plugin: "com.facebook.react"\n${GOOGLE_SERVICES_PLUGIN}`
      );
    }
    return expoConfig;
  });

  return config;
};

module.exports = withAndroidPushNotifications;
