import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { clearAuthTokens } from '~/shared/lib/auth';
import { server } from '~/mocks/server';
import { signup } from '../signup';

// 요청 인터셉터가 getAccessToken을 쓰므로 토큰 삭제만 mock으로 바꾼다
jest.mock('~/shared/lib/auth', () => ({
  ...jest.requireActual('~/shared/lib/auth'),
  clearAuthTokens: jest.fn(),
}));

const mockClearAuthTokens = clearAuthTokens as jest.MockedFunction<typeof clearAuthTokens>;

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

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
  mockClearAuthTokens.mockReset();
  mockClearAuthTokens.mockResolvedValue(undefined);
});

describe('signup', () => {
  it('인증 코드와 비밀번호 확인을 뺀 본문을 /auth/signup으로 보내고 응답을 반환한다', async () => {
    const received = jest.fn();
    server.use(
      http.post(`${BASE}/auth/signup`, async ({ request }) => {
        received(await request.json());
        return HttpResponse.json({ message: 'created' });
      })
    );

    await expect(signup(baseFormData)).resolves.toEqual({ message: 'created' });

    const { verificationCode: _code, passwordConfirm: _confirm, ...expectedBody } = baseFormData;
    expect(received).toHaveBeenCalledWith(expectedBody);
  });

  it('가입 전 기존 토큰을 초기화한다', async () => {
    server.use(http.post(`${BASE}/auth/signup`, () => HttpResponse.json({})));

    await signup(baseFormData);

    expect(mockClearAuthTokens).toHaveBeenCalledTimes(1);
  });

  it('서버 에러 시 서버 메시지로 에러를 throw한다', async () => {
    server.use(
      http.post(`${BASE}/auth/signup`, () =>
        HttpResponse.json({ message: '이미 존재하는 닉네임입니다' }, { status: 409 })
      )
    );

    await expect(signup(baseFormData)).rejects.toThrow('이미 존재하는 닉네임입니다');
  });

  it('네트워크 오류는 에러를 throw한다', async () => {
    server.use(http.post(`${BASE}/auth/signup`, () => HttpResponse.error()));

    await expect(signup(baseFormData)).rejects.toThrow();
  });
});
