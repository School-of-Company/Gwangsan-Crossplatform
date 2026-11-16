import { AxiosError } from 'axios';
import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { createFeedback } from '../createFeedback';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

const request = {
  type: 'BUG' as const,
  content: '채팅이 안 보내져요.',
  imageIds: [3],
  appVersion: '1.2.2',
  osType: 'IOS' as const,
  osVersion: '18.0',
  deviceModel: 'iPhone 15',
};

describe('createFeedback', () => {
  it('POST /feedback으로 요청 데이터를 그대로 전송한다', async () => {
    const received = jest.fn();
    server.use(
      http.post(`${BASE}/feedback`, async ({ request: req }) => {
        received(await req.json());
        return new HttpResponse(null, { status: 201 });
      })
    );

    await expect(createFeedback(request)).resolves.toBeUndefined();
    expect(received).toHaveBeenCalledWith(request);
  });

  it('요청이 실패하면 서버 메시지를 담은 에러를 던진다', async () => {
    server.use(
      http.post(`${BASE}/feedback`, () =>
        HttpResponse.json({ message: '문의 내용을 입력해주세요' }, { status: 400 })
      )
    );

    const error = await createFeedback(request).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).response?.status).toBe(400);
    expect((error as Error).message).toBe('문의 내용을 입력해주세요');
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.post(`${BASE}/feedback`, () => HttpResponse.error()));

    await expect(createFeedback(request)).rejects.toThrow();
  });
});
