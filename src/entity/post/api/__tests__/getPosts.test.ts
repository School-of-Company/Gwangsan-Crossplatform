import { AxiosError } from 'axios';
import { http, HttpResponse, type JsonBodyType } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { getPosts } from '../getPosts';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

const makeRawPost = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  title: '테스트 게시글',
  content: '내용',
  gwangsan: 1,
  type: 'OBJECT',
  mode: 'GIVER',
  images: [{ imageId: 1, imageUrl: 'https://example.com/img.jpg' }],
  isCompletable: true,
  isCompleted: false,
  ...overrides,
});

const useListResponse = (body: JsonBodyType) =>
  server.use(http.get(`${BASE}/post`, () => HttpResponse.json(body)));

describe('getPosts', () => {
  describe('성공 케이스', () => {
    it('응답 데이터를 PostType 형태로 변환해 반환한다', async () => {
      useListResponse([makeRawPost()]);

      const result = await getPosts();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        title: '테스트 게시글',
        imageUrls: [{ imageId: 1, imageUrl: 'https://example.com/img.jpg' }],
        isCompletable: true,
        isCompleted: false,
      });
    });

    it.each([
      ['images', 'imageUrls', []],
      ['isCompletable', 'isCompletable', false],
      ['isCompleted', 'isCompleted', false],
      ['isReserved', 'isReserved', false],
    ])('%s가 없으면 %s를 기본값으로 설정한다', async (missing, field, expected) => {
      useListResponse([makeRawPost({ [missing]: undefined })]);

      const result = await getPosts();

      expect(result[0]).toHaveProperty(field, expected);
    });

    it('type과 mode를 쿼리스트링으로 보낸다', async () => {
      const received = jest.fn();
      server.use(
        http.get(`${BASE}/post`, ({ request }) => {
          received(Object.fromEntries(new URL(request.url).searchParams));
          return HttpResponse.json([]);
        })
      );

      await getPosts('OBJECT', 'GIVER');

      expect(received).toHaveBeenCalledWith({ type: 'OBJECT', mode: 'GIVER' });
    });

    it('params 없이 호출하면 쿼리스트링 없이 요청한다', async () => {
      const received = jest.fn();
      server.use(
        http.get(`${BASE}/post`, ({ request }) => {
          received(new URL(request.url).search);
          return HttpResponse.json([]);
        })
      );

      await getPosts();

      expect(received).toHaveBeenCalledWith('');
    });
  });

  describe('에러 케이스', () => {
    it('4xx 응답은 서버 메시지를 담은 AxiosError로 던진다', async () => {
      server.use(
        http.get(`${BASE}/post`, () =>
          HttpResponse.json({ message: '잘못된 요청입니다' }, { status: 400 })
        )
      );

      const error = await getPosts().catch((e: unknown) => e);

      expect(error).toBeInstanceOf(AxiosError);
      expect((error as AxiosError).message).toBe('잘못된 요청입니다');
      expect((error as AxiosError).response?.status).toBe(400);
    });

    it('5xx 응답은 상태 코드만 알리는 AxiosError로 던진다', async () => {
      server.use(
        http.get(`${BASE}/post`, () => HttpResponse.json({ message: '서버 오류' }, { status: 500 }))
      );

      const error = await getPosts().catch((e: unknown) => e);

      expect(error).toBeInstanceOf(AxiosError);
      expect((error as AxiosError).message).toBe('요청이 실패했습니다. (500)');
    });

    it('네트워크 오류는 에러를 던진다', async () => {
      server.use(http.get(`${BASE}/post`, () => HttpResponse.error()));

      await expect(getPosts()).rejects.toThrow();
    });
  });
});
