import { expect, element, by, waitFor } from 'detox';
import { collectCoverage } from './coverage';
import { launchAndSignIn } from './login';

// 운영 서버에 글이 남지 않도록 "등록하기"는 누르지 않고, 작성 화면 진입·입력까지만 확인한다
describe('게시글 작성', () => {
  afterAll(collectCoverage);

  beforeAll(async () => {
    await launchAndSignIn();
  }, 300000);

  it('글쓰기 버튼으로 서비스 글 작성 화면에 들어간다', async () => {
    await element(by.id('Footer-write-button')).tap();

    await waitFor(element(by.id('WriteEntryModal-type-SERVICE')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('WriteEntryModal-type-SERVICE')).tap();

    await waitFor(element(by.id('WriteEntryModal-mode-GIVER')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('WriteEntryModal-mode-GIVER')).tap();

    await waitFor(element(by.id('ItemForm-title-input')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('주제·내용·광산을 입력할 수 있고 광산에는 숫자만 남는다', async () => {
    // 화면이 작은 기기에서는 키보드가 올라오면 맨 아래 광산 입력이 가려지므로 광산부터 입력한다
    await element(by.id('ItemForm-gwangsan-input')).tap();
    await element(by.id('ItemForm-gwangsan-input')).typeText('1a2');
    await element(by.id('ItemForm-title-input')).tap();
    await element(by.id('ItemForm-title-input')).replaceText('E2E 테스트 글');
    await element(by.id('ItemForm-content-input')).tap();
    await element(by.id('ItemForm-content-input')).replaceText('E2E 시나리오 입력 확인');

    await expect(element(by.id('ItemForm-title-input'))).toHaveText('E2E 테스트 글');
    await expect(element(by.id('ItemForm-gwangsan-input'))).toHaveText('12');
    await expect(element(by.text('등록하기'))).toExist();
  });
});
