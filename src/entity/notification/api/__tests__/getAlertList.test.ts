import { getAlertList } from '../getAlertList';
import { instance } from '~/shared/lib/axios';
import { AlertType } from '../../model/alertTypes';

jest.mock('~/shared/lib/axios', () => ({
  instance: { get: jest.fn() },
}));

const mockGet = instance.get as jest.Mock;

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

beforeEach(() => jest.clearAllMocks());

describe('getAlertList', () => {
  describe('성공 케이스', () => {
    it('GET /alert 응답 data를 반환한다', async () => {
      const alerts = [makeAlert()];
      mockGet.mockResolvedValue({ data: alerts });

      const result = await getAlertList();

      expect(mockGet).toHaveBeenCalledWith('/alert');
      expect(result).toEqual(alerts);
    });

    it('빈 배열 응답도 정상 반환한다', async () => {
      mockGet.mockResolvedValue({ data: [] });

      const result = await getAlertList();

      expect(result).toEqual([]);
    });

    it('여러 알림을 포함한 응답을 반환한다', async () => {
      const alerts = [
        makeAlert({ id: 1, alertType: AlertType.TRADE_COMPLETE }),
        makeAlert({ id: 2, alertType: AlertType.REVIEW }),
      ];
      mockGet.mockResolvedValue({ data: alerts });

      const result = await getAlertList();

      expect(result).toHaveLength(2);
    });
  });

  describe('에러 케이스', () => {
    it('API 실패 시 에러를 throw한다', async () => {
      mockGet.mockRejectedValue(new Error('Not found'));

      await expect(getAlertList()).rejects.toThrow();
    });

    it('원본 에러를 그대로 전파한다', async () => {
      mockGet.mockRejectedValue(new Error('Server error'));

      await expect(getAlertList()).rejects.toThrow('Server error');
    });

    it('네트워크 에러 시 에러를 throw한다', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));

      await expect(getAlertList()).rejects.toThrow('Network Error');
    });
  });
});
