import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { renderWithProviders as render } from '~/test-utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChatRoomData } from '~/entity/chat/model/useChatRoomData';
import { useChatMessages } from '~/widget/chat/model/useChatMessages';
import { useTradeHandlers } from '~/widget/chat/model/useTradeHandlers';
import { useReservationLocationStore } from '~/shared/store/useReservationLocationStore';
import { logger } from '~/shared/lib/logger';
import ReservationPage from '../index';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

jest.mock('~/shared/lib/logger', () => ({
  logger: { error: jest.fn() },
}));

// The real '~/shared/ui' barrel also re-exports Footer, which pulls in the chat
// entity -> axios -> AsyncStorage chain (native module, unavailable in this test
// environment). Re-export the real, self-contained Header/Button implementations
// directly to sidestep that chain while keeping real component behavior.
jest.mock('~/shared/ui', () => ({
  Header: require('~/shared/ui/Header').Header,
  Button: require('~/shared/ui/Button').Button,
}));

jest.mock('~/entity/chat/model/useChatRoomData', () => ({
  useChatRoomData: jest.fn(),
}));

jest.mock('~/widget/chat/model/useChatMessages', () => ({
  useChatMessages: jest.fn(),
}));

jest.mock('~/widget/chat/model/useTradeHandlers', () => ({
  useTradeHandlers: jest.fn(),
}));

jest.mock('~/shared/store/useReservationLocationStore', () => ({
  useReservationLocationStore: jest.fn(),
}));

// ReservationCalendarSheet / ReservationTimeSheet are covered by their own unit tests —
// stub them here so this file only exercises ReservationPage's own logic.
jest.mock('~/view/chat/ui/ReservationCalendarSheet', () => ({
  ReservationCalendarSheet: ({ isVisible, onClose, onSelect }: any) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View, Text, TouchableOpacity } = require('react-native');
    const today = new Date();
    const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return (
      <View testID="calendar-sheet">
        <Text testID="calendar-sheet-visible">{String(isVisible)}</Text>
        <TouchableOpacity testID="calendar-sheet-select" onPress={() => onSelect('2026-08-30')}>
          <Text>select-date</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="calendar-sheet-select-today" onPress={() => onSelect(todayValue)}>
          <Text>select-today</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="calendar-sheet-close" onPress={onClose}>
          <Text>close</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('~/view/chat/ui/ReservationTimeSheet', () => ({
  ReservationTimeSheet: ({ isVisible, onClose, onSelect }: any) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="time-sheet">
        <Text testID="time-sheet-visible">{String(isVisible)}</Text>
        <TouchableOpacity testID="time-sheet-select" onPress={() => onSelect('14:30')}>
          <Text>select-time</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="time-sheet-close" onPress={onClose}>
          <Text>close</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockUseChatRoomData = useChatRoomData as jest.Mock;
const mockUseChatMessages = useChatMessages as jest.Mock;
const mockUseTradeHandlers = useTradeHandlers as jest.Mock;
const mockUseReservationLocationStore = useReservationLocationStore as unknown as jest.Mock;
const mockLoggerError = logger.error as jest.Mock;

const mockRouterPush = jest.fn();
const mockRouterBack = jest.fn();
const mockSendMessage = jest.fn();
const mockHandleReservation = jest.fn();
const mockResetLocation = jest.fn();

const makeLocationStoreReturn = (overrides = {}) => ({
  latitude: null,
  longitude: null,
  address: '',
  placeName: '',
  reset: mockResetLocation,
  ...overrides,
});

// Header's title ("예약하기") and the confirm Button's label share the same text
// while enabled, so `getByText('예약하기')` is ambiguous — press the one that's
// actually wired to an onPress handler (the confirm button).
const pressReserveButton = (getAllByText: (text: string) => any[]) => {
  const candidates = getAllByText('예약하기');
  const buttonText = candidates.find((node) => {
    let current = node.parent;
    while (current) {
      if (typeof current.props?.onPress === 'function') return true;
      current = current.parent;
    }
    return false;
  });
  fireEvent.press(buttonText);
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({ id: '10' });
  mockUseRouter.mockReturnValue({ push: mockRouterPush, back: mockRouterBack });
  mockUseChatRoomData.mockReturnValue({ data: { product: { id: 1 } } });
  mockUseChatMessages.mockReturnValue({
    otherUserInfo: { nickname: '상대방', id: 7 },
    messageHandlers: { sendMessage: mockSendMessage },
  });
  mockHandleReservation.mockResolvedValue(undefined);
  mockUseTradeHandlers.mockReturnValue({ handleReservation: mockHandleReservation });
  mockUseReservationLocationStore.mockReturnValue(makeLocationStoreReturn());
});

describe('ReservationPage', () => {
  it('채팅방 데이터가 아직 없으면 useTradeHandlers에 roomData: null을 전달한다', () => {
    mockUseChatRoomData.mockReturnValue({ data: undefined });

    render(<ReservationPage />);

    expect(mockUseTradeHandlers).toHaveBeenCalledWith(expect.objectContaining({ roomData: null }));
  });

  it('상대방 닉네임이 있으면 거래 약속 문구를 표시한다', () => {
    const { getByText } = render(<ReservationPage />);

    expect(getByText('상대방님과의 거래 약속')).toBeTruthy();
  });

  it('상대방 닉네임이 없으면 거래 약속 문구를 표시하지 않는다', () => {
    mockUseChatMessages.mockReturnValue({
      otherUserInfo: { nickname: '', id: 7 },
      messageHandlers: { sendMessage: mockSendMessage },
    });

    const { queryByText } = render(<ReservationPage />);

    expect(queryByText(/님과의 거래 약속/)).toBeNull();
  });

  it('날짜/시간이 선택되지 않았으면 안내 placeholder를 보여준다', () => {
    const { getByText } = render(<ReservationPage />);

    expect(getByText('날짜를 선택해주세요')).toBeTruthy();
    expect(getByText('시간을 선택해주세요')).toBeTruthy();
    expect(getByText('장소를 선택해주세요')).toBeTruthy();
  });

  it('날짜 버튼을 누르면 캘린더 시트가 열린다', () => {
    const { getByText, getByTestId } = render(<ReservationPage />);

    expect(getByTestId('calendar-sheet-visible').props.children).toBe('false');
    fireEvent.press(getByText('날짜를 선택해주세요'));
    expect(getByTestId('calendar-sheet-visible').props.children).toBe('true');
  });

  it('시간 버튼을 누르면 시간 시트가 열린다', () => {
    const { getByText, getByTestId } = render(<ReservationPage />);

    expect(getByTestId('time-sheet-visible').props.children).toBe('false');
    fireEvent.press(getByText('시간을 선택해주세요'));
    expect(getByTestId('time-sheet-visible').props.children).toBe('true');
  });

  it('캘린더 시트를 닫으면 다시 숨겨진다', () => {
    const { getByText, getByTestId } = render(<ReservationPage />);

    fireEvent.press(getByText('날짜를 선택해주세요'));
    fireEvent.press(getByTestId('calendar-sheet-close'));
    expect(getByTestId('calendar-sheet-visible').props.children).toBe('false');
  });

  it('시간 시트를 닫으면 다시 숨겨진다', () => {
    const { getByText, getByTestId } = render(<ReservationPage />);

    fireEvent.press(getByText('시간을 선택해주세요'));
    fireEvent.press(getByTestId('time-sheet-close'));
    expect(getByTestId('time-sheet-visible').props.children).toBe('false');
  });

  it('장소 버튼을 누르면 지도 선택 화면으로 이동한다', () => {
    const { getByText } = render(<ReservationPage />);

    fireEvent.press(getByText('장소를 선택해주세요'));

    expect(mockRouterPush).toHaveBeenCalledWith('/chatting/10/reservation/map');
  });

  it('날짜를 선택하면 요일이 포함된 라벨로 표시된다 (오늘이 아닌 날짜)', () => {
    const { getByText, getByTestId } = render(<ReservationPage />);

    fireEvent.press(getByText('날짜를 선택해주세요'));
    fireEvent.press(getByTestId('calendar-sheet-select'));

    // 2026-08-30 -> 일요일, 오늘(2026-08-28)이 아니므로 "· 오늘" 접미사가 없다
    expect(getByText('8월 30일 (일)')).toBeTruthy();
  });

  it('오늘 날짜를 선택하면 라벨에 "· 오늘"이 붙는다', () => {
    const { getByText, getByTestId } = render(<ReservationPage />);

    fireEvent.press(getByText('날짜를 선택해주세요'));
    fireEvent.press(getByTestId('calendar-sheet-select-today'));

    expect(getByText(/· 오늘$/)).toBeTruthy();
  });

  it('시간을 선택하면 시간 버튼 라벨에 반영된다', () => {
    const { getByText, getByTestId } = render(<ReservationPage />);

    fireEvent.press(getByText('시간을 선택해주세요'));
    fireEvent.press(getByTestId('time-sheet-select'));

    expect(getByText('14:30')).toBeTruthy();
  });

  it('장소가 선택되면 주소가 함께 표시된다', () => {
    mockUseReservationLocationStore.mockReturnValue(
      makeLocationStoreReturn({
        latitude: 37.1,
        longitude: 126.9,
        address: '광산구 어딘가',
        placeName: '스타벅스',
      })
    );

    const { getByText } = render(<ReservationPage />);

    expect(getByText('스타벅스')).toBeTruthy();
    expect(getByText('광산구 어딘가')).toBeTruthy();
  });

  describe('canConfirm 게이팅', () => {
    it('날짜/시간/장소가 모두 없으면 예약하기를 눌러도 handleReservation이 호출되지 않는다', () => {
      const { getAllByText } = render(<ReservationPage />);

      pressReserveButton(getAllByText);

      expect(mockHandleReservation).not.toHaveBeenCalled();
    });

    it('날짜/시간만 있고 장소가 없으면 호출되지 않는다', () => {
      const { getByText, getAllByText, getByTestId } = render(<ReservationPage />);

      fireEvent.press(getByText('날짜를 선택해주세요'));
      fireEvent.press(getByTestId('calendar-sheet-select'));
      fireEvent.press(getByText('시간을 선택해주세요'));
      fireEvent.press(getByTestId('time-sheet-select'));

      pressReserveButton(getAllByText);

      expect(mockHandleReservation).not.toHaveBeenCalled();
    });

    it('placeName이 공백뿐이면 장소가 있는 것으로 간주하지 않는다', () => {
      mockUseReservationLocationStore.mockReturnValue(
        makeLocationStoreReturn({
          latitude: 37.1,
          longitude: 126.9,
          address: '주소',
          placeName: '   ',
        })
      );

      const { getByText, getAllByText, getByTestId } = render(<ReservationPage />);

      fireEvent.press(getByText('날짜를 선택해주세요'));
      fireEvent.press(getByTestId('calendar-sheet-select'));
      fireEvent.press(getByText('시간을 선택해주세요'));
      fireEvent.press(getByTestId('time-sheet-select'));

      pressReserveButton(getAllByText);

      expect(mockHandleReservation).not.toHaveBeenCalled();
    });
  });

  describe('handleConfirm', () => {
    const fillAllFields = (getByText: any, getByTestId: any) => {
      fireEvent.press(getByText('날짜를 선택해주세요'));
      fireEvent.press(getByTestId('calendar-sheet-select'));
      fireEvent.press(getByText('시간을 선택해주세요'));
      fireEvent.press(getByTestId('time-sheet-select'));
    };

    beforeEach(() => {
      mockUseReservationLocationStore.mockReturnValue(
        makeLocationStoreReturn({
          latitude: 37.1234,
          longitude: 126.9876,
          address: '  광산구 어딘가  ',
          placeName: '  스타벅스  ',
        })
      );
    });

    it('예약 성공 시 handleReservation을 올바른 payload로 호출하고, 요약 메시지 전송/위치 초기화/뒤로가기를 수행한다', async () => {
      const { getByText, getAllByText, getByTestId } = render(<ReservationPage />);

      fillAllFields(getByText, getByTestId);

      pressReserveButton(getAllByText);

      await waitFor(() =>
        expect(mockHandleReservation).toHaveBeenCalledWith({
          scheduledAt: '2026-08-30T14:30:00',
          placeName: '스타벅스',
          address: '광산구 어딘가',
          latitude: 37.1234,
          longitude: 126.9876,
        })
      );

      expect(mockSendMessage).toHaveBeenCalledWith(expect.stringContaining('예약을 했어요'), []);
      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.stringContaining('8월 30일 (일) 14:30'),
        []
      );
      expect(mockSendMessage).toHaveBeenCalledWith(expect.stringContaining('스타벅스'), []);

      await waitFor(() => expect(mockResetLocation).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(mockRouterBack).toHaveBeenCalledTimes(1));
    });

    it('예약 처리 중에는 버튼에 "예약 중..." 텍스트가 표시된다', async () => {
      let resolveReservation!: () => void;
      mockHandleReservation.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveReservation = resolve;
        })
      );

      const { getByText, getAllByText, getByTestId } = render(<ReservationPage />);
      fillAllFields(getByText, getByTestId);

      pressReserveButton(getAllByText);

      await waitFor(() => expect(getByText('예약 중...')).toBeTruthy());

      await act(async () => {
        resolveReservation();
        await Promise.resolve();
      });
    });

    it('예약 실패 시 에러를 로깅하고 isLoading을 초기화한다 (크래시 없음)', async () => {
      mockHandleReservation.mockRejectedValue(new Error('예약 실패'));

      const { getByText, getAllByText, getByTestId } = render(<ReservationPage />);

      fillAllFields(getByText, getByTestId);

      pressReserveButton(getAllByText);

      await waitFor(() =>
        expect(mockLoggerError).toHaveBeenCalledWith(
          'handleReservationConfirm failed',
          expect.any(Error)
        )
      );

      expect(mockResetLocation).not.toHaveBeenCalled();
      expect(mockRouterBack).not.toHaveBeenCalled();

      // finally에서 isLoading이 false로 복귀 -> 버튼 텍스트("예약하기")가 헤더 타이틀과
      // 함께 다시 2곳에서 매치된다(로딩 중엔 "예약 중..."이라 1곳뿐이었음).
      await waitFor(() => expect(getAllByText('예약하기')).toHaveLength(2));
    });
  });
});
