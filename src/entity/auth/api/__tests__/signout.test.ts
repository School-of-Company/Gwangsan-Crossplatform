import { AxiosError } from 'axios';
import { instance } from '~/shared/lib/axios';
import { clearAuthTokens } from '~/shared/lib/auth';
import { signout } from '../signout';

jest.mock('~/shared/lib/axios', () => ({
  instance: {
    post: jest.fn(),
    delete: jest.fn(),
    get: jest.fn(),
  },
}));
jest.mock('~/shared/lib/auth', () => ({
  clearAuthTokens: jest.fn(),
}));

const mockInstance = instance as jest.Mocked<typeof instance>;
const mockClearAuthTokens = clearAuthTokens as jest.MockedFunction<typeof clearAuthTokens>;

beforeEach(() => {
  jest.clearAllMocks();
  mockClearAuthTokens.mockResolvedValue(undefined);
});

describe('signout', () => {
  it('로그아웃 성공 시 응답 메시지를 반환하고 토큰을 초기화한다', async () => {
    mockInstance.delete.mockResolvedValue({ data: { message: 'success' } });

    const result = await signout();

    expect(result).toEqual({ message: 'success' });
    expect(mockClearAuthTokens).toHaveBeenCalledTimes(1);
  });

  it('/auth/signout 엔드포인트로 DELETE 요청을 보낸다', async () => {
    mockInstance.delete.mockResolvedValue({ data: { message: 'ok' } });

    await signout();

    expect(mockInstance.delete).toHaveBeenCalledWith('/auth/signout');
  });

  it('서버 에러(네트워크 등) 시에도 토큰을 초기화하고 에러를 throw한다', async () => {
    mockInstance.delete.mockRejectedValue(new Error('Network Error'));

    await expect(signout()).rejects.toThrow('Network Error');
    expect(mockClearAuthTokens).toHaveBeenCalledTimes(1);
  });

  it('axios 에러 응답 메시지를 파싱해서 throw한다', async () => {
    const error = new AxiosError('Forbidden');
    (error as any).response = { status: 403, data: { message: '이미 로그아웃된 상태입니다' } };
    mockInstance.delete.mockRejectedValue(error);

    await expect(signout()).rejects.toThrow('이미 로그아웃된 상태입니다');
    expect(mockClearAuthTokens).toHaveBeenCalledTimes(1);
  });
});
