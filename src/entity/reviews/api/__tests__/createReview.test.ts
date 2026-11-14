import { AxiosError } from 'axios';
import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { createReview } from '../createReview';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

const request = { productId: 99, otherMemberId: 8, content: '보통이에요', light: 50 };

describe('createReview', () => {
  it('POST /review에 payload를 보내고 true를 반환한다', async () => {
    const received = jest.fn();
    server.use(
      http.post(`${BASE}/review`, async ({ request: req }) => {
        received(await req.json());
        return new HttpResponse(null, { status: 201 });
      })
    );

    await expect(createReview(request)).resolves.toBe(true);
    expect(received).toHaveBeenCalledWith(request);
  });

  it('4xx 응답은 서버 메시지를 담은 에러로 던진다', async () => {
    server.use(
      http.post(`${BASE}/review`, () =>
        HttpResponse.json({ message: '이미 후기를 작성했습니다' }, { status: 409 })
      )
    );

    const error = await createReview(request).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).response?.status).toBe(409);
    expect((error as Error).message).toBe('이미 후기를 작성했습니다');
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.post(`${BASE}/review`, () => HttpResponse.error()));

    await expect(createReview(request)).rejects.toThrow();
  });
});
