set -e

ANDROID_DIR="$(cd "$(dirname "$0")/.." && pwd)/android"
APP_DIR="$ANDROID_DIR/app"
TEST_DIR="$APP_DIR/src/androidTest/java/com/app"

echo "Patching android/app/build.gradle for Detox..."

if ! grep -q "testInstrumentationRunner" "$APP_DIR/build.gradle"; then
  sed -i "s/versionName \"1.0\"/versionName \"1.0\"\n        testBuildType System.getProperty('testBuildType', 'debug')\n        testInstrumentationRunner 'androidx.test.runner.AndroidJUnitRunner'/" "$APP_DIR/build.gradle"
  echo "  ✓ testInstrumentationRunner 추가됨"
fi

if ! grep -q "com.wix:detox" "$APP_DIR/build.gradle"; then
  cat >> "$APP_DIR/build.gradle" << 'GRADLE'

dependencies {
    androidTestImplementation('com.wix:detox:+') { transitive = true }
    androidTestImplementation 'junit:junit:4.13.2'
}
GRADLE
  echo "  ✓ Detox androidTestImplementation 추가됨"
fi

echo "Creating DetoxTest.kt..."
mkdir -p "$TEST_DIR"
cat > "$TEST_DIR/DetoxTest.kt" << 'EOF'
package com.app

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
echo "  ✓ DetoxTest.kt 생성됨"
echo "Android Detox 설정 완료"
