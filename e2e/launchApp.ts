import { device } from 'detox';

const LAUNCH_RETRY_COUNT = 3;
const RETRY_DELAY_MS = 3000;

// debug 빌드(expo-dev-client)는 JS 번들이 없어 런처 화면에 머문다. 로컬에서
// `E2E_METRO_URL=http://localhost:8081`로 실행하면 실행 직후 Metro 주소를 열어 앱을 띄운다.
// CI는 JS가 포함된 release 빌드라 이 값을 쓰지 않는다.
async function openDevServerIfNeeded(): Promise<void> {
  const metroUrl = process.env.E2E_METRO_URL;
  if (!metroUrl) return;
  await device.openURL({
    url: `exp+my-expo-app://expo-development-client/?url=${encodeURIComponent(metroUrl)}`,
  });
}

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
        },
      });
      await openDevServerIfNeeded();
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
