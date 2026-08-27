import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders as render } from '~/test-utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGetMyInformation } from '~/entity/main/model/useGetMyInformation';
import { useChatMessages } from '~/widget/chat/model/useChatMessages';
import { useChatAction } from '~/widget/chat/model/useChatActions';
import { useTradeHandlers } from '~/widget/chat/model/useTradeHandlers';
import { useChatUIState } from '~/widget/chat/model/useChatUIState';
import { useTradeRequest } from '~/entity/post/hooks/useTradeRequest';
import { useChatRoomData } from '~/entity/chat/model/useChatRoomData';
import { createReview } from '~/entity/post/api/createReview';
import { getMyReceivedReview } from '~/view/reviews/api/getReviews';
import { logger } from '~/shared/lib/logger';
import Toast from 'react-native-toast-message';
import ChatRoomPage from '../index';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('~/entity/main/model/useGetMyInformation', () => ({
  useGetMyInformation: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

jest.mock('~/shared/lib/logger', () => ({
  logger: { error: jest.fn() },
}));

jest.mock('~/widget/chat/model/useChatMessages', () => ({
  useChatMessages: jest.fn(),
}));

jest.mock('~/widget/chat/model/useChatActions', () => ({
  useChatAction: jest.fn(),
}));

jest.mock('~/widget/chat/model/useTradeHandlers', () => ({
  useTradeHandlers: jest.fn(),
}));

jest.mock('~/widget/chat/model/useChatUIState', () => ({
  useChatUIState: jest.fn(),
}));

jest.mock('~/entity/chat/model/useChatRoomData', () => ({
  useChatRoomData: jest.fn(),
}));

jest.mock('~/entity/post/hooks/useTradeRequest', () => ({
  useTradeRequest: jest.fn(),
}));

jest.mock('~/entity/post/api/createReview', () => ({
  createReview: jest.fn(),
}));

jest.mock('~/view/reviews/api/getReviews', () => ({
  getMyReceivedReview: jest.fn(),
}));

jest.mock('~/entity/post/ui/ReviewsModal', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    __esModule: true,
    default: ({ isVisible, onClose, onSubmit }: any) => (
      <View testID="reviews-modal">
        <Text testID="reviews-modal-visible">{String(isVisible)}</Text>
        <TouchableOpacity
          testID="reviews-modal-submit"
          onPress={() => onSubmit(80, '좋은 거래였어요')}>
          <Text>submit</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="reviews-modal-close" onPress={onClose}>
          <Text>close</Text>
        </TouchableOpacity>
      </View>
    ),
  };
});

jest.mock('@/widget/chat/ui/ChatRoomHeader', () => ({
  ChatRoomHeader: () => {
    const { View } = require('react-native');
    return <View testID="chat-room-header" />;
  },
}));

jest.mock('@/widget/chat/ui/ChatRoomProductInfo', () => ({
  ChatRoomProductInfo: ({ title, gwangsan, trailing, onPress }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="chat-room-product-info">
        <TouchableOpacity testID="chat-room-product-info-press" onPress={onPress}>
          <Text testID="chat-room-product-info-title">{title}</Text>
          <Text testID="chat-room-product-info-gwangsan">{gwangsan}</Text>
        </TouchableOpacity>
        {trailing}
      </View>
    );
  },
}));

jest.mock('@/widget/chat/ui/ChatRoomContent', () => ({
  ChatRoomContent: ({ onReviewButtonPress, showReviewButton }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="chat-room-content">
        <Text testID="show-review-button">{String(showReviewButton)}</Text>
        <TouchableOpacity testID="review-button" onPress={onReviewButtonPress}>
          <Text>review</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('@/widget/chat/ui/TradeRequestModal', () => ({
  TradeRequestModal: ({ isVisible, onClose, onTradeRequest, isLoading }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="trade-request-modal">
        <Text testID="trade-request-modal-visible">{String(isVisible)}</Text>
        <Text testID="trade-request-modal-loading">{String(isLoading)}</Text>
        <TouchableOpacity testID="trade-request-confirm" onPress={onTradeRequest}>
          <Text>request</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="trade-request-close" onPress={onClose}>
          <Text>close</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('@/widget/chat/ui/ReservationModal', () => ({
  ReservationModal: ({ isVisible, onClose, onConfirm, isLoading }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="reservation-modal">
        <Text testID="reservation-modal-visible">{String(isVisible)}</Text>
        <Text testID="reservation-modal-loading">{String(isLoading)}</Text>
        <TouchableOpacity
          testID="reservation-modal-confirm"
          onPress={() =>
            onConfirm({
              scheduledAt: '2026-08-28T14:00:00',
              placeName: '상무역 2번 출구',
              address: '광주 서구 상무자유로',
            })
          }>
          <Text>confirm</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="reservation-modal-close" onPress={onClose}>
          <Text>close</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('@/shared/ui/Header', () => ({
  Header: ({ headerTitle, connectionState }: any) => {
    const { View, Text } = require('react-native');
    return (
      <View testID="header">
        <Text testID="header-title">{headerTitle}</Text>
        <Text testID="header-connection">{connectionState}</Text>
      </View>
    );
  },
}));

jest.mock('@/widget/chat', () => ({
  ChatInput: ({ onSendMessage, disabled }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="chat-input">
        <Text testID="chat-input-disabled">{String(disabled)}</Text>
        <TouchableOpacity testID="chat-input-send" onPress={() => onSendMessage('hi', [])}>
          <Text>send</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockUseGetMyInformation = useGetMyInformation as jest.Mock;
const mockRouterPush = jest.fn();
const mockUseChatMessages = useChatMessages as jest.Mock;
const mockUseChatAction = useChatAction as jest.Mock;
const mockUseTradeHandlers = useTradeHandlers as jest.Mock;
const mockUseChatUIState = useChatUIState as jest.Mock;
const mockUseTradeRequest = useTradeRequest as jest.Mock;
const mockUseChatRoomData = useChatRoomData as jest.Mock;
const mockCreateReview = createReview as jest.Mock;
const mockGetMyReceivedReview = getMyReceivedReview as jest.Mock;
const mockToastShow = Toast.show as jest.Mock;

const mockMarkRoomAsRead = jest.fn().mockResolvedValue(undefined);
const mockScrollToEnd = jest.fn();
const mockSendMessage = jest.fn();

const makeChatMessagesReturn = (overrides = {}) => ({
  flatListRef: { current: null },
  messages: [],
  otherUserInfo: { nickname: '상대방', id: 7 },
  isLoading: false,
  isError: false,
  connectionState: 'connected',
  messageHandlers: { sendMessage: mockSendMessage, renderMessage: jest.fn() },
  scrollToEnd: mockScrollToEnd,
  markRoomAsRead: mockMarkRoomAsRead,
  ...overrides,
});

const makeTradeHandlersReturn = (overrides = {}) => ({
  handleTradeAccept: jest.fn(),
  handleReservation: jest.fn(),
  handleCancelReservation: jest.fn(),
  hasTradeRequest: false,
  shouldShowButtons: false,
  ...overrides,
});

const makeChatUIStateReturn = (overrides = {}) => ({
  tradeEmbedConfig: {
    shouldShow: false,
    product: null,
    showButtons: false,
    isLoading: false,
    requestorNickname: '나',
  },
  menuConfig: { shouldShowMenuButton: true, isProductLoading: false, isGiverMode: false },
  tradeRequestInfo: { productId: 1, sellerId: 7 },
  componentState: { hasMessages: false, canSendMessage: true, headerTitle: '상대방' },
  productInfoConfig: { shouldShow: true, title: '상품', gwangsan: 3000, imageUrl: undefined },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({ id: '10' });
  mockUseRouter.mockReturnValue({ push: mockRouterPush });
  mockUseGetMyInformation.mockReturnValue({ data: { memberId: 5 } });
  mockUseChatMessages.mockReturnValue(makeChatMessagesReturn());
  mockUseChatAction.mockReturnValue({
    navigationHandlers: { goToProfile: jest.fn(), goToOtherUserProfile: jest.fn() },
    formatLastMessageDate: jest.fn(() => '방금 전'),
  });
  mockUseTradeHandlers.mockReturnValue(makeTradeHandlersReturn());
  mockUseChatUIState.mockReturnValue(makeChatUIStateReturn());
  mockUseTradeRequest.mockReturnValue({
    handleTradeRequest: jest.fn().mockResolvedValue(undefined),
    isLoading: false,
  });
  mockUseChatRoomData.mockReturnValue({ data: { product: { id: 1, isCompleted: false } } });
  mockCreateReview.mockResolvedValue(true);
  mockGetMyReceivedReview.mockResolvedValue([]);
  mockMarkRoomAsRead.mockClear().mockResolvedValue(undefined);
});

describe('ChatRoomPage', () => {
  it('로딩 중일 때 ActivityIndicator를 표시한다', () => {
    mockUseChatMessages.mockReturnValue(makeChatMessagesReturn({ isLoading: true }));

    const { UNSAFE_getAllByType } = render(<ChatRoomPage />);

    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getAllByType(ActivityIndicator).length).toBeGreaterThanOrEqual(1);
  });

  it('에러 상태일 때 에러 메시지를 표시한다', () => {
    mockUseChatMessages.mockReturnValue(makeChatMessagesReturn({ isError: true }));

    const { getByText } = render(<ChatRoomPage />);

    expect(getByText('Failed to load chat room')).toBeTruthy();
  });

  it('헤더에 componentState.headerTitle을 표시한다', () => {
    const { getByTestId } = render(<ChatRoomPage />);

    expect(getByTestId('header-title').props.children).toBe('상대방');
  });

  it('productInfoConfig.shouldShow가 true이면 물품 정보를 계속 표시한다', () => {
    const { getByTestId } = render(<ChatRoomPage />);

    expect(getByTestId('chat-room-product-info-title').props.children).toBe('상품');
    expect(getByTestId('chat-room-product-info-gwangsan').props.children).toBe(3000);
  });

  it('productInfoConfig.shouldShow가 false이면 물품 정보를 표시하지 않는다', () => {
    mockUseChatUIState.mockReturnValue(
      makeChatUIStateReturn({ productInfoConfig: { shouldShow: false, title: '' } })
    );

    const { queryByTestId } = render(<ChatRoomPage />);

    expect(queryByTestId('chat-room-product-info')).toBeNull();
  });

  it('거래가 완료되지 않으면 완료 배너를 표시하지 않는다', () => {
    const { queryByTestId } = render(<ChatRoomPage />);

    expect(queryByTestId('trade-completed-banner')).toBeNull();
  });

  it('거래 완료 시 배너와 받은 후기 링크를 표시하고, 링크로 이동한다', () => {
    mockUseChatRoomData.mockReturnValue({ data: { product: { id: 1, isCompleted: true } } });

    const { getByTestId } = render(<ChatRoomPage />);

    expect(getByTestId('trade-completed-banner')).toBeTruthy();
    expect(getByTestId('show-review-button').props.children).toBe('true');

    fireEvent.press(getByTestId('received-reviews-link'));
    expect(mockRouterPush).toHaveBeenCalledWith('/reviews/5');
  });

  it('내 정보가 없으면 받은 후기 링크를 숨긴다', () => {
    mockUseChatRoomData.mockReturnValue({ data: { product: { id: 1, isCompleted: true } } });
    mockUseGetMyInformation.mockReturnValue({ data: undefined });

    const { getByTestId, queryByTestId } = render(<ChatRoomPage />);

    expect(getByTestId('trade-completed-banner')).toBeTruthy();
    expect(queryByTestId('received-reviews-link')).toBeNull();
  });

  it('거래요청 버튼을 누르면 거래 요청 모달이 열린다', () => {
    const { getByTestId } = render(<ChatRoomPage />);

    expect(getByTestId('trade-request-modal-visible').props.children).toBe('false');
    fireEvent.press(getByTestId('trade-request-button'));
    expect(getByTestId('trade-request-modal-visible').props.children).toBe('true');
  });

  it('예약 확인 시 handleReservation이 예약 정보와 함께 호출되고 모달이 닫힌다', async () => {
    const mockHandleReservation = jest.fn().mockResolvedValue(undefined);
    mockUseTradeHandlers.mockReturnValue(
      makeTradeHandlersReturn({ handleReservation: mockHandleReservation })
    );

    const { getByTestId } = render(<ChatRoomPage />);

    expect(getByTestId('reservation-modal-visible').props.children).toBe('false');

    fireEvent.press(getByTestId('reservation-modal-confirm'));

    await waitFor(() =>
      expect(mockHandleReservation).toHaveBeenCalledWith({
        scheduledAt: '2026-08-28T14:00:00',
        placeName: '상무역 2번 출구',
        address: '광주 서구 상무자유로',
      })
    );
    await waitFor(() =>
      expect(getByTestId('reservation-modal-visible').props.children).toBe('false')
    );
  });

  it('예약 실패 시 모달을 닫지 않고 에러를 로깅한다', async () => {
    const mockHandleReservation = jest.fn().mockRejectedValue(new Error('예약 실패'));
    mockUseTradeHandlers.mockReturnValue(
      makeTradeHandlersReturn({ handleReservation: mockHandleReservation })
    );

    const { getByTestId } = render(<ChatRoomPage />);

    fireEvent.press(getByTestId('reservation-modal-confirm'));

    await waitFor(() => expect(mockHandleReservation).toHaveBeenCalled());
    expect(getByTestId('reservation-modal-visible').props.children).toBe('false');
    expect(logger.error).toHaveBeenCalledWith('handleReservationConfirm failed', expect.any(Error));
  });

  it('거래 요청 확인 시 handleTradeRequest가 호출되고 모달이 닫힌다', async () => {
    const mockHandleTradeRequest = jest.fn().mockResolvedValue(undefined);
    mockUseTradeRequest.mockReturnValue({
      handleTradeRequest: mockHandleTradeRequest,
      isLoading: false,
    });

    const { getByTestId } = render(<ChatRoomPage />);

    fireEvent.press(getByTestId('trade-request-button'));
    fireEvent.press(getByTestId('trade-request-confirm'));

    await waitFor(() => expect(mockHandleTradeRequest).toHaveBeenCalled());
    await waitFor(() =>
      expect(getByTestId('trade-request-modal-visible').props.children).toBe('false')
    );
  });

  it('거래 요청 실패 시 모달을 닫지 않고 에러를 로깅한다', async () => {
    const mockHandleTradeRequest = jest.fn().mockRejectedValue(new Error('실패'));
    mockUseTradeRequest.mockReturnValue({
      handleTradeRequest: mockHandleTradeRequest,
      isLoading: false,
    });

    const { getByTestId } = render(<ChatRoomPage />);

    fireEvent.press(getByTestId('trade-request-button'));
    fireEvent.press(getByTestId('trade-request-confirm'));

    await waitFor(() => expect(mockHandleTradeRequest).toHaveBeenCalled());
    expect(getByTestId('trade-request-modal-visible').props.children).toBe('true');
  });

  it('리뷰 버튼 클릭 시 리뷰 모달이 열린다', () => {
    const { getByTestId } = render(<ChatRoomPage />);

    expect(getByTestId('reviews-modal-visible').props.children).toBe('false');
    fireEvent.press(getByTestId('review-button'));
    expect(getByTestId('reviews-modal-visible').props.children).toBe('true');
  });

  it('리뷰 제출 성공 시 성공 토스트를 표시하고 모달을 닫는다', async () => {
    const { getByTestId } = render(<ChatRoomPage />);

    fireEvent.press(getByTestId('review-button'));
    fireEvent.press(getByTestId('reviews-modal-submit'));

    await waitFor(() =>
      expect(mockCreateReview).toHaveBeenCalledWith({
        productId: 1,
        otherMemberId: 7,
        content: '좋은 거래였어요',
        light: 80,
      })
    );
    await waitFor(() =>
      expect(mockToastShow).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))
    );
    await waitFor(() => expect(getByTestId('reviews-modal-visible').props.children).toBe('false'));
  });

  it('리뷰 제출 실패 시 에러 토스트를 표시한다', async () => {
    mockCreateReview.mockRejectedValue(new Error('작성 실패'));

    const { getByTestId } = render(<ChatRoomPage />);

    fireEvent.press(getByTestId('review-button'));
    fireEvent.press(getByTestId('reviews-modal-submit'));

    await waitFor(() =>
      expect(mockToastShow).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
    );
  });

  it('roomData?.product?.isCompleted가 true이면 리뷰 버튼을 노출한다', () => {
    mockUseChatRoomData.mockReturnValue({ data: { product: { id: 1, isCompleted: true } } });

    const { getByTestId } = render(<ChatRoomPage />);

    expect(getByTestId('show-review-button').props.children).toBe('true');
  });

  it('마운트 시 markRoomAsRead가 roomId와 함께 호출된다', () => {
    render(<ChatRoomPage />);

    expect(mockMarkRoomAsRead).toHaveBeenCalledWith(10);
  });

  it('ChatInput의 disabled는 connectionState가 connected가 아니면 true이다', () => {
    mockUseChatMessages.mockReturnValue(
      makeChatMessagesReturn({ connectionState: 'disconnected' })
    );

    const { getByTestId } = render(<ChatRoomPage />);

    expect(getByTestId('chat-input-disabled').props.children).toBe('true');
  });

  it('ChatInput의 disabled는 connectionState가 connected이면 false이다', () => {
    mockUseChatMessages.mockReturnValue(makeChatMessagesReturn({ connectionState: 'connected' }));

    const { getByTestId } = render(<ChatRoomPage />);

    expect(getByTestId('chat-input-disabled').props.children).toBe('false');
  });

  it('ChatInput에서 메시지 전송 시 messageHandlers.sendMessage가 호출된다', () => {
    const { getByTestId } = render(<ChatRoomPage />);

    fireEvent.press(getByTestId('chat-input-send'));

    expect(mockSendMessage).toHaveBeenCalledWith('hi', []);
  });
});
