import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { getNoticeDetail } from '../getNoticeDetail';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

const makeNotice = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  title: '공지사항',
  content: '공지 내용입니다.',
  place: '광산구청',
  createdAt: '2025-01-15',
  role: 'ROLE_PLACE_ADMIN',
  images: [],
  ...overrides,
});

describe('getNoticeDetail', () => {
  it('GET /notice/:id 호출 후 데이터를 반환한다', async () => {
    const notice = makeNotice({
      id: 99999,
      images: [
        { imageId: 1, imageUrl: 'https://example.com/1.png' },
        { imageId: 2, imageUrl: 'https://example.com/2.png' },
      ],
    });
    const requested = jest.fn();
    server.use(
      http.get(`${BASE}/notice/:id`, ({ params }) => {
        requested(params.id);
        return HttpResponse.json(notice);
      })
    );

    await expect(getNoticeDetail(99999)).resolves.toEqual(notice);
    expect(requested).toHaveBeenCalledWith('99999');
  });

  it('place, createdAt이 빈 문자열인 경우도 그대로 반환한다', async () => {
    server.use(
      http.get(`${BASE}/notice/1`, () =>
        HttpResponse.json(makeNotice({ place: '', createdAt: '' }))
      )
    );

    const result = await getNoticeDetail(1);

    expect(result.place).toBe('');
    expect(result.createdAt).toBe('');
  });

  it('없는 공지는 서버 메시지를 담은 에러를 던진다', async () => {
    server.use(
      http.get(`${BASE}/notice/404`, () =>
        HttpResponse.json({ message: '공지를 찾을 수 없습니다' }, { status: 404 })
      )
    );

    await expect(getNoticeDetail(404)).rejects.toThrow('공지를 찾을 수 없습니다');
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.get(`${BASE}/notice/1`, () => HttpResponse.error()));

    await expect(getNoticeDetail(1)).rejects.toThrow();
  });
});
