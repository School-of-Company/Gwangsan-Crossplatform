/* global describe, it, expect */
const {
  addDetoxToAppGradle,
  addDetoxToProjectGradle,
  E2E_RELEASE_NSC_XML,
} = require('../withDetoxAndroid');
const { NSC_XML } = require('../withNetworkSecurityConfig');

const PROJECT_GRADLE = `allprojects {
  repositories {
    google()
    mavenCentral()
  }
}
`;

const APP_GRADLE = `android {
    defaultConfig {
        applicationId 'gwangsan.io.kr'
    }
    buildTypes {
        release {
            minifyEnabled enableMinifyInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}

dependencies {
    implementation("com.facebook.react:react-android")
}
`;

describe('withDetoxAndroid', () => {
  it('루트 build.gradle에 Detox 로컬 maven 저장소를 한 번만 넣는다', () => {
    const once = addDetoxToProjectGradle(PROJECT_GRADLE);
    expect(once).toContain('node_modules/detox/Detox-android');
    expect(addDetoxToProjectGradle(once)).toBe(once);
  });

  it('app/build.gradle에 testBuildType·Detox proguard·detox 의존성을 한 번만 넣는다', () => {
    const once = addDetoxToAppGradle(APP_GRADLE);
    expect(once).toMatch(/defaultConfig \{\n\s+testBuildType System\.getProperty/);
    expect(once).toContain("testInstrumentationRunner 'androidx.test.runner.AndroidJUnitRunner'");
    expect(once).toMatch(
      /"proguard-rules\.pro"\n\s+proguardFile .*detox\/proguard-rules-app\.pro"/
    );
    expect(once).toContain("androidTestImplementation('com.wix:detox:+')");
    expect(once).toContain('minifyEnabled enableMinifyInReleaseBuilds');
    expect(addDetoxToAppGradle(once)).toBe(once);
  });

  it('기준 위치를 못 찾으면 조용히 넘어가지 않고 실패한다', () => {
    expect(() => addDetoxToAppGradle('android {}')).toThrow('withDetoxAndroid');
  });

  it('E2E release NSC는 운영 NSC에 localhost cleartext만 더한다', () => {
    expect(
      E2E_RELEASE_NSC_XML.startsWith(NSC_XML.replace('</network-security-config>\n', ''))
    ).toBe(true);
    expect(E2E_RELEASE_NSC_XML).toContain('<domain includeSubdomains="false">localhost</domain>');
    expect(E2E_RELEASE_NSC_XML.match(/cleartextTrafficPermitted="true"/g)).toHaveLength(1);
  });
});
