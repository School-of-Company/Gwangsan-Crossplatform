import { AxiosError } from 'axios';
import { instance } from '~/shared/lib/axios';
import { findNickname } from '../findNickname';

jest.mock('~/shared/lib/axios', () => ({
  instance: {
    post: jest.fn(),
    delete: jest.fn(),
    get: jest.fn(),
  },
}));

const mockInstance = instance as jest.Mocked<typeof instance>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('findNickname', () => {
  it('닉네임 찾기 성공 시 nickname을 반환한다', async () => {
    mockInstance.post.mockResolvedValue({ data: { nickname: '홍길동' } });

    const result = await findNickname('01012345678');

    expect(result).toBe('홍길동');
  });

  it('/auth/nickname 엔드포인트로 phoneNumber를 전송한다', async () => {
    mockInstance.post.mockResolvedValue({ data: { nickname: 'user' } });

    await findNickname('01099998888');

    expect(mockInstance.post).toHaveBeenCalledWith('/auth/nickname', {
      phoneNumber: '01099998888',
    });
  });

  it('서버 에러 시 서버 메시지로 에러를 throw한다', async () => {
    const error = new AxiosError('Not Found');
    (error as any).response = {
      status: 404,
      data: { message: '일치하는 회원이 없습니다' },
    };
    mockInstance.post.mockRejectedValue(error);

    await expect(findNickname('01012345678')).rejects.toThrow('일치하는 회원이 없습니다');
  });

  it('응답에 status만 있으면 코드 기반 에러 메시지를 throw한다', async () => {
    const error = new AxiosError('Internal Server Error');
    (error as any).response = { status: 500, data: {} };
    mockInstance.post.mockRejectedValue(error);

    await expect(findNickname('01012345678')).rejects.toThrow('요청이 실패했습니다. (500)');
  });

  it('네트워크 에러 시 에러를 throw한다', async () => {
    mockInstance.post.mockRejectedValue(new Error('Network Error'));

    await expect(findNickname('01012345678')).rejects.toThrow('Network Error');
  });
});
