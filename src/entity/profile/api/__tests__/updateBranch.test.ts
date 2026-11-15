import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { updateBranch } from '../updateBranch';
import { BASE } from '~/mocks/constants';
import { expectAppError } from '~/test-utils/expectAppError';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

describe('updateBranch', () => {
  it('PATCH /member/place로 placeId를 보낸다', async () => {
    const received = jest.fn();
    server.use(
      http.patch(`${BASE}/member/place`, async ({ request }) => {
        received(await request.json());
        return new HttpResponse(null, { status: 204 });
      })
    );

    await expect(updateBranch({ placeId: 3 })).resolves.toBeUndefined();
    expect(received).toHaveBeenCalledWith({ placeId: 3 });
  });

  it('4xx는 서버 메시지로 바꾸되 상태 코드를 유지한 AxiosError로 던진다', async () => {
    server.use(
      http.patch(`${BASE}/member/place`, () =>
        HttpResponse.json({ message: '존재하지 않는 지점입니다.' }, { status: 404 })
      )
    );

    await expectAppError(updateBranch({ placeId: 999 }), 404, '존재하지 않는 지점입니다.');
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.patch(`${BASE}/member/place`, () => HttpResponse.error()));

    await expect(updateBranch({ placeId: 1 })).rejects.toThrow();
  });
});
