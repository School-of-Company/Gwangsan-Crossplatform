import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { logger } from '~/shared/lib/logger';
import { server } from '~/mocks/server';
import { createItem } from '../createItem';
import { ItemFormRequestBody } from '../../model/itemFormSchema';

jest.mock('~/shared/lib/logger', () => ({
  logger: { error: jest.fn() },
}));

const mockLoggerError = logger.error as jest.Mock;

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

beforeEach(() => mockLoggerError.mockClear());

const makeRequestBody = (overrides: Partial<ItemFormRequestBody> = {}): ItemFormRequestBody => ({
  type: 'OBJECT',
  mode: 'GIVER',
  title: '제목',
  content: '내용',
  gwangsan: 10,
  ...overrides,
});

describe('createItem', () => {
  it('POST /post에 imageIds를 포함한 본문을 보내고 응답 data를 반환한다', async () => {
    const body = makeRequestBody({ imageIds: [1, 2, 3] });
    const received = jest.fn();
    server.use(
      http.post(`${BASE}/post`, async ({ request }) => {
        received(await request.json());
        return HttpResponse.json({ id: 1, ...body });
      })
    );

    await expect(createItem(body)).resolves.toEqual({ id: 1, ...body });
    expect(received).toHaveBeenCalledWith(body);
  });

  it('API 실패 시 서버 메시지를 담은 에러를 throw하고 logger.error를 호출한다', async () => {
    server.use(
      http.post(`${BASE}/post`, () =>
        HttpResponse.json({ message: '제목을 입력해주세요' }, { status: 400 })
      )
    );

    await expect(createItem(makeRequestBody())).rejects.toThrow('제목을 입력해주세요');
    expect(mockLoggerError).toHaveBeenCalledWith('createItem failed', expect.any(Error));
  });

  it('네트워크 오류는 에러를 throw하고 logger.error를 호출한다', async () => {
    server.use(http.post(`${BASE}/post`, () => HttpResponse.error()));

    await expect(createItem(makeRequestBody())).rejects.toThrow();
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
  });
});
