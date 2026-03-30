import { AxiosError } from 'axios';
import { instance } from '~/shared/lib/axios';
import { clearAuthTokens } from '@/shared/lib/auth';
import { signup } from '../signup';

jest.mock('~/shared/lib/axios', () => ({
  instance: {
    post: jest.fn(),
    delete: jest.fn(),
    get: jest.fn(),
  },
}));
jest.mock('@/shared/lib/auth', () => ({
  clearAuthTokens: jest.fn(),
}));

const mockInstance = instance as jest.Mocked<typeof instance>;
const mockClearAuthTokens = clearAuthTokens as jest.MockedFunction<typeof clearAuthTokens>;

const baseFormData = {
  name: '홍길동',
  nickname: 'gildong',
  password: 'pass1234!',
  passwordConfirm: 'pass1234!',
  phoneNumber: '01012345678',
  verificationCode: '123456',
  dongName: '광산동',
  placeId: 1,
  specialties: ['운동'],
  description: '자기소개',
  recommender: '',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockClearAuthTokens.mockResolvedValue(undefined);
});

describe('signup', () => {
  it('회원가입 성공 시 서버 응답 데이터를 반환한다', async () => {
    mockInstance.post.mockResolvedValue({ data: { message: 'created' } });

    const result = await signup(baseFormData);

    expect(result).toEqual({ message: 'created' });
  });

  it('verificationCode, passwordConfirm은 요청 바디에서 제외된다', async () => {
    mockInstance.post.mockResolvedValue({ data: {} });

    await signup(baseFormData);

    const sentData = mockInstance.post.mock.calls[0][1];
    expect(sentData).not.toHaveProperty('verificationCode');
    expect(sentData).not.toHaveProperty('passwordConfirm');
  });

  it('/auth/signup 엔드포인트로 POST 요청을 보낸다', async () => {
    mockInstance.post.mockResolvedValue({ data: {} });

    await signup(baseFormData);

    expect(mockInstance.post).toHaveBeenCalledWith(
      '/auth/signup',
      expect.not.objectContaining({ verificationCode: expect.anything() })
    );
  });

  it('가입 전 기존 토큰을 초기화한다', async () => {
    mockInstance.post.mockResolvedValue({ data: {} });

    await signup(baseFormData);

    expect(mockClearAuthTokens).toHaveBeenCalledTimes(1);
  });

  it('서버 에러 시 에러를 throw한다', async () => {
    const error = new AxiosError('Conflict');
    (error as any).response = { status: 409, data: { message: '이미 존재하는 닉네임입니다' } };
    mockInstance.post.mockRejectedValue(error);

    await expect(signup(baseFormData)).rejects.toThrow('이미 존재하는 닉네임입니다');
  });

  it('네트워크 에러 시 에러를 throw한다', async () => {
    mockInstance.post.mockRejectedValue(new Error('Network Error'));

    await expect(signup(baseFormData)).rejects.toThrow('Network Error');
  });
});
