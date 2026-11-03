import { expect, element, by, waitFor } from 'detox';
import { collectCoverage } from './coverage';
import { launchAndSignIn } from './login';

describe('프로필', () => {
  afterAll(collectCoverage);

  beforeAll(async () => {
    await launchAndSignIn();
  }, 300000);

  it('푸터의 프로필 버튼을 탭하면 내 프로필의 별칭이 표시된다', async () => {
    await element(by.id('Footer-profile-button')).tap();

    await waitFor(element(by.id('Information-nickname')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('프로필 화면에 판매관리·거래내역 메뉴가 표시된다', async () => {
    await expect(element(by.text('판매관리'))).toBeVisible();
    await expect(element(by.text('거래내역'))).toBeVisible();
  });

  it('프로필 화면을 스크롤할 수 있다', async () => {
    await element(by.id('Information-nickname')).swipe('up', 'slow');
    await element(by.text('판매관리')).swipe('down', 'slow');

    await expect(element(by.id('Information-nickname'))).toBeVisible();
  });
});
