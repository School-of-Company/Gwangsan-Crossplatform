import { instance } from '../apiInstance';
import { getRefreshToken } from '../auth';
import { setData } from '../setData';
import { refreshAccessToken, SessionExpiredError, TokenStorageError } from '../tokenRefresh';

jest.mock('../apiInstance', () => ({ instance: { post: jest.fn() } }));
jest.mock('../auth', () => ({ getRefreshToken: jest.fn() }));
jest.mock('../setData', () => ({ setData: jest.fn(() => Promise.resolve()) }));
jest.mock('../biometricCredentials', () => ({
  syncBiometricCredentials: jest.fn(() => Promise.resolve()),
}));
jest.mock('@sentry/react-native', () => ({ addBreadcrumb: jest.fn() }));

const mockPost = instance.post as jest.Mock;
const mockGetRefreshToken = getRefreshToken as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('refreshAccessToken', () => {
  it('동시에 여러 곳에서 호출해도 재발급 요청은 한 번만 보낸다', async () => {
    mockGetRefreshToken.mockResolvedValue('refresh');
    mockPost.mockResolvedValue({ data: { accessToken: 'new-token' } });

    const [a, b] = await Promise.all([
      refreshAccessToken('401 on /a'),
      refreshAccessToken('Socket handshake rejected'),
    ]);

    expect(a).toBe('new-token');
    expect(b).toBe('new-token');
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(setData).toHaveBeenCalledWith('accessToken', 'new-token');
  });

  it('끝난 뒤 다시 호출하면 새로 재발급한다', async () => {
    mockGetRefreshToken.mockResolvedValue('refresh');
    mockPost.mockResolvedValue({ data: { accessToken: 'new-token' } });

    await refreshAccessToken('first');
    await refreshAccessToken('second');

    expect(mockPost).toHaveBeenCalledTimes(2);
  });

  it('refresh token이 없으면 SessionExpiredError로 실패한다', async () => {
    mockGetRefreshToken.mockResolvedValue(null);

    await expect(refreshAccessToken('x')).rejects.toBeInstanceOf(SessionExpiredError);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('토큰 저장소를 읽지 못하면 TokenStorageError를 그대로 던진다', async () => {
    mockGetRefreshToken.mockRejectedValue(new Error('keychain locked'));

    await expect(refreshAccessToken('x')).rejects.toBeInstanceOf(TokenStorageError);
  });
});
