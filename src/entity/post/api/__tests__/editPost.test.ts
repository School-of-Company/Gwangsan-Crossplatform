import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { editPost } from '../editPost';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

const makeEditData = (overrides: Record<string, unknown> = {}) => ({
  type: 'OBJECT',
  mode: 'GIVER',
  title: '수정된 제목',
  content: '수정된 내용',
  gwangsan: 1,
  imageIds: [1, 2],
  ...overrides,
});

describe('editPost', () => {
  it('PATCH /post/:id에 payload를 보내고 응답 data를 반환한다', async () => {
    const data = makeEditData({ imageIds: [] });
    const received = jest.fn();
    server.use(
      http.patch(`${BASE}/post/:id`, async ({ params, request }) => {
        received(params.id, await request.json());
        return HttpResponse.json({ id: 99, ...data });
      })
    );

    await expect(editPost('99', data)).resolves.toEqual({ id: 99, ...data });
    expect(received).toHaveBeenCalledWith('99', data);
  });

  it('4xx 응답은 서버 메시지를 담은 에러로 던진다', async () => {
    server.use(
      http.patch(`${BASE}/post/1`, () =>
        HttpResponse.json({ message: '수정 권한이 없습니다' }, { status: 403 })
      )
    );

    await expect(editPost('1', makeEditData())).rejects.toThrow('수정 권한이 없습니다');
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.patch(`${BASE}/post/1`, () => HttpResponse.error()));

    await expect(editPost('1', makeEditData())).rejects.toThrow();
  });
});
