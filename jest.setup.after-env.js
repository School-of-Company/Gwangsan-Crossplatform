/* global jest, beforeAll, afterEach, afterAll */
// 공용 MSW 서버. 각 테스트는 server.use(...)로 핸들러를 덮어쓰고, 여기서 매 테스트 뒤 되돌린다.
const { server } = require('./src/mocks/server');

// 실제 axios instance를 쓰는 테스트가 sessionCleanup을 거쳐 expo-notifications를 불러오면
// Expo Go 경고가 파일마다 찍힌다. 개별 테스트가 필요하면 자기 파일에서 다시 mock한다.
jest.mock('expo-notifications', () => ({
  setBadgeCountAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

// onUnhandledRequest: 'error'는 요청만 reject해서, 네트워크 오류를 기대하는 테스트는 핸들러 URL이 틀려도
// 통과한다. 처리되지 않은 요청을 모아 두었다가 테스트를 직접 실패시킨다.
const unhandledRequests = [];

beforeAll(() => {
  server.events.on('request:unhandled', ({ request }) => {
    unhandledRequests.push(`${request.method} ${request.url}`);
  });
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  if (unhandledRequests.length > 0) {
    const urls = unhandledRequests.splice(0).join('\n  ');
    throw new Error(`MSW 핸들러가 없는 요청이 있었습니다:\n  ${urls}`);
  }
});

afterAll(() => server.close());
