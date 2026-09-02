import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { renderWithProviders as render } from '~/test-utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChatRoomData } from '~/entity/chat/model/useChatRoomData';
import { useChatMessages } from '~/widget/chat/model/useChatMessages';
import { useGetItem } from '~/entity/post';
import { createReview } from '~/entity/post/api/createReview';
import { logger } from '~/shared/lib/logger';
import Toast from 'react-native-toast-message';
import ReviewWritePage from '../index';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
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

// 실제 '~/shared/ui' 배럴은 Footer도 함께 export하는데, 이 컴포넌트는
// chat entity -> axios -> AsyncStorage(네이티브 모듈, 테스트 환경 미지원) 체인을
// 끌고 온다. 실제 동작은 유지하면서 그 체인만 피하려고 자체완결적인
// Header/Button/ProgressBar 구현을 직접 재노출한다.
jest.mock('~/shared/ui', () => ({
  Header: require('~/shared/ui/Header').Header,
  Button: require('~/shared/ui/Button').Button,
  ProgressBar: require('~/shared/ui/ProgressBar').default,
}));

jest.mock('~/entity/chat/model/useChatRoomData', () => ({
  useChatRoomData: jest.fn(),
}));

jest.mock('~/widget/chat/model/useChatMessages', () => ({
  useChatMessages: jest.fn(),
}));

jest.mock('~/entity/post', () => ({
  useGetItem: jest.fn(),
}));

jest.mock('~/entity/post/api/createReview', () => ({
  createReview: jest.fn(),
}));

jest.mock('~/widget/chat/ui/ChatRoomProductInfo', () => ({
  ChatRoomProductInfo: ({ title, gwangsan }: any) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View, Text } = require('react-native');
    return (
      <View testID="chat-room-product-info">
        <Text testID="chat-room-product-info-title">{title}</Text>
        <Text testID="chat-room-product-info-gwangsan">{gwangsan}</Text>
      </View>
    );
  },
}));

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockUseChatRoomData = useChatRoomData as jest.Mock;
const mockUseChatMessages = useChatMessages as jest.Mock;
const mockUseGetItem = useGetItem as jest.Mock;
const mockCreateReview = createReview as jest.Mock;
const mockToastShow = Toast.show as jest.Mock;
const mockLoggerError = logger.error as jest.Mock;

const mockRouterBack = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({ id: '10' });
  mockUseRouter.mockReturnValue({ back: mockRouterBack });
  mockUseChatRoomData.mockReturnValue({
    data: { product: { id: 1, title: '상품', images: [{ imageId: 1, imageUrl: 'a.png' }] } },
  });
  mockUseChatMessages.mockReturnValue({ otherUserInfo: { nickname: '상대방', id: 7 } });
  mockUseGetItem.mockReturnValue({ data: undefined });
  mockCreateReview.mockResolvedValue(true);
});

describe('ReviewWritePage', () => {
  it('거래 품목 정보를 표시한다', () => {
    const { getByTestId } = render(<ReviewWritePage />);

    expect(getByTestId('chat-room-product-info-title').props.children).toBe('상품');
  });

  it('useGetItem으로 받아온 상세 정보(제목/광산)가 있으면 그것을 우선한다', () => {
    mockUseGetItem.mockReturnValue({ data: { title: '상세 제목', gwangsan: 5000, images: [] } });

    const { getByTestId } = render(<ReviewWritePage />);

    expect(getByTestId('chat-room-product-info-title').props.children).toBe('상세 제목');
    expect(getByTestId('chat-room-product-info-gwangsan').props.children).toBe(5000);
  });

  it('후기 내용이 비어있으면 작성완료 버튼이 비활성화된다', () => {
    const { getByText } = render(<ReviewWritePage />);

    let node: any = getByText('작성완료');
    while (node && node.props.disabled === undefined) {
      node = node.parent;
    }
    expect(node?.props.disabled).toBe(true);
  });

  it('후기 내용을 입력하고 작성완료를 누르면 createReview가 호출되고 뒤로 이동한다', async () => {
    const { getByPlaceholderText, getByText } = render(<ReviewWritePage />);

    fireEvent.changeText(getByPlaceholderText('거래의 후기를 입력해주세요'), '좋은 거래였어요');
    fireEvent.press(getByText('작성완료'));

    await waitFor(() =>
      expect(mockCreateReview).toHaveBeenCalledWith({
        productId: 1,
        otherMemberId: 7,
        content: '좋은 거래였어요',
        light: 60,
      })
    );
    await waitFor(() =>
      expect(mockToastShow).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', text1: '리뷰가 성공적으로 작성되었습니다.' })
      )
    );
    await waitFor(() => expect(mockRouterBack).toHaveBeenCalledTimes(1));
  });

  it('제출 중에는 버튼에 "작성 중..." 텍스트가 표시된다', async () => {
    let resolveSubmit!: () => void;
    mockCreateReview.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      })
    );

    const { getByPlaceholderText, getByText } = render(<ReviewWritePage />);

    fireEvent.changeText(getByPlaceholderText('거래의 후기를 입력해주세요'), '좋은 거래였어요');
    fireEvent.press(getByText('작성완료'));

    await waitFor(() => expect(getByText('작성 중...')).toBeTruthy());

    await act(async () => {
      resolveSubmit();
      await Promise.resolve();
    });
  });

  it('제출 실패 시 에러를 로깅하고 에러 토스트를 표시한다 (뒤로 이동하지 않음)', async () => {
    mockCreateReview.mockRejectedValue(new Error('작성 실패'));

    const { getByPlaceholderText, getByText } = render(<ReviewWritePage />);

    fireEvent.changeText(getByPlaceholderText('거래의 후기를 입력해주세요'), '좋은 거래였어요');
    fireEvent.press(getByText('작성완료'));

    await waitFor(() =>
      expect(mockLoggerError).toHaveBeenCalledWith('리뷰 작성 실패', expect.any(Error))
    );
    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '리뷰 작성 실패' })
    );
    expect(mockRouterBack).not.toHaveBeenCalled();
  });
});
