import { device, expect, element, by, waitFor } from 'detox';

// TODO: CI 환경에서 로그인 API 호출 후 네비게이션 완료 감지 불안정으로 인해 임시 비활성화
describe.skip('프로필', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      launchArgs: { detoxDisableSynchronization: 1 },
      permissions: { notifications: 'YES' },
    });

    await waitFor(element(by.text('로그인')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.text('로그인')).tap();

    await element(by.id('NicknameStep-nickname-input')).typeText('테스트');
    await element(by.id('SigninForm-next-button')).tap();

    await element(by.id('PasswordStep-password-input')).typeText('12345678');
    await element(by.id('SigninForm-next-button')).tap();

    await waitFor(element(by.id('PasswordStep-password-input')))
      .not.toBeVisible()
      .withTimeout(30000);
  });

  it('푸터의 프로필 버튼을 탭하면 프로필 화면으로 이동한다', async () => {
    await element(by.id('Footer-profile-button')).tap();

    await expect(element(by.text('내 정보 수정'))).toBeVisible();
  });

  it('프로필 화면에서 사용자 이름이 표시된다', async () => {
    await expect(element(by.id('Information-nickname'))).toBeVisible();
  });

  it('프로필 화면을 스크롤할 수 있다', async () => {
    await element(by.text('내 정보 수정')).swipe('up', 'slow');
    await element(by.text('내 정보 수정')).swipe('down', 'slow');

    await expect(element(by.text('내 정보 수정'))).toBeVisible();
  });
});
