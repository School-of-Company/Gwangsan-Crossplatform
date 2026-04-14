import { act, waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { usePostAction } from '../usePostAction';
import { useGetItem } from '~/entity/post/model/useGetItem';
import { useDeletePost } from '~/entity/post';
import { useTradeRequest } from '~/entity/post/hooks/useTradeRequest';
import { useChatEntry } from '~/shared/lib/useChatEntry';
import { checkIsMyPost } from '~/shared/lib/userUtils';
import { createReview } from '~/entity/post/api/createReview';
import Toast from 'react-native-toast-message';

jest.mock('~/entity/post/model/useGetItem', () => ({ useGetItem: jest.fn() }));
jest.mock('~/entity/post', () => ({ useDeletePost: jest.fn() }));
jest.mock('~/entity/post/hooks/useTradeRequest', () => ({ useTradeRequest: jest.fn() }));
jest.mock('~/shared/lib/useChatEntry', () => ({ useChatEntry: jest.fn() }));
jest.mock('~/shared/lib/userUtils', () => ({ checkIsMyPost: jest.fn() }));
jest.mock('~/entity/post/api/createReview', () => ({ createReview: jest.fn() }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockUseGetItem = useGetItem as jest.Mock;
const mockUseDeletePost = useDeletePost as jest.Mock;
const mockUseTradeRequest = useTradeRequest as jest.Mock;
const mockUseChatEntry = useChatEntry as jest.Mock;
const mockCheckIsMyPost = checkIsMyPost as jest.Mock;
const mockCreateReview = createReview as jest.Mock;

const makePostData = (overrides = {}) => ({
  id: 1,
  title: '테스트 게시글',
  content: '내용',
  type: 'OBJECT',
  mode: 'GIVER',
  isCompletable: true,
  isCompleted: false,
  member: { memberId: 42 },
  ...overrides,
});

const setupMocks = (dataOverrides = {}) => {
  mockUseGetItem.mockReturnValue({
    data: makePostData(dataOverrides),
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  });
  mockUseDeletePost.mockReturnValue({ deletePost: jest.fn(), isLoading: false });
  mockUseTradeRequest.mockReturnValue({
    handleTradeRequest: jest.fn(),
    isLoading: false,
  });
  mockUseChatEntry.mockReturnValue({ navigateToChat: jest.fn(), isLoading: false });
  mockCheckIsMyPost.mockResolvedValue(false);
};

beforeEach(() => {
  jest.clearAllMocks();
  setupMocks();
});

describe('usePostAction', () => {
  describe('초기 상태', () => {
    it('isMyPost 초기값이 false이다', async () => {
      const { result } = renderHookWithProviders(() => usePostAction({ id: '1' }));

      await waitFor(() => expect(mockCheckIsMyPost).toHaveBeenCalled());
      expect(result.current.isMyPost).toBe(false);
    });

    it('data가 있으면 checkIsMyPost를 호출한다', async () => {
      mockCheckIsMyPost.mockResolvedValue(true);

      const { result } = renderHookWithProviders(() => usePostAction({ id: '1' }));

      await waitFor(() => expect(result.current.isMyPost).toBe(true));
      expect(mockCheckIsMyPost).toHaveBeenCalledWith(42);
    });
  });

  describe('computedValues', () => {
    it('mode=RECEIVER, type=OBJECT이면 headerTitle이 "필요해요"이다', async () => {
      setupMocks({ mode: 'RECEIVER', type: 'OBJECT' });

      const { result } = renderHookWithProviders(() => usePostAction({ id: '1' }));

      expect(result.current.computedValues.headerTitle).toBe('필요해요');
    });

    it('mode=RECEIVER, type=SERVICE이면 headerTitle이 "해주세요"이다', async () => {
      setupMocks({ mode: 'RECEIVER', type: 'SERVICE' });

      const { result } = renderHookWithProviders(() => usePostAction({ id: '1' }));

      expect(result.current.computedValues.headerTitle).toBe('해주세요');
    });

    it('mode=GIVER, type=OBJECT이면 headerTitle이 "팔아요"이다', async () => {
      setupMocks({ mode: 'GIVER', type: 'OBJECT' });

      const { result } = renderHookWithProviders(() => usePostAction({ id: '1' }));

      expect(result.current.computedValues.headerTitle).toBe('팔아요');
    });

    it('mode=GIVER, type=SERVICE이면 headerTitle이 "할 수 있어요"이다', async () => {
      setupMocks({ mode: 'GIVER', type: 'SERVICE' });

      const { result } = renderHookWithProviders(() => usePostAction({ id: '1' }));

      expect(result.current.computedValues.headerTitle).toBe('할 수 있어요');
    });

    it('mode=RECEIVER, isCompletable=true, isCompleted=false이면 canTrade가 true이다', async () => {
      setupMocks({ mode: 'RECEIVER', isCompletable: true, isCompleted: false });

      const { result } = renderHookWithProviders(() => usePostAction({ id: '1' }));

      expect(result.current.computedValues.canTrade).toBe(true);
    });

    it('isCompleted=true이면 canTrade가 false이다', async () => {
      setupMocks({ mode: 'RECEIVER', isCompletable: true, isCompleted: true });

      const { result } = renderHookWithProviders(() => usePostAction({ id: '1' }));

      expect(result.current.computedValues.canTrade).toBe(false);
    });

    it('isCompletable=false이면 canTrade가 false이다', async () => {
      setupMocks({ mode: 'RECEIVER', isCompletable: false, isCompleted: false });

      const { result } = renderHookWithProviders(() => usePostAction({ id: '1' }));

      expect(result.current.computedValues.canTrade).toBe(false);
    });

    it('mode=GIVER이면 canTrade가 false이다', async () => {
      setupMocks({ mode: 'GIVER', isCompletable: true, isCompleted: false });

      const { result } = renderHookWithProviders(() => usePostAction({ id: '1' }));

      expect(result.current.computedValues.canTrade).toBe(false);
    });
  });

  describe('modalHandlers', () => {
    it('openReportModal / closeReportModal이 isReportModalVisible을 토글한다', () => {
      const { result } = renderHookWithProviders(() => usePostAction({ id: '1' }));

      act(() => result.current.modalHandlers.openReportModal());
      expect(result.current.isReportModalVisible).toBe(true);

      act(() => result.current.modalHandlers.closeReportModal());
      expect(result.current.isReportModalVisible).toBe(false);
    });

    it('openReviewModal / closeReviewModal이 isReviewModalVisible을 토글한다', () => {
      const { result } = renderHookWithProviders(() => usePostAction({ id: '1' }));

      act(() => result.current.modalHandlers.openReviewModal());
      expect(result.current.isReviewModalVisible).toBe(true);

      act(() => result.current.modalHandlers.closeReviewModal());
      expect(result.current.isReviewModalVisible).toBe(false);
    });

    it('review prop이 있으면 isReviewModalVisible 초기값이 true이다', () => {
      const { result } = renderHookWithProviders(() =>
        usePostAction({ id: '1', review: 'some-review' })
      );

      expect(result.current.isReviewModalVisible).toBe(true);
    });
  });

  describe('reviewHandlers', () => {
    it('onSubmit 성공 시 성공 Toast를 표시하고 모달을 닫는다', async () => {
      mockCreateReview.mockResolvedValue({});

      const { result } = renderHookWithProviders(() => usePostAction({ id: '1' }));

      act(() => result.current.modalHandlers.openReviewModal());

      await act(async () => {
        await result.current.reviewHandlers.onSubmit(80, '좋았어요');
      });

      expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
      expect(result.current.isReviewModalVisible).toBe(false);
    });

    it('onSubmit 실패 시 에러 Toast를 표시한다', async () => {
      mockCreateReview.mockRejectedValue(new Error('리뷰 실패'));

      const { result } = renderHookWithProviders(() => usePostAction({ id: '1' }));

      await act(async () => {
        await result.current.reviewHandlers.onSubmit(80, '좋았어요');
      });

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', text1: '리뷰 작성 실패' })
      );
    });

    it('onLightChange / onContentsChange로 값을 업데이트한다', () => {
      const { result } = renderHookWithProviders(() => usePostAction({ id: '1' }));

      act(() => result.current.reviewHandlers.onLightChange(90));
      expect(result.current.reviewLight).toBe(90);

      act(() => result.current.reviewHandlers.onContentsChange('리뷰 내용'));
      expect(result.current.reviewContents).toBe('리뷰 내용');
    });

    it('onAnimationComplete이 reviewLight를 60으로, reviewContents를 빈 문자열로 초기화한다', () => {
      const { result } = renderHookWithProviders(() => usePostAction({ id: '1' }));

      act(() => result.current.reviewHandlers.onLightChange(90));
      act(() => result.current.reviewHandlers.onContentsChange('내용'));
      act(() => result.current.reviewHandlers.onAnimationComplete());

      expect(result.current.reviewLight).toBe(60);
      expect(result.current.reviewContents).toBe('');
    });
  });

  describe('navigationHandlers', () => {
    it('goToEdit를 호출해도 오류가 발생하지 않는다', () => {
      const { result } = renderHookWithProviders(() => usePostAction({ id: '1' }));

      act(() => result.current.navigationHandlers.goToEdit());
    });

    it('goToChat이 navigateToChat을 data.id로 호출한다', async () => {
      const mockNavigateToChat = jest.fn().mockResolvedValue({});
      mockUseChatEntry.mockReturnValue({ navigateToChat: mockNavigateToChat, isLoading: false });

      const { result } = renderHookWithProviders(() => usePostAction({ id: '1' }));

      await act(async () => {
        await result.current.navigationHandlers.goToChat();
      });

      expect(mockNavigateToChat).toHaveBeenCalledWith(1);
    });

    it('goToChat이 data가 없으면 navigateToChat을 호출하지 않는다', async () => {
      const mockNavigateToChat = jest.fn();
      mockUseChatEntry.mockReturnValue({ navigateToChat: mockNavigateToChat, isLoading: false });
      mockUseGetItem.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { result } = renderHookWithProviders(() => usePostAction({ id: '1' }));

      await act(async () => {
        await result.current.navigationHandlers.goToChat();
      });

      expect(mockNavigateToChat).not.toHaveBeenCalled();
    });
  });

  describe('actionHandlers.onDelete', () => {
    it('data가 있으면 onDelete 호출 시 오류가 없다', () => {
      const { result } = renderHookWithProviders(() => usePostAction({ id: '1' }));

      act(() => result.current.actionHandlers.onDelete());
    });

    it('data가 없으면 아무것도 하지 않는다', () => {
      mockUseGetItem.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { result } = renderHookWithProviders(() => usePostAction({ id: '1' }));

      act(() => result.current.actionHandlers.onDelete());
    });
  });

  describe('actionHandlers.onRefresh', () => {
    it('refetch를 호출하고 refreshing 상태를 처리한다', async () => {
      const mockRefetch = jest.fn().mockResolvedValue({});
      mockUseGetItem.mockReturnValue({
        data: makePostData(),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHookWithProviders(() => usePostAction({ id: '1' }));

      await act(async () => {
        await result.current.actionHandlers.onRefresh();
      });

      expect(mockRefetch).toHaveBeenCalled();
      expect(result.current.refreshing).toBe(false);
    });

    it('refetch가 실패해도 finally에서 refreshing이 false로 리셋된다', async () => {
      const mockRefetch = jest.fn().mockRejectedValue(new Error('network error'));
      mockUseGetItem.mockReturnValue({
        data: makePostData(),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHookWithProviders(() => usePostAction({ id: '1' }));

      await act(async () => {
        try {
          await result.current.actionHandlers.onRefresh();
        } catch {
          // expected
        }
      });

      expect(result.current.refreshing).toBe(false);
    });
  });
});
