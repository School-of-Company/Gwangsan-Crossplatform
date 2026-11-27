import { element, by, waitFor } from 'detox';
import { collectCoverage } from './coverage';
import { FIRST_SCREEN_TIMEOUT_MS, launchSignedOut } from './launchApp';

describe('앱 실행', () => {
  afterAll(collectCoverage);

  beforeAll(launchSignedOut, 300000);

  it('앱이 실행되고 초기 화면이 표시된다', async () => {
    await waitFor(element(by.text('로그인')))
      .toBeVisible()
      .withTimeout(FIRST_SCREEN_TIMEOUT_MS);
  });
});
