import { device, element, by, waitFor } from 'detox';

describe('앱 실행', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      launchArgs: { detoxDisableSynchronization: 1 },
      permissions: { notifications: 'YES' },
    });
  });

  it('앱이 실행되고 초기 화면이 표시된다', async () => {
    await waitFor(element(by.text('로그인')))
      .toBeVisible()
      .withTimeout(15000);
  });
});
