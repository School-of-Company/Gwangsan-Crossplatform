import { act, waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useGetMyFeedbacks } from '../useGetMyFeedbacks';
import { getMyFeedbacks } from '../../api/getMyFeedbacks';

jest.mock('../../api/getMyFeedbacks', () => ({
  getMyFeedbacks: jest.fn(),
  MY_FEEDBACK_PAGE_SIZE: 2,
}));

const mockGetMyFeedbacks = getMyFeedbacks as jest.Mock;

const makeFeedbacks = (ids: number[]) =>
  ids.map((feedbackId) => ({ feedbackId, type: 'BUG', content: '', status: 'RECEIVED' }));

beforeEach(() => jest.clearAllMocks());

describe('useGetMyFeedbacks', () => {
  it('첫 페이지는 lastId 없이 조회한다', async () => {
    mockGetMyFeedbacks.mockResolvedValue(makeFeedbacks([1]));

    const { result } = renderHookWithProviders(() => useGetMyFeedbacks());

    await waitFor(() => expect(result.current.feedbacks).toHaveLength(1));
    expect(mockGetMyFeedbacks).toHaveBeenCalledWith({ lastId: null });
  });

  it('size개가 오면 마지막 feedbackId를 커서로 다음 페이지를 받는다', async () => {
    mockGetMyFeedbacks
      .mockResolvedValueOnce(makeFeedbacks([9, 8]))
      .mockResolvedValueOnce(makeFeedbacks([8, 5]));

    const { result } = renderHookWithProviders(() => useGetMyFeedbacks());
    await waitFor(() => expect(result.current.feedbacks).toHaveLength(2));

    act(() => result.current.loadMore());

    await waitFor(() => expect(mockGetMyFeedbacks).toHaveBeenLastCalledWith({ lastId: 8 }));
    // 페이지 경계에서 중복된 id는 한 번만 보인다.
    await waitFor(() =>
      expect(result.current.feedbacks.map((f) => f.feedbackId)).toEqual([9, 8, 5])
    );
  });

  it('size보다 적게 오면 더 불러오지 않는다', async () => {
    mockGetMyFeedbacks.mockResolvedValue(makeFeedbacks([3]));

    const { result } = renderHookWithProviders(() => useGetMyFeedbacks());
    await waitFor(() => expect(result.current.feedbacks).toHaveLength(1));

    act(() => result.current.loadMore());

    expect(mockGetMyFeedbacks).toHaveBeenCalledTimes(1);
  });

  it('커서가 줄어들지 않으면 다음 페이지 요청을 멈춘다', async () => {
    mockGetMyFeedbacks.mockResolvedValue(makeFeedbacks([9, 8]));

    const { result } = renderHookWithProviders(() => useGetMyFeedbacks());
    await waitFor(() => expect(result.current.feedbacks).toHaveLength(2));

    act(() => result.current.loadMore());
    await waitFor(() => expect(mockGetMyFeedbacks).toHaveBeenCalledTimes(2));

    act(() => result.current.loadMore());
    expect(mockGetMyFeedbacks).toHaveBeenCalledTimes(2);
  });
});
