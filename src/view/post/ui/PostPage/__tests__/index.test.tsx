import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { usePostAction } from '~/widget/post/model/usePostAction';
import PostPageView from '../index';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('~/widget/post/model/usePostAction', () => ({
  usePostAction: jest.fn(),
}));

jest.mock('~/widget/post/ui/PostPageContent', () => ({
  PostPageContent: () => {
    const { View } = require('react-native');
    return <View testID="post-page-content" />;
  },
}));

jest.mock('~/entity/post/ui/ReportModal', () => {
  const { View } = require('react-native');
  return () => <View testID="report-modal" />;
});

jest.mock('~/entity/post/ui/ReviewsModal', () => {
  const { View } = require('react-native');
  return () => <View testID="reviews-modal" />;
});

jest.mock('~/shared/ui', () => {
  const { Text, TouchableOpacity, View } = require('react-native');
  return {
    Header: ({ headerTitle }: any) => <Text testID="header-title">{headerTitle}</Text>,
    AlertModal: ({ isVisible, message, confirmText, onCancel, onConfirm }: any) =>
      isVisible ? (
        <View testID="delete-alert">
          <Text>{message}</Text>
          <TouchableOpacity testID="delete-alert-cancel" onPress={onCancel}>
            <Text>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="delete-alert-confirm" onPress={onConfirm}>
            <Text>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      ) : null,
  };
});

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUsePostAction = usePostAction as jest.Mock;

const makePostData = (overrides = {}) => ({
  id: 1,
  title: '테스트 게시글',
  content: '내용',
  gwangsan: 1,
  type: 'OBJECT' as const,
  mode: 'GIVER' as const,
  isCompletable: true,
  isCompleted: false,
  images: [],
  member: { memberId: 42, nickname: '홍길동', placeName: '광산구', light: 3 },
  ...overrides,
});

const makeUsePostActionReturn = (overrides = {}) => ({
  data: makePostData(),
  isLoading: false,
  error: null,
  isMyPost: false,
  refreshing: false,
  isDeleting: false,
  isReportModalVisible: false,
  isReviewModalVisible: false,
  isDeleteAlertVisible: false,
  reviewLight: 60,
  reviewContents: '',
  isChatLoading: false,
  isTradeRequestLoading: false,
  modalHandlers: {
    openReportModal: jest.fn(),
    closeReportModal: jest.fn(),
    openReviewModal: jest.fn(),
    closeReviewModal: jest.fn(),
    closeDeleteAlert: jest.fn(),
  },
  reviewHandlers: {
    onSubmit: jest.fn(),
    onLightChange: jest.fn(),
    onContentsChange: jest.fn(),
    onAnimationComplete: jest.fn(),
  },
  navigationHandlers: { goToEdit: jest.fn(), goToChat: jest.fn() },
  actionHandlers: {
    onDelete: jest.fn(),
    onConfirmDelete: jest.fn(),
    onTradeRequest: jest.fn(),
    onRefresh: jest.fn(),
  },
  computedValues: {
    headerTitle: '팔아요',
    canTrade: true,
    isTradeButtonDisabled: false,
    tradeButtonText: '거래하기',
  },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({ id: '1' });
  mockUsePostAction.mockReturnValue(makeUsePostActionReturn());
});

describe('PostPageView', () => {
  describe('로딩 상태', () => {
    it('isLoading=true이면 로딩 인디케이터를 표시한다', () => {
      mockUsePostAction.mockReturnValue(makeUsePostActionReturn({ isLoading: true, data: null }));

      const { UNSAFE_getByType, queryByTestId } = render(<PostPageView />);

      const { ActivityIndicator } = require('react-native');
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
      expect(queryByTestId('post-page-content')).toBeNull();
    });
  });

  describe('에러 상태', () => {
    it('error가 있으면 에러 메시지를 표시한다', () => {
      mockUsePostAction.mockReturnValue(
        makeUsePostActionReturn({ error: new Error('Not found'), data: null })
      );

      const { getByText } = render(<PostPageView />);

      expect(getByText('게시글을 불러오는데 실패했습니다.')).toBeTruthy();
    });

    it('data가 null이면 에러 메시지를 표시한다', () => {
      mockUsePostAction.mockReturnValue(makeUsePostActionReturn({ data: null }));

      const { getByText } = render(<PostPageView />);

      expect(getByText('게시글을 불러오는데 실패했습니다.')).toBeTruthy();
    });
  });

  describe('정상 상태', () => {
    it('PostPageContent를 렌더링한다', () => {
      const { getByTestId } = render(<PostPageView />);

      expect(getByTestId('post-page-content')).toBeTruthy();
    });

    it('Header에 computedValues.headerTitle을 표시한다', () => {
      mockUsePostAction.mockReturnValue(
        makeUsePostActionReturn({
          computedValues: {
            headerTitle: '필요해요',
            canTrade: false,
            isTradeButtonDisabled: true,
            tradeButtonText: '거래 불가',
          },
        })
      );

      const { getByTestId } = render(<PostPageView />);

      expect(getByTestId('header-title').props.children).toBe('필요해요');
    });

    it('ReportModal과 ReviewsModal을 렌더링한다', () => {
      const { getByTestId } = render(<PostPageView />);

      expect(getByTestId('report-modal')).toBeTruthy();
      expect(getByTestId('reviews-modal')).toBeTruthy();
    });

    it('usePostAction에 id와 review 파라미터를 전달한다', () => {
      mockUseLocalSearchParams.mockReturnValue({ id: '42', review: '1' });

      render(<PostPageView />);

      expect(mockUsePostAction).toHaveBeenCalledWith({ id: '42', review: '1' });
    });

    it('isDeleteAlertVisible이 true이면 삭제 확인 AlertModal을 표시한다', () => {
      mockUsePostAction.mockReturnValue(makeUsePostActionReturn({ isDeleteAlertVisible: true }));

      const { getByTestId } = render(<PostPageView />);

      expect(getByTestId('delete-alert')).toBeTruthy();
    });

    it('삭제 확인 AlertModal에서 확인을 누르면 actionHandlers.onConfirmDelete를 호출한다', () => {
      const onConfirmDelete = jest.fn();
      mockUsePostAction.mockReturnValue(
        makeUsePostActionReturn({
          isDeleteAlertVisible: true,
          actionHandlers: {
            onDelete: jest.fn(),
            onConfirmDelete,
            onTradeRequest: jest.fn(),
            onRefresh: jest.fn(),
          },
        })
      );

      const { getByTestId } = render(<PostPageView />);

      fireEvent.press(getByTestId('delete-alert-confirm'));

      expect(onConfirmDelete).toHaveBeenCalledTimes(1);
    });

    it('삭제 확인 AlertModal에서 취소를 누르면 modalHandlers.closeDeleteAlert를 호출한다', () => {
      const closeDeleteAlert = jest.fn();
      mockUsePostAction.mockReturnValue(
        makeUsePostActionReturn({
          isDeleteAlertVisible: true,
          modalHandlers: {
            openReportModal: jest.fn(),
            closeReportModal: jest.fn(),
            openReviewModal: jest.fn(),
            closeReviewModal: jest.fn(),
            closeDeleteAlert,
          },
        })
      );

      const { getByTestId } = render(<PostPageView />);

      fireEvent.press(getByTestId('delete-alert-cancel'));

      expect(closeDeleteAlert).toHaveBeenCalledTimes(1);
    });
  });
});
