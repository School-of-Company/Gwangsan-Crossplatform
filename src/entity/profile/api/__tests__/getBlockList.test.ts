import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { getBlockList } from '../getBlockList';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

describe('getBlockList', () => {
  it('GET /block 응답 data를 반환한다', async () => {
    server.use(
      http.get(`${BASE}/block`, () => HttpResponse.json([{ memberId: 3, nickname: '차단된유저' }]))
    );

    await expect(getBlockList()).resolves.toEqual([{ memberId: 3, nickname: '차단된유저' }]);
  });

  it('실패하면 서버 메시지를 담은 에러를 던진다', async () => {
    server.use(
      http.get(`${BASE}/block`, () =>
        HttpResponse.json({ message: '권한이 없습니다' }, { status: 403 })
      )
    );

    await expect(getBlockList()).rejects.toThrow('권한이 없습니다');
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.get(`${BASE}/block`, () => HttpResponse.error()));

    await expect(getBlockList()).rejects.toThrow();
  });
});
