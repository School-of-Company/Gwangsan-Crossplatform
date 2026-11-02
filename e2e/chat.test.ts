import { expect, element, by, waitFor } from 'detox';
import { collectCoverage } from './coverage';
import { launchAndSignIn } from './login';

// 테스트 계정의 채팅방 상대는 실제 회원이라 메시지는 보내지 않는다.
// 입력은 replaceText로만 넣는다 — 리턴 키(onSubmitEditing)를 누르면 그대로 전송된다.
describe('채팅', () => {
  afterAll(collectCoverage);

  beforeAll(async () => {
    await launchAndSignIn();
  }, 300000);

  it('채팅 탭을 누르면 채팅 목록이 열린다', async () => {
    await element(by.id('Footer-chat-button')).tap();

    await waitFor(element(by.id('chat-room-list-loading')))
      .not.toExist()
      .withTimeout(15000);
  });

  it('채팅방을 열면 메시지 입력창이 보이고 입력할 수 있다', async () => {
    await waitFor(element(by.id('chat-room-item')).atIndex(0))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id('chat-room-item')).atIndex(0).tap();

    await waitFor(element(by.id('chat-input-text')))
      .toBeVisible()
      .withTimeout(15000);
    await element(by.id('chat-input-text')).replaceText('E2E 입력 확인');

    await expect(element(by.id('chat-input-text'))).toHaveText('E2E 입력 확인');
    await expect(element(by.id('chat-input-send'))).toBeVisible();

    await element(by.id('chat-input-text')).clearText();
  });
});
