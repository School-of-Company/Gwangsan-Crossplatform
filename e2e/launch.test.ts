import { device, element, by, waitFor } from 'detox';
import { collectCoverage } from './coverage';
import { launchAppResilient } from './launchApp';

describe('앱 실행', () => {
  afterAll(collectCoverage);

  beforeAll(async () => {
    await launchAppResilient({
      newInstance: true,
      launchArgs: { detoxDisableSynchronization: 1 },
      permissions: { notifications: 'YES' },
    });
    // Detox가 RN 0.85 Fabric의 mount-item dispatcher를 리플렉션으로 조회하다 실패해
    // 첫 element 매칭에서 연결이 끊기는 문제 우회 (https://github.com/wix/Detox/issues/4963)
    await device.disableSynchronization();
  }, 300000);

  it('앱이 실행되고 초기 화면이 표시된다', async () => {
    await waitFor(element(by.text('로그인')))
      .toBeVisible()
      .withTimeout(15000);
  });
});
