import { getData } from '~/shared/lib/getData';
import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { createUserSessionService } from '../userSessionService';

jest.mock('~/shared/lib/getData', () => ({
  getData: jest.fn(),
}));

const mockGetData = getData as jest.MockedFunction<typeof getData>;

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createUserSessionService', () => {
  describe('getCurrentSession - loadSession', () => {
    it('memberId와 accessToken이 모두 있으면 캐시 없이 세션을 반환한다', async () => {
      mockGetData.mockImplementation(async (key: string) => {
        if (key === 'memberId') return '42';
        if (key === 'accessToken') return 'acc-token';
        if (key === 'refreshToken') return 'ref-token';
        return null;
      });

      const service = createUserSessionService();
      const session = await service.getCurrentSession();

      expect(session.memberId).toBe(42);
      expect(session.accessToken).toBe('acc-token');
      expect(session.refreshToken).toBe('ref-token');
    });

    it('refreshToken이 없으면 refreshToken은 undefined이다', async () => {
      mockGetData.mockImplementation(async (key: string) => {
        if (key === 'memberId') return '10';
        if (key === 'accessToken') return 'acc-token';
        return null;
      });

      const service = createUserSessionService();
      const session = await service.getCurrentSession();

      expect(session.refreshToken).toBeUndefined();
    });

    it('memberId가 없고 accessToken만 있으면 API에서 memberId를 가져온다', async () => {
      mockGetData.mockImplementation(async (key: string) => {
        if (key === 'accessToken') return 'acc-token';
        return null;
      });
      server.use(http.get(`${BASE}/member`, () => HttpResponse.json({ memberId: 99 })));

      const service = createUserSessionService();
      const session = await service.getCurrentSession();

      expect(session.memberId).toBe(99);
    });

    it('accessToken도 없으면 에러를 throw한다', async () => {
      mockGetData.mockResolvedValue(null);

      jest.spyOn(console, 'error').mockImplementation(() => {});
      const service = createUserSessionService();

      await expect(service.getCurrentSession()).rejects.toThrow('Authentication required');
    });

    it('API 호출 실패 시 에러를 throw한다', async () => {
      mockGetData.mockImplementation(async (key: string) => {
        if (key === 'accessToken') return 'acc-token';
        return null;
      });
      server.use(http.get(`${BASE}/member`, () => HttpResponse.error()));

      jest.spyOn(console, 'error').mockImplementation(() => {});
      const service = createUserSessionService();

      await expect(service.getCurrentSession()).rejects.toThrow('Authentication required');
    });
  });

  describe('getCurrentSession - 캐시 동작', () => {
    it('두 번째 호출 시 캐시된 세션을 반환한다 (API 한 번만 호출)', async () => {
      mockGetData.mockImplementation(async (key: string) => {
        if (key === 'memberId') return '7';
        if (key === 'accessToken') return 'cached-token';
        return null;
      });

      const service = createUserSessionService();
      const first = await service.getCurrentSession();
      const second = await service.getCurrentSession();

      expect(first).toBe(second);
      expect(mockGetData).toHaveBeenCalledTimes(3);
    });

    it('동시 요청은 하나의 Promise로 합쳐진다', async () => {
      let resolveCount = 0;
      mockGetData.mockImplementation(async (key: string) => {
        if (key === 'memberId') return '5';
        if (key === 'accessToken') {
          resolveCount++;
          return 'dedup-token';
        }
        return null;
      });

      const service = createUserSessionService();
      const [s1, s2] = await Promise.all([
        service.getCurrentSession(),
        service.getCurrentSession(),
      ]);

      expect(s1).toBe(s2);
      expect(resolveCount).toBe(1);
    });

    it('clearSession 후 재호출하면 새로운 세션을 로드한다', async () => {
      mockGetData.mockImplementation(async (key: string) => {
        if (key === 'memberId') return '3';
        if (key === 'accessToken') return 'fresh-token';
        return null;
      });

      const service = createUserSessionService();
      await service.getCurrentSession();

      service.clearSession();
      mockGetData.mockClear();

      const newSession = await service.getCurrentSession();

      expect(newSession.memberId).toBe(3);
      expect(mockGetData).toHaveBeenCalled();
    });
  });

  describe('getCurrentUserId', () => {
    it('세션이 유효하면 memberId를 반환한다', async () => {
      mockGetData.mockImplementation(async (key: string) => {
        if (key === 'memberId') return '99';
        if (key === 'accessToken') return 'token';
        return null;
      });

      const service = createUserSessionService();
      const id = await service.getCurrentUserId();

      expect(id).toBe(99);
    });

    it('세션 로드 실패 시 에러를 throw한다', async () => {
      mockGetData.mockResolvedValue(null);

      jest.spyOn(console, 'error').mockImplementation(() => {});
      const service = createUserSessionService();

      await expect(service.getCurrentUserId()).rejects.toThrow();
    });
  });

  describe('clearSession', () => {
    it('캐시를 초기화하여 다음 호출 시 새로 로드한다', async () => {
      mockGetData.mockImplementation(async (key: string) => {
        if (key === 'memberId') return '1';
        if (key === 'accessToken') return 'tok';
        return null;
      });

      const service = createUserSessionService();
      await service.getCurrentSession();

      service.clearSession();
      const callsBefore = mockGetData.mock.calls.length;

      await service.getCurrentSession();

      expect(mockGetData.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  describe('isSessionValid', () => {
    it('세션이 유효하면 true를 반환한다', async () => {
      mockGetData.mockImplementation(async (key: string) => {
        if (key === 'memberId') return '2';
        if (key === 'accessToken') return 'valid-token';
        return null;
      });

      const service = createUserSessionService();
      const valid = await service.isSessionValid();

      expect(valid).toBe(true);
    });

    it('세션이 유효하지 않으면 false를 반환한다', async () => {
      mockGetData.mockResolvedValue(null);
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const service = createUserSessionService();
      const valid = await service.isSessionValid();

      expect(valid).toBe(false);
    });
  });
});
