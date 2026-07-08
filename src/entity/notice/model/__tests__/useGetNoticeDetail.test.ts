import { waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useGetNoticeDetail } from '../useGetNoticeDetail';
import { getNoticeDetail } from '../../api/getNoticeDetail';

const capturedQueryOptions: { queryFn: () => unknown }[] = [];

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: jest.fn((options: { queryFn: () => unknown }) => {
      capturedQueryOptions.push(options);
      return actual.useQuery(options);
    }),
  };
});

jest.mock('../../api/getNoticeDetail', () => ({
  getNoticeDetail: jest.fn(),
}));

const mockGetNoticeDetail = getNoticeDetail as jest.Mock;

const makeNotice = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  title: '공지사항',
  content: '공지 내용입니다.',
  place: '광산구청',
  createdAt: '2025-01-15',
  role: 'ROLE_PLACE_ADMIN',
  images: [],
  ...overrides,
});

describe('useGetNoticeDetail', () => {
  beforeEach(() => jest.clearAllMocks());

  it('number ID로 공지 상세를 가져온다', async () => {
    const notice = makeNotice();
    mockGetNoticeDetail.mockResolvedValue(notice);

    const { result } = renderHookWithProviders(() => useGetNoticeDetail(1));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetNoticeDetail).toHaveBeenCalledWith(1);
    expect(result.current.data).toEqual(notice);
  });

  it('string ID를 number로 변환하여 호출한다', async () => {
    const notice = makeNotice({ id: 42 });
    mockGetNoticeDetail.mockResolvedValue(notice);

    const { result } = renderHookWithProviders(() => useGetNoticeDetail('42'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetNoticeDetail).toHaveBeenCalledWith(42);
  });

  it('undefined ID일 때 쿼리가 비활성화된다', () => {
    const { result } = renderHookWithProviders(() => useGetNoticeDetail(undefined));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetNoticeDetail).not.toHaveBeenCalled();
  });

  it('빈 문자열 ID일 때 쿼리가 비활성화된다 (Number("") === 0 → falsy)', () => {
    const { result } = renderHookWithProviders(() => useGetNoticeDetail(''));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetNoticeDetail).not.toHaveBeenCalled();
  });

  it('"0" ID일 때 쿼리가 비활성화된다 (Number("0") === 0 → falsy)', () => {
    const { result } = renderHookWithProviders(() => useGetNoticeDetail('0'));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetNoticeDetail).not.toHaveBeenCalled();
  });

  it('0 ID일 때 쿼리가 비활성화된다', () => {
    const { result } = renderHookWithProviders(() => useGetNoticeDetail(0));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetNoticeDetail).not.toHaveBeenCalled();
  });

  it('queryKey가 ["noticeDetail", id]이다', async () => {
    mockGetNoticeDetail.mockResolvedValue(makeNotice());

    const { result, queryClient } = renderHookWithProviders(() => useGetNoticeDetail(5));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cache = queryClient.getQueryData(['noticeDetail', 5]);
    expect(cache).toBeDefined();
  });

  it('API 실패 시 error 상태가 된다', async () => {
    mockGetNoticeDetail.mockRejectedValue(new Error('Not found'));

    const { result } = renderHookWithProviders(() => useGetNoticeDetail(999));

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });

  it('NaN이 되는 문자열 ID일 때 쿼리가 비활성화된다', () => {
    const { result } = renderHookWithProviders(() => useGetNoticeDetail('abc'));

    // Number('abc') is NaN, which is falsy → enabled: false
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetNoticeDetail).not.toHaveBeenCalled();
  });

  it('내부 queryFn은 id가 없으면 에러를 던진다 (enabled: false라 정상적으로는 호출되지 않는 방어 코드)', () => {
    capturedQueryOptions.length = 0;

    renderHookWithProviders(() => useGetNoticeDetail(undefined));

    expect(() => capturedQueryOptions[0].queryFn()).toThrow('Notice ID is required');
  });
});
