const {
  withAppBuildGradle,
  withDangerousMod,
  withProjectBuildGradle,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');
const { NSC_XML } = require('./withNetworkSecurityConfig');

/**
 * Android Detox 설정 플러그인 (E2E 빌드 전용 — app.config.ts에서 DETOX_ANDROID_E2E=true일 때만 적용)
 *
 * android/는 prebuild로 생성되므로 Detox 네이티브 설정을 여기서 넣는다.
 * https://wix.github.io/Detox/docs/introduction/project-setup#step-4-additional-android-configuration
 *  1. 루트 build.gradle: node_modules/detox의 로컬 maven 저장소
 *  2. app/build.gradle: testBuildType·테스트 러너, release용 Detox proguard 규칙, detox 의존성
 *  3. androidTest/DetoxTest.java: Detox 계측 테스트 진입점
 *  4. release 소스셋 NSC: 앱 안의 Detox 클라이언트가 adb reverse된 ws://localhost로 붙으므로 localhost만
 *     cleartext를 허용한다. 나머지(인증서 피닝 포함)는 운영 NSC와 같다
 */
const DETOX_MAVEN = 'maven { url("$rootDir/../node_modules/detox/Detox-android") }';

const DETOX_DEFAULT_CONFIG = `        testBuildType System.getProperty('testBuildType', 'debug')
        testInstrumentationRunner 'androidx.test.runner.AndroidJUnitRunner'`;

// Detox가 리플렉션으로 접근하는 RN·Kotlin 클래스만 유지한다. 앱 라이브러리(keychain, socket.io, maps 등)
// 규칙은 넣지 않으므로 R8이 그쪽 코드를 지우는 문제는 E2E에서도 그대로 드러난다
const DETOX_PROGUARD =
  'proguardFile "${rootProject.projectDir}/../node_modules/detox/android/detox/proguard-rules-app.pro"';

const DETOX_DEPENDENCY = "    androidTestImplementation('com.wix:detox:+')";

const detoxTestJava = (pkg) => `package ${pkg};

import com.wix.detox.Detox;
import com.wix.detox.config.DetoxConfig;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.LargeTest;
import androidx.test.rule.ActivityTestRule;

@RunWith(AndroidJUnit4.class)
@LargeTest
public class DetoxTest {
    @Rule
    public ActivityTestRule<MainActivity> mActivityRule = new ActivityTestRule<>(MainActivity.class, false, false);

    @Test
    public void runDetoxTests() {
        DetoxConfig detoxConfig = new DetoxConfig();
        detoxConfig.idlePolicyConfig.masterTimeoutSec = 90;
        detoxConfig.idlePolicyConfig.idleResourceTimeoutSec = 60;
        detoxConfig.rnContextLoadTimeoutSec = (BuildConfig.DEBUG ? 180 : 60);

        Detox.runTests(mActivityRule, detoxConfig);
    }
}
`;

const LOCALHOST_CLEARTEXT = `  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="false">localhost</domain>
  </domain-config>
`;

const E2E_RELEASE_NSC_XML = NSC_XML.replace(
  '</network-security-config>',
  `${LOCALHOST_CLEARTEXT}</network-security-config>`
);

const writeFile = (dir, name, contents) => {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), contents, 'utf-8');
};

const insertOnce = (contents, marker, anchor, insertion) => {
  if (contents.includes(marker)) return contents;
  if (!anchor.test(contents)) {
    throw new Error(`withDetoxAndroid: build.gradle에서 ${anchor}를 찾지 못했습니다`);
  }
  return contents.replace(anchor, (match) => `${match}\n${insertion}`);
};

const addDetoxToProjectGradle = (contents) =>
  insertOnce(
    contents,
    'Detox-android',
    /allprojects\s*\{\s*repositories\s*\{/,
    `    ${DETOX_MAVEN}`
  );

const addDetoxToAppGradle = (contents) => {
  let next = insertOnce(contents, 'testBuildType', /defaultConfig\s*\{/, DETOX_DEFAULT_CONFIG);
  next = insertOnce(
    next,
    'proguard-rules-app.pro',
    /proguardFiles getDefaultProguardFile\("proguard-android\.txt"\), "proguard-rules\.pro"/,
    `            ${DETOX_PROGUARD}`
  );
  next = insertOnce(next, 'com.wix:detox', /\ndependencies\s*\{/, DETOX_DEPENDENCY);
  return next;
};

/** @type {import('@expo/config-plugins').ConfigPlugin} */
const withDetoxAndroid = (config) => {
  config = withProjectBuildGradle(config, (mod) => {
    mod.modResults.contents = addDetoxToProjectGradle(mod.modResults.contents);
    return mod;
  });

  config = withAppBuildGradle(config, (mod) => {
    mod.modResults.contents = addDetoxToAppGradle(mod.modResults.contents);
    return mod;
  });

  config = withDangerousMod(config, [
    'android',
    (mod) => {
      const pkg = mod.android?.package;
      if (!pkg) throw new Error('withDetoxAndroid: android.package가 필요합니다');
      const src = path.join(mod.modRequest.platformProjectRoot, 'app', 'src');
      writeFile(
        path.join(src, 'androidTest', 'java', ...pkg.split('.')),
        'DetoxTest.java',
        detoxTestJava(pkg)
      );
      writeFile(
        path.join(src, 'release', 'res', 'xml'),
        'network_security_config.xml',
        E2E_RELEASE_NSC_XML
      );
      return mod;
    },
  ]);

  return config;
};

module.exports = withDetoxAndroid;
module.exports.addDetoxToProjectGradle = addDetoxToProjectGradle;
module.exports.addDetoxToAppGradle = addDetoxToAppGradle;
module.exports.E2E_RELEASE_NSC_XML = E2E_RELEASE_NSC_XML;
