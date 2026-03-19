import { device, expect, element, by } from 'detox';

// 로그인 상태가 필요한 테스트 — signin.test.ts 이후 실행 또는 토큰을 앱에 주입해야 한다
describe('프로필', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });

    // 로그인 선행 처리
    await expect(element(by.text('로그인'))).toBeVisible();
    await element(by.text('로그인')).tap();

    await element(by.id('NicknameStep-nickname-input')).typeText('테스트');
    await element(by.text('다음')).tap();

    await element(by.id('PasswordStep-password-input')).typeText('12345678');
    await element(by.id('SigninForm-next-button')).tap();

    await expect(element(by.text('로그인'))).not.toBeVisible();
  });

  it('푸터의 프로필 버튼을 탭하면 프로필 화면으로 이동한다', async () => {
    await element(by.id('Footer-profile-button')).tap();

    await expect(element(by.text('프로필'))).toBeVisible();
    await expect(element(by.text('내 정보 수정'))).toBeVisible();
  });

  it('프로필 화면에서 사용자 이름이 표시된다', async () => {
    await expect(element(by.text('테스트'))).toBeVisible();
  });

  it('프로필 화면을 스크롤할 수 있다', async () => {
    await element(by.text('프로필')).swipe('up', 'slow');
    await element(by.text('프로필')).swipe('down', 'slow');

    await expect(element(by.text('프로필'))).toBeVisible();
    await expect(element(by.text('내 정보 수정'))).toBeVisible();
  });
});
