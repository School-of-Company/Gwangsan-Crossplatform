import { device, element, by, expect, waitFor } from 'detox';
import { FIRST_SCREEN_TIMEOUT_MS, launchAppResilient } from './launchApp';

// E2E 전용 테스트 계정. 운영 서버에 그대로 로그인하므로 쓰기 시나리오에서는 데이터를 남기지 않도록 주의한다
export const E2E_NICKNAME = process.env.E2E_NICKNAME ?? '테스트';
export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? '12345678';

async function isSignedIn(): Promise<boolean> {
  const deadline = Date.now() + FIRST_SCREEN_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      await expect(element(by.id('Footer-profile-button'))).toBeVisible();
      return true;
    } catch {
      // 아직 홈이 아니다
    }
    try {
      await expect(element(by.text('로그인'))).toBeVisible();
      return false;
    } catch {
      // 아직 온보딩도 아니다
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(
    `홈 화면과 로그인 화면 모두 ${FIRST_SCREEN_TIMEOUT_MS / 1000}초 안에 나타나지 않았습니다.`
  );
}

async function isVisible(matcher: Detox.NativeMatcher): Promise<boolean> {
  try {
    await expect(element(matcher)).toBeVisible();
    return true;
  } catch {
    return false;
  }
}

// 동기화를 끈 상태라 replaceText 직후의 리턴 키가 입력값 state 반영보다 먼저 처리되면
// onSubmitEditing이 빈 값으로 판단해 넘어가지 않는다. 같은 화면에 남아 있으면 다시 누른다.
async function submitUntilVisible(
  inputId: string,
  next: Detox.NativeMatcher,
  timeoutMs: number
): Promise<void> {
  const attempts = 3;
  for (let attempt = 1; ; attempt++) {
    await element(by.id(inputId)).tapReturnKey();
    try {
      await waitFor(element(next)).toBeVisible().withTimeout(timeoutMs);
      return;
    } catch (error) {
      if (attempt >= attempts || !(await isVisible(by.id(inputId)))) throw error;
    }
  }
}

export async function launchAndSignIn(): Promise<void> {
  await launchAppResilient({
    newInstance: true,
    delete: true,
    launchArgs: { detoxDisableSynchronization: 1 },
    permissions: { notifications: 'YES', photos: 'YES' },
  });
  // Detox가 RN 0.85 Fabric의 mount-item dispatcher를 리플렉션으로 조회하다 실패해
  // 첫 element 매칭에서 연결이 끊기는 문제 우회 (https://github.com/wix/Detox/issues/4963)
  await device.disableSynchronization();

  // iOS 시뮬레이터는 앱을 지워도 키체인(토큰)이 남아 이미 로그인된 채로 열릴 수 있다
  if (await isSignedIn()) return;

  await element(by.text('로그인')).tap();

  await waitFor(element(by.id('NicknameStep-nickname-input')))
    .toBeVisible()
    .withTimeout(5000);
  await element(by.id('NicknameStep-nickname-input')).tap();
  await element(by.id('NicknameStep-nickname-input')).replaceText(E2E_NICKNAME);
  await submitUntilVisible(
    'NicknameStep-nickname-input',
    by.id('PasswordStep-password-input'),
    5000
  );

  await element(by.id('PasswordStep-password-input')).tap();
  await element(by.id('PasswordStep-password-input')).replaceText(E2E_PASSWORD);
  await submitUntilVisible('PasswordStep-password-input', by.id('Footer-profile-button'), 30000);
}
