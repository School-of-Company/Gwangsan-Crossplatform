import { waitFor } from '@testing-library/react-native';
import { createQueryClient, renderHookWithProviders } from '~/test-utils';
import { useGetMyFeedback } from '../useGetMyFeedback';
import { feedbackQueryKeys } from '../feedbackQueryKeys';
import { getMyFeedback } from '../../api/getMyFeedbacks';

jest.mock('../../api/getMyFeedbacks', () => ({
  getMyFeedback: jest.fn(),
}));

const mockGetMyFeedback = getMyFeedback as jest.Mock;

const makeFeedback = (feedbackId: number, overrides: Record<string, unknown> = {}) => ({
  feedbackId,
  type: 'BUG',
  content: `문의 ${feedbackId}`,
  images: [],
  status: 'RECEIVED',
  answer: null,
  answeredAt: null,
  createdAt: '2026-11-01T10:00:00',
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('useGetMyFeedback', () => {
  it('id가 없으면 조회하지 않는다', () => {
    renderHookWithProviders(() => useGetMyFeedback(undefined));

    expect(mockGetMyFeedback).not.toHaveBeenCalled();
  });

  it('목록 캐시가 없으면 서버에서 한 건을 받아온다', async () => {
    mockGetMyFeedback.mockResolvedValue(makeFeedback(5));

    const { result } = renderHookWithProviders(() => useGetMyFeedback(5));

    await waitFor(() => expect(result.current.data).toEqual(makeFeedback(5)));
    expect(mockGetMyFeedback).toHaveBeenCalledWith(5);
  });

  it('목록 캐시 항목을 먼저 보여주고, 새로 받은 답변을 목록 캐시에도 반영한다', async () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(feedbackQueryKeys.myList(), {
      pages: [[makeFeedback(6), makeFeedback(5)]],
      pageParams: [null],
    });
    const answered = makeFeedback(5, { status: 'DONE', answer: '해결했습니다.' });
    let resolve: (value: unknown) => void = () => {};
    mockGetMyFeedback.mockReturnValue(new Promise((r) => (resolve = r)));

    const { result } = renderHookWithProviders(() => useGetMyFeedback(5), { queryClient });

    expect(result.current.data).toEqual(makeFeedback(5));

    resolve(answered);

    await waitFor(() => expect(result.current.data).toEqual(answered));
    const list = queryClient.getQueryData<{ pages: unknown[][] }>(feedbackQueryKeys.myList());
    expect(list?.pages[0]).toEqual([makeFeedback(6), answered]);
  });

  it('조회 결과가 없으면 목록 캐시를 바꾸지 않고 null을 반환한다', async () => {
    const queryClient = createQueryClient();
    const pages = { pages: [[makeFeedback(6)]], pageParams: [null] };
    queryClient.setQueryData(feedbackQueryKeys.myList(), pages);
    mockGetMyFeedback.mockResolvedValue(null);

    const { result } = renderHookWithProviders(() => useGetMyFeedback(5), { queryClient });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
    expect(queryClient.getQueryData(feedbackQueryKeys.myList())).toEqual(pages);
  });
});
