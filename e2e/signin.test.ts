import { expect, element, by, waitFor } from 'detox';
import { collectCoverage } from './coverage';
import { FIRST_SCREEN_TIMEOUT_MS, launchSignedOut } from './launchApp';

describe('로그인', () => {
  afterAll(collectCoverage);

  beforeAll(launchSignedOut, 300000);

  it('로그인 버튼을 탭하면 별칭 입력 화면으로 이동한다', async () => {
    // Debug 빌드는 첫 실행 때 Metro에서 번들을 받아 올리느라 CI에서 10초를 넘기기도 한다
    await waitFor(element(by.text('로그인')))
      .toBeVisible()
      .withTimeout(FIRST_SCREEN_TIMEOUT_MS);
    await element(by.text('로그인')).tap();

    // placeholder와 description이 동일하므로 input testID로 확인
    await waitFor(element(by.id('NicknameStep-nickname-input')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.text('별칭'))).toBeVisible();
  });

  it('별칭 입력 후 비밀번호 화면으로 이동한다', async () => {
    await element(by.id('NicknameStep-nickname-input')).tap();
    await element(by.id('NicknameStep-nickname-input')).replaceText('테스트');
    // returnKeyType="next" + onSubmitEditing으로 키보드를 닫으면서 다음 단계로 이동
    await element(by.id('NicknameStep-nickname-input')).tapReturnKey();

    // placeholder와 description이 동일하므로 input testID로 확인
    await waitFor(element(by.id('PasswordStep-password-input')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.text('비밀번호'))).toBeVisible();
  });
});
