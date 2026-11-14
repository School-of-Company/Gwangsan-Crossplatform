import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { getMyFeedback, getMyFeedbacks, MY_FEEDBACK_PAGE_SIZE } from '../getMyFeedbacks';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

const makeFeedback = (feedbackId: number) => ({
  feedbackId,
  type: 'BUG',
  content: `문의 ${feedbackId}`,
  images: [],
  status: 'RECEIVED',
  answer: null,
  answeredAt: null,
  createdAt: '2026-11-01T10:00:00',
});

// 요청이 도착한 쿼리 파라미터를 기록하고 주어진 응답을 돌려준다
const captureQuery = (response: unknown) => {
  const received = jest.fn();
  server.use(
    http.get(`${BASE}/feedback/me`, ({ request }) => {
      received(Object.fromEntries(new URL(request.url).searchParams));
      return HttpResponse.json(response as never);
    })
  );
  return received;
};

describe('getMyFeedbacks', () => {
  it('첫 페이지는 last_id 없이 size만 보낸다', async () => {
    const received = captureQuery([makeFeedback(3)]);

    await expect(getMyFeedbacks()).resolves.toEqual([makeFeedback(3)]);
    expect(received).toHaveBeenCalledWith({ size: String(MY_FEEDBACK_PAGE_SIZE) });
  });

  it('lastId가 있으면 last_id로 보낸다', async () => {
    const received = captureQuery([]);

    await getMyFeedbacks({ lastId: 7, size: 5 });

    expect(received).toHaveBeenCalledWith({ size: '5', last_id: '7' });
  });

  it('배열이 아닌 응답은 빈 배열로 바꾼다', async () => {
    captureQuery(null);

    await expect(getMyFeedbacks()).resolves.toEqual([]);
  });

  it('요청이 실패하면 서버 메시지를 담은 에러를 던진다', async () => {
    server.use(
      http.get(`${BASE}/feedback/me`, () =>
        HttpResponse.json({ message: '조회에 실패했습니다' }, { status: 403 })
      )
    );

    await expect(getMyFeedbacks()).rejects.toThrow('조회에 실패했습니다');
  });
});

describe('getMyFeedback', () => {
  it('last_id = id + 1, size = 1로 한 건을 조회한다', async () => {
    const received = captureQuery([makeFeedback(5)]);

    await expect(getMyFeedback(5)).resolves.toEqual(makeFeedback(5));
    expect(received).toHaveBeenCalledWith({ size: '1', last_id: '6' });
  });

  it('다른 id가 오면(내 문의가 아니거나 없음) null을 반환한다', async () => {
    captureQuery([makeFeedback(4)]);

    await expect(getMyFeedback(5)).resolves.toBeNull();
  });

  it('빈 배열이면 null을 반환한다', async () => {
    captureQuery([]);

    await expect(getMyFeedback(5)).resolves.toBeNull();
  });
});
