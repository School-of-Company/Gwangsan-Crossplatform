import { device, expect, element, by } from 'detox';

describe('앱 실행', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('앱이 실행되고 초기 화면이 표시된다', async () => {
    // 스플래시 또는 첫 화면이 렌더링될 때까지 대기
    await expect(element(by.text('로그인'))).toBeVisible();
  });
});
