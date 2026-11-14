/* global beforeAll, afterEach, afterAll */
// 공용 MSW 서버. 각 테스트는 server.use(...)로 핸들러를 덮어쓰고, 여기서 매 테스트 뒤 되돌린다.
// 처리되지 않은 요청은 조용히 실패하지 않도록 error로 막는다.
const { server } = require('./src/mocks/server');

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
