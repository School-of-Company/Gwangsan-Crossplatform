import { waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useGetAlertList } from '../useGetAlertList';
import { getAlertList } from '../../api/getAlertList';
import { AlertType } from '../alertTypes';

jest.mock('../../api/getAlertList', () => ({
  getAlertList: jest.fn(),
}));

const mockGetAlertList = getAlertList as jest.Mock;

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

describe('useGetAlertList', () => {
  describe('데이터 로딩', () => {
    it('getAlertList를 호출하고 데이터를 반환한다', async () => {
      const alerts = [makeAlert()];
      mockGetAlertList.mockResolvedValue(alerts);

      const { result } = renderHookWithProviders(() => useGetAlertList());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockGetAlertList).toHaveBeenCalled();
      expect(result.current.data).toEqual(alerts);
    });
  });

  describe('쿼리 키', () => {
    it('queryKey가 [alertList] 형태이다', async () => {
      mockGetAlertList.mockResolvedValue([]);

      const { queryClient } = renderHookWithProviders(() => useGetAlertList());

      await waitFor(() => expect(queryClient.getQueryState(['alertList'])).toBeDefined());
    });
  });

  describe('에러 상태', () => {
    it('API 실패 시 error 상태가 된다', async () => {
      mockGetAlertList.mockRejectedValue(new Error('Not found'));

      const { result } = renderHookWithProviders(() => useGetAlertList());

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('로딩 상태', () => {
    it('초기에 isLoading이 true이다', () => {
      mockGetAlertList.mockReturnValue(new Promise(() => {}));

      const { result } = renderHookWithProviders(() => useGetAlertList());

      expect(result.current.isLoading).toBe(true);
    });
  });
});
