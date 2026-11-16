import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { getMyInformation } from '../getMyInformation';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

describe('getMyInformation', () => {
  it('GET /member 응답 data를 반환한다', async () => {
    server.use(
      http.get(`${BASE}/member`, () =>
        HttpResponse.json({ memberId: 1, headName: '본점', dongName: '동', placeName: '지점' })
      )
    );

    await expect(getMyInformation()).resolves.toEqual({
      memberId: 1,
      headName: '본점',
      dongName: '동',
      placeName: '지점',
    });
  });

  it('실패하면 서버 메시지를 담은 에러를 던진다', async () => {
    server.use(
      http.get(`${BASE}/member`, () => HttpResponse.json({ message: '서버 오류' }, { status: 400 }))
    );

    await expect(getMyInformation()).rejects.toThrow('서버 오류');
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.get(`${BASE}/member`, () => HttpResponse.error()));

    await expect(getMyInformation()).rejects.toThrow();
  });
});
