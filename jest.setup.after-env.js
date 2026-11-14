/* global jest, beforeAll, afterEach, afterAll */
// 공용 MSW 서버. 각 테스트는 server.use(...)로 핸들러를 덮어쓰고, 여기서 매 테스트 뒤 되돌린다.
// 처리되지 않은 요청은 조용히 실패하지 않도록 error로 막는다.
const { server } = require('./src/mocks/server');

// 실제 axios instance를 쓰는 테스트가 sessionCleanup을 거쳐 expo-notifications를 불러오면
// Expo Go 경고가 파일마다 찍힌다. 개별 테스트가 필요하면 자기 파일에서 다시 mock한다.
jest.mock('expo-notifications', () => ({
  setBadgeCountAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
