import { AxiosError } from 'axios';
import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { deletePost } from '../deletePost';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

describe('deletePost', () => {
  it('DELETE /post/:id를 호출하고 아무것도 반환하지 않는다', async () => {
    const requested = jest.fn();
    server.use(
      http.delete(`${BASE}/post/:id`, ({ params }) => {
        requested(params.id);
        return new HttpResponse(null, { status: 204 });
      })
    );

    await expect(deletePost(99)).resolves.toBeUndefined();
    expect(requested).toHaveBeenCalledWith('99');
  });

  it('4xx 응답은 서버 메시지를 담은 에러로 던진다', async () => {
    server.use(
      http.delete(`${BASE}/post/999`, () =>
        HttpResponse.json({ message: '게시글을 찾을 수 없습니다' }, { status: 404 })
      )
    );

    const error = await deletePost(999).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).response?.status).toBe(404);
    expect((error as Error).message).toBe('게시글을 찾을 수 없습니다');
  });

  it('5xx 응답은 상태 코드만 알리는 에러로 던진다', async () => {
    server.use(http.delete(`${BASE}/post/1`, () => new HttpResponse(null, { status: 500 })));

    const error = await deletePost(1).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).response?.status).toBe(500);
    expect((error as Error).message).toBe('요청이 실패했습니다. (500)');
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.delete(`${BASE}/post/1`, () => HttpResponse.error()));

    await expect(deletePost(1)).rejects.toThrow();
  });
});
