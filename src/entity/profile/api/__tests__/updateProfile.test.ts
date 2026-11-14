import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { updateProfile } from '../updateProfile';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

describe('updateProfile', () => {
  const payload = { nickname: '새닉네임', specialties: ['요리'], description: '소개' };

  it('PATCH /member로 프로필 수정을 요청한다', async () => {
    const received = jest.fn();
    server.use(
      http.patch(`${BASE}/member`, async ({ request }) => {
        received(await request.json());
        return new HttpResponse(null, { status: 204 });
      })
    );

    await expect(updateProfile(payload)).resolves.toBeUndefined();
    expect(received).toHaveBeenCalledWith(payload);
  });

  it('서버 원문 대신 응답 본문의 메시지로 바꿔 던진다', async () => {
    server.use(
      http.patch(`${BASE}/member`, () =>
        HttpResponse.json({ message: '별칭은 2자 이상이어야 합니다.' }, { status: 400 })
      )
    );

    await expect(updateProfile(payload)).rejects.toThrow('별칭은 2자 이상이어야 합니다.');
  });

  it('409(별칭 중복)는 본문이 없어도 원인을 알 수 있는 메시지로 바꿔 던진다', async () => {
    server.use(http.patch(`${BASE}/member`, () => new HttpResponse(null, { status: 409 })));

    await expect(updateProfile(payload)).rejects.toThrow(
      '이미 사용 중인 별칭입니다. 다른 별칭을 입력해주세요.'
    );
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.patch(`${BASE}/member`, () => HttpResponse.error()));

    await expect(updateProfile(payload)).rejects.toThrow();
  });
});
