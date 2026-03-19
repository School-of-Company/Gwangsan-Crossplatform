import { device, expect, element, by } from 'detox';

describe('로그인', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('로그인 버튼을 탭하면 별칭 입력 화면으로 이동한다', async () => {
    await expect(element(by.text('로그인'))).toBeVisible();
    await element(by.text('로그인')).tap();

    await expect(element(by.text('별칭을 입력해주세요'))).toBeVisible();
    await expect(element(by.text('별칭'))).toBeVisible();
  });

  it('별칭 입력 후 비밀번호 화면으로 이동한다', async () => {
    await element(by.id('NicknameStep-nickname-input')).tap();
    await element(by.id('NicknameStep-nickname-input')).typeText('테스트');

    await expect(element(by.text('다음'))).toBeVisible();
    await element(by.text('다음')).tap();

    await expect(element(by.text('비밀번호를 입력해주세요'))).toBeVisible();
    await expect(element(by.text('비밀번호'))).toBeVisible();
  });

  it('비밀번호 입력 후 로그인에 성공한다', async () => {
    await element(by.id('PasswordStep-password-input')).tap();
    await element(by.id('PasswordStep-password-input')).typeText('12345678');

    await element(by.id('SigninForm-next-button')).tap();

    // 로그인 성공 시 로그인 버튼이 사라진다
    await expect(element(by.text('로그인'))).not.toBeVisible();
  });
});
