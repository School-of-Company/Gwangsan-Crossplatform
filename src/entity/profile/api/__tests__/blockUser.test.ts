import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { blockUser, unblockUser } from '../blockUser';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

describe('blockUser', () => {
  it('POST /block/:id 로 차단을 요청한다', async () => {
    const requested = jest.fn();
    server.use(
      http.post(`${BASE}/block/:id`, ({ params }) => {
        requested(params.id);
        return new HttpResponse(null, { status: 204 });
      })
    );

    await expect(blockUser(7)).resolves.toBeUndefined();
    expect(requested).toHaveBeenCalledWith('7');
  });

  it('실패하면 서버 메시지를 담은 에러를 던진다', async () => {
    server.use(
      http.post(`${BASE}/block/7`, () =>
        HttpResponse.json({ message: '이미 차단한 회원입니다' }, { status: 409 })
      )
    );

    await expect(blockUser(7)).rejects.toThrow('이미 차단한 회원입니다');
  });
});

describe('unblockUser', () => {
  it('DELETE /block/:id 로 차단 해제를 요청한다', async () => {
    const requested = jest.fn();
    server.use(
      http.delete(`${BASE}/block/:id`, ({ params }) => {
        requested(params.id);
        return new HttpResponse(null, { status: 204 });
      })
    );

    await expect(unblockUser(7)).resolves.toBeUndefined();
    expect(requested).toHaveBeenCalledWith('7');
  });

  it('실패하면 서버 메시지를 담은 에러를 던진다', async () => {
    server.use(
      http.delete(`${BASE}/block/7`, () =>
        HttpResponse.json({ message: '차단하지 않은 회원입니다' }, { status: 404 })
      )
    );

    await expect(unblockUser(7)).rejects.toThrow('차단하지 않은 회원입니다');
  });
});
