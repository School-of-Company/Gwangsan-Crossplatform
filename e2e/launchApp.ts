import { device } from 'detox';

const LAUNCH_RETRY_COUNT = 3;
const RETRY_DELAY_MS = 3000;

// CI의 iOS 시뮬레이터에서 SpringBoard가 간헐적으로 크래시하며 launchApp이 실패하는 경우가 있어
// (FBSOpenApplicationServiceErrorDomain code=5) 재시도로 완화한다.
export async function launchAppResilient(config: Detox.DeviceLaunchAppConfig): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= LAUNCH_RETRY_COUNT; attempt++) {
    try {
      await device.launchApp(config);
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
