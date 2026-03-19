#!/bin/bash
set -e

ANDROID_DIR="$(cd "$(dirname "$0")/.." && pwd)/android"
APP_DIR="$ANDROID_DIR/app"
PACKAGE="gwangsan.io.kr"
PACKAGE_PATH="gwangsan/io/kr"
TEST_DIR="$APP_DIR/src/androidTest/java/$PACKAGE_PATH"

echo "Patching android/app/build.gradle for Detox..."

if ! grep -q "testInstrumentationRunner" "$APP_DIR/build.gradle"; then
  awk '/versionName/{
    print
    print "        testBuildType System.getProperty(\"testBuildType\", \"debug\")"
    print "        testInstrumentationRunner \"androidx.test.runner.AndroidJUnitRunner\""
    next
  }1' "$APP_DIR/build.gradle" > /tmp/build.gradle.tmp
  mv /tmp/build.gradle.tmp "$APP_DIR/build.gradle"
  echo "  ✓ testInstrumentationRunner 추가됨"
fi

if ! grep -q "com.wix:detox" "$APP_DIR/build.gradle"; then
  cat >> "$APP_DIR/build.gradle" << 'GRADLE'

dependencies {
    androidTestImplementation('com.wix:detox:+') { transitive = true }
    androidTestImplementation 'junit:junit:4.13.2'
}
GRADLE
  echo "  ✓ Detox dependencies 추가됨"
fi

echo "Creating androidTest AndroidManifest.xml..."
ANDROIDTEST_DIR="$APP_DIR/src/androidTest"
mkdir -p "$ANDROIDTEST_DIR"
cat > "$ANDROIDTEST_DIR/AndroidManifest.xml" << EOF
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">
    <uses-sdk tools:overrideLibrary="com.wix.detox"/>
    <application
        android:appComponentFactory="androidx.core.app.CoreComponentFactory"
        tools:replace="android:appComponentFactory"/>
</manifest>
EOF
echo "  ✓ androidTest AndroidManifest.xml 생성됨"

echo "Creating DetoxTest.kt at $TEST_DIR..."
mkdir -p "$TEST_DIR"
cat > "$TEST_DIR/DetoxTest.kt" << EOF
package $PACKAGE

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import androidx.test.rule.ActivityTestRule
import com.wix.detox.Detox
import com.wix.detox.config.DetoxConfig
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
@LargeTest
class DetoxTest {

    @Rule
    @JvmField
    val rule = ActivityTestRule(MainActivity::class.java, false, false)

    @Test
    fun runDetoxTests() {
        val detoxConfig = DetoxConfig()
        detoxConfig.idlePolicyConfig.masterTimeoutSec = 90
        detoxConfig.idlePolicyConfig.idleResourceTimeoutSec = 60
        Detox.runTests(rule, detoxConfig)
    }
}
EOF
echo "  ✓ DetoxTest.kt 생성됨 (package: $PACKAGE)"
echo "Android Detox 설정 완료"
