import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { setData } from '@/shared/lib/setData';
import { getDeviceInfo } from '@/shared/model/getDeviceInfo';
import { signinWithDeviceInfo } from '../signin';

jest.mock('~/shared/consts/api', () => ({ API_BASE_URL: 'http://test-api.com' }));
jest.mock('@/shared/lib/axios', () => ({
  instance: {
    defaults: { baseURL: 'http://test-api.com' },
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
  baseURL: 'http://test-api.com',
  setQueryClientInstance: jest.fn(),
}));
jest.mock('@/shared/lib/setData', () => ({
  setData: jest.fn(),
}));
jest.mock('@/shared/model/getDeviceInfo', () => ({
  getDeviceInfo: jest.fn(),
}));
jest.mock('~/shared/lib/biometricCredentials', () => ({}));
jest.mock('@sentry/react-native', () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
}));

const mockSetData = setData as jest.MockedFunction<typeof setData>;
const mockGetDeviceInfo = getDeviceInfo as jest.MockedFunction<typeof getDeviceInfo>;

const BASE = 'http://test-api.com';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => server.close());

const mockAuthResponse = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  accessTokenExpiresIn: '3600',
  refreshTokenExpiresIn: '86400',
};

const mockDeviceInfo = {
  deviceToken: 'device-token',
  deviceId: 'device-id',
  osType: 'IOS' as const,
};

describe('signinWithDeviceInfo', () => {
  it('로그인 성공 시 토큰을 저장하고 응답을 반환한다', async () => {
    mockGetDeviceInfo.mockResolvedValue(mockDeviceInfo);
    mockSetData.mockResolvedValue(undefined);

    server.use(http.post(`${BASE}/auth/signin`, () => HttpResponse.json(mockAuthResponse)));

    const result = await signinWithDeviceInfo({ nickname: 'user', password: 'pass1234!' });

    expect(result).toEqual(mockAuthResponse);
    expect(mockSetData).toHaveBeenCalledWith('accessToken', 'access-token');
    expect(mockSetData).toHaveBeenCalledWith('refreshToken', 'refresh-token');
  });

  it('서버가 401을 반환하면 에러를 throw한다', async () => {
    mockGetDeviceInfo.mockResolvedValue(mockDeviceInfo);

    server.use(
      http.post(`${BASE}/auth/signin`, () =>
        HttpResponse.json({ message: '아이디 또는 비밀번호가 올바르지 않습니다' }, { status: 401 })
      )
    );

    await expect(signinWithDeviceInfo({ nickname: 'user', password: 'wrong' })).rejects.toThrow(
      '아이디 또는 비밀번호가 올바르지 않습니다'
    );
  });

  it('서버가 500을 반환하면 에러 메시지를 throw한다', async () => {
    mockGetDeviceInfo.mockResolvedValue(mockDeviceInfo);

    server.use(http.post(`${BASE}/auth/signin`, () => new HttpResponse(null, { status: 500 })));

    await expect(signinWithDeviceInfo({ nickname: 'user', password: 'pass' })).rejects.toThrow();
  });

  it('getDeviceInfo가 실패하면 에러를 throw한다', async () => {
    mockGetDeviceInfo.mockRejectedValue(new Error('푸시 알림 권한이 필요합니다'));

    await expect(signinWithDeviceInfo({ nickname: 'user', password: 'pass' })).rejects.toThrow(
      '푸시 알림 권한이 필요합니다'
    );
  });

  it('서버 응답의 default message 패턴을 파싱한다', async () => {
    mockGetDeviceInfo.mockResolvedValue(mockDeviceInfo);

    server.use(
      http.post(`${BASE}/auth/signin`, () =>
        HttpResponse.json(
          { message: 'Validation failed: default message [닉네임을 입력해주세요]' },
          { status: 400 }
        )
      )
    );

    await expect(signinWithDeviceInfo({ nickname: '', password: 'pass' })).rejects.toThrow(
      '닉네임을 입력해주세요'
    );
  });
});
