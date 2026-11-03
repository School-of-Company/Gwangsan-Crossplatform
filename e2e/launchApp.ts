import { device, element, by, expect } from 'detox';

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

async function isVisible(matcher: Detox.NativeMatcher): Promise<boolean> {
  try {
    await expect(element(matcher)).toBeVisible();
    return true;
  } catch {
    return false;
  }
}

// 새로 설치한 앱의 첫 실행에서 dev-launcher의 매니페스트 요청이 CI Metro 응답을 10초 넘게 기다리다
// 시간 초과되면 앱 대신 런처 홈에 머문다. 앱 첫 화면(로그인·홈)이 뜰 때까지 보고, 런처 홈이면 재실행한다.
// 런처 본문은 SwiftUI라 Detox 뷰 계층에 텍스트가 없으므로 UIKit 탭 버튼('Updates')으로 판별한다
async function assertConnectedToDevServer(): Promise<void> {
  if (!process.env.E2E_METRO_URL) return;
  // Detox가 RN 0.85 Fabric의 mount-item dispatcher를 리플렉션으로 조회하다 실패해
  // 첫 element 매칭에서 연결이 끊기는 문제 우회 (https://github.com/wix/Detox/issues/4963)
  await device.disableSynchronization();

  const deadline = Date.now() + FIRST_SCREEN_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await isVisible(by.text('Updates'))) {
      throw new Error('dev-launcher가 Metro에 연결하지 못하고 런처 홈에 머물렀습니다.');
    }
    const onAppScreen =
      (await isVisible(by.text('로그인'))) || (await isVisible(by.id('Footer-profile-button')));
    if (onAppScreen) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

// CI의 iOS 시뮬레이터에서 SpringBoard가 간헐적으로 크래시하며 launchApp이 실패하는 경우가 있어
// (FBSOpenApplicationServiceErrorDomain code=5) 재시도로 완화한다.
export async function launchAppResilient(config: Detox.DeviceLaunchAppConfig): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= LAUNCH_RETRY_COUNT; attempt++) {
    try {
      await device.launchApp({
        ...config,
        // 재시도까지 재설치하면 다시 '새로 설치한 첫 실행'이 되어 같은 연결 실패를 반복한다
        delete: attempt === 1 ? config.delete : false,
        launchArgs: {
          ...config.launchArgs,
          // debug 빌드에서 개발자 메뉴가 화면을 가리지 않도록 한다 (release 빌드에는 영향 없음)
          EXDevMenuIsOnboardingFinished: true,
          EXDevMenuShowsAtLaunch: false,
          EXDevMenuShowFloatingActionButton: false,
          ...devServerLaunchArgs(),
        },
      });
      await assertConnectedToDevServer();
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
