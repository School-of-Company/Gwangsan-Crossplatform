import { device } from 'detox';

// 앱 실행 후 첫 화면(온보딩·홈)을 기다리는 시간. Debug 빌드는 첫 실행에 Metro 번들 로딩이 포함된다
export const FIRST_SCREEN_TIMEOUT_MS = 40000;

const LAUNCH_RETRY_COUNT = 3;
const RETRY_DELAY_MS = 3000;

// debug 빌드(expo-dev-client)는 JS 번들이 없어 런처 화면에 머문다. `E2E_METRO_URL`이 있으면
// dev-launcher의 `--initialUrl` 실행 인자로 Metro 주소를 넘겨 실행과 동시에 앱을 띄운다.
// (실행 뒤 openURL로 여는 방식은 CI에서 앱이 막 뜨는 중에 요청이 거절되곤 했다)
const devServerLaunchArgs = (): Record<string, string> => {
  const metroUrl = process.env.E2E_METRO_URL;
  // Detox는 실행 인자 키 앞에 '-'를 붙이므로 '-initialUrl'이 '--initialUrl'이 된다
  return metroUrl ? { '-initialUrl': metroUrl } : {};
};

// CI의 iOS 시뮬레이터에서 SpringBoard가 간헐적으로 크래시하며 launchApp이 실패하는 경우가 있어
// (FBSOpenApplicationServiceErrorDomain code=5) 재시도로 완화한다.
export async function launchAppResilient(config: Detox.DeviceLaunchAppConfig): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= LAUNCH_RETRY_COUNT; attempt++) {
    try {
      await device.launchApp({
        ...config,
        launchArgs: {
          ...config.launchArgs,
          // debug 빌드에서 개발자 메뉴가 화면을 가리지 않도록 한다 (release 빌드에는 영향 없음)
          EXDevMenuIsOnboardingFinished: true,
          EXDevMenuShowsAtLaunch: false,
          EXDevMenuShowFloatingActionButton: false,
          ...devServerLaunchArgs(),
        },
      });
      return;
    } catch (error) {
      lastError = error;
      console.warn(
        `[e2e] device.launchApp() attempt ${attempt}/${LAUNCH_RETRY_COUNT} failed:`,
        error
      );
      if (attempt < LAUNCH_RETRY_COUNT) {
        await device.terminateApp().catch(() => undefined);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  throw lastError;
}
