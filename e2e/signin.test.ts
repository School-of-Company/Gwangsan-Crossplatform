import { device, expect, element, by, waitFor } from 'detox';
import { collectCoverage } from './coverage';

describe('로그인', () => {
  afterAll(collectCoverage);

  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      launchArgs: { detoxDisableSynchronization: 1 },
      permissions: { notifications: 'YES' },
    });
  });

  it('로그인 버튼을 탭하면 별칭 입력 화면으로 이동한다', async () => {
    await waitFor(element(by.text('로그인')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.text('로그인')).tap();

    // placeholder와 description이 동일하므로 input testID로 확인
    await waitFor(element(by.id('NicknameStep-nickname-input')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.text('별칭'))).toBeVisible();
  });

  it('별칭 입력 후 비밀번호 화면으로 이동한다', async () => {
    await element(by.id('NicknameStep-nickname-input')).tap();
    await element(by.id('NicknameStep-nickname-input')).typeText('테스트');

    await waitFor(element(by.id('SigninForm-next-button')))
      .toBeVisible()
      .withTimeout(3000);
    await element(by.id('SigninForm-next-button')).tap();

    // placeholder와 description이 동일하므로 input testID로 확인
    await waitFor(element(by.id('PasswordStep-password-input')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.text('비밀번호'))).toBeVisible();
  });
});
