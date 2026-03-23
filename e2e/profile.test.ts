import { device, expect, element, by, waitFor } from 'detox';

// 로그인 상태가 필요한 테스트 — signin.test.ts 이후 실행 또는 토큰을 앱에 주입해야 한다
describe('프로필', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      launchArgs: { detoxDisableSynchronization: 1 },
      permissions: { notifications: 'YES' },
    });

    // 로그인 선행 처리
    await waitFor(element(by.text('로그인')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.text('로그인')).tap();

    await element(by.id('NicknameStep-nickname-input')).typeText('테스트');
    await element(by.id('SigninForm-next-button')).tap();

    await element(by.id('PasswordStep-password-input')).typeText('12345678');
    await element(by.id('SigninForm-next-button')).tap();

    // 로그인 성공 시 PasswordStep이 사라진다 (네트워크 지연을 고려해 30초 대기)
    await waitFor(element(by.id('PasswordStep-password-input')))
      .not.toBeVisible()
      .withTimeout(30000);
  });

  it('푸터의 프로필 버튼을 탭하면 프로필 화면으로 이동한다', async () => {
    await element(by.id('Footer-profile-button')).tap();

    // Footer와 페이지 헤더 모두 "프로필" 텍스트를 가지므로 고유 요소로 확인
    await expect(element(by.text('내 정보 수정'))).toBeVisible();
  });

  it('프로필 화면에서 사용자 이름이 표시된다', async () => {
    await expect(element(by.text('테스트'))).toBeVisible();
  });

  it('프로필 화면을 스크롤할 수 있다', async () => {
    // 고유 요소로 스크롤 (Footer와 중복되는 "프로필" 텍스트 대신 사용)
    await element(by.text('내 정보 수정')).swipe('up', 'slow');
    await element(by.text('내 정보 수정')).swipe('down', 'slow');

    await expect(element(by.text('내 정보 수정'))).toBeVisible();
  });
});
