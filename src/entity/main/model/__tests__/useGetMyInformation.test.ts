import { waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import * as Sentry from '@sentry/react-native';
import { getMyInformation } from '../../../../view/main/api/getMyInformation';
import { setData } from '~/shared/lib/setData';
import { useGetMyInformation } from '../useGetMyInformation';

jest.mock('../../../../view/main/api/getMyInformation', () => ({
  getMyInformation: jest.fn(),
}));

jest.mock('~/shared/lib/setData', () => ({
  setData: jest.fn(),
}));

jest.mock('@sentry/react-native', () => ({
  setUser: jest.fn(),
}));

const mockGetMyInformation = getMyInformation as jest.Mock;
const mockSetData = setData as jest.Mock;
const mockSetUser = Sentry.setUser as jest.Mock;

const makeProfile = (overrides: Record<string, unknown> = {}) => ({
  memberId: 1,
  nickname: '홍길동',
  placeName: '광산구',
  headName: '동',
  dongName: '우산동',
  light: 50,
  gwangsan: 10,
  description: '설명',
  specialties: [],
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('useGetMyInformation', () => {
  describe('데이터 로딩', () => {
    it('getMyInformation을 호출하고 데이터를 반환한다', async () => {
      const profile = makeProfile();
      mockGetMyInformation.mockResolvedValue(profile);

      const { result } = renderHookWithProviders(() => useGetMyInformation());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockGetMyInformation).toHaveBeenCalled();
      expect(result.current.data).toEqual(profile);
    });

    it('memberId가 있으면 setData와 Sentry.setUser를 호출한다', async () => {
      mockGetMyInformation.mockResolvedValue(makeProfile({ memberId: 42 }));

      const { result } = renderHookWithProviders(() => useGetMyInformation());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockSetData).toHaveBeenCalledWith('memberId', '42');
      expect(mockSetUser).toHaveBeenCalledWith({ id: '42' });
    });

    it('memberId가 없으면 setData와 Sentry.setUser를 호출하지 않는다', async () => {
      mockGetMyInformation.mockResolvedValue(makeProfile({ memberId: undefined }));

      const { result } = renderHookWithProviders(() => useGetMyInformation());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockSetData).not.toHaveBeenCalled();
      expect(mockSetUser).not.toHaveBeenCalled();
    });
  });

  describe('쿼리 키', () => {
    it('queryKey가 [myInformation] 형태이다', async () => {
      mockGetMyInformation.mockResolvedValue(makeProfile());

      const { queryClient } = renderHookWithProviders(() => useGetMyInformation());

      await waitFor(() => expect(queryClient.getQueryState(['myInformation'])).toBeDefined());
    });
  });

  describe('에러 상태', () => {
    it('API 실패 시 error 상태가 된다', async () => {
      mockGetMyInformation.mockRejectedValue(new Error('Not found'));

      const { result } = renderHookWithProviders(() => useGetMyInformation());

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('로딩 상태', () => {
    it('초기에 isLoading이 true이다', () => {
      mockGetMyInformation.mockReturnValue(new Promise(() => {}));

      const { result } = renderHookWithProviders(() => useGetMyInformation());

      expect(result.current.isLoading).toBe(true);
    });
  });
});
