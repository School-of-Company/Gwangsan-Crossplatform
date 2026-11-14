import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { getAlertList } from '../getAlertList';
import { AlertType } from '../../model/alertTypes';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

const makeAlert = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  title: '알림 제목',
  content: '알림 내용',
  alertType: AlertType.NOTICE,
  createdAt: '2026-01-01T00:00:00.000Z',
  images: [],
  sendMemberId: 1,
  sourceId: 1,
  ...overrides,
});

describe('getAlertList', () => {
  it('GET /alert 응답 data를 반환한다', async () => {
    const alerts = [
      makeAlert({ id: 1, alertType: AlertType.TRADE_COMPLETE }),
      makeAlert({ id: 2, alertType: AlertType.REVIEW }),
    ];
    server.use(http.get(`${BASE}/alert`, () => HttpResponse.json(alerts)));

    await expect(getAlertList()).resolves.toEqual(alerts);
  });

  it('빈 배열 응답도 정상 반환한다', async () => {
    server.use(http.get(`${BASE}/alert`, () => HttpResponse.json([])));

    await expect(getAlertList()).resolves.toEqual([]);
  });

  it('실패하면 서버 메시지를 담은 에러를 던진다', async () => {
    server.use(
      http.get(`${BASE}/alert`, () =>
        HttpResponse.json({ message: '알림을 불러오지 못했습니다' }, { status: 403 })
      )
    );

    await expect(getAlertList()).rejects.toThrow('알림을 불러오지 못했습니다');
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.get(`${BASE}/alert`, () => HttpResponse.error()));

    await expect(getAlertList()).rejects.toThrow();
  });
});
