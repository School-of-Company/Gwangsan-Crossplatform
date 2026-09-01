import { act } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useTradeHandlers } from '../useTradeHandlers';
import { requestTrade } from '~/entity/post/api/requestTrade';
import { withdrawTrade } from '~/entity/post/api/withdrawTrade';
import { makeReservation } from '~/entity/post/api/makeReservation';
import { cancelReservation } from '~/entity/post/api/cancelReservation';
import Toast from 'react-native-toast-message';

jest.mock('~/entity/post/api/requestTrade', () => ({ requestTrade: jest.fn() }));
jest.mock('~/entity/post/api/withdrawTrade', () => ({ withdrawTrade: jest.fn() }));
jest.mock('~/entity/post/api/makeReservation', () => ({ makeReservation: jest.fn() }));
jest.mock('~/entity/post/api/cancelReservation', () => ({ cancelReservation: jest.fn() }));
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockRequestTrade = requestTrade as jest.Mock;
const mockWithdrawTrade = withdrawTrade as jest.Mock;
const mockMakeReservation = makeReservation as jest.Mock;
const mockCancelReservation = cancelReservation as jest.Mock;

const reservationInput = {
  scheduledAt: '2026-08-27T14:30:00',
  placeName: '상무역 2번 출구',
  address: '광주 서구 상무자유로',
  latitude: 35.15,
  longitude: 126.85,
};

beforeEach(() => {
  jest.clearAllMocks();
});

const makeRoomData = (overrides: Record<string, any> = {}) => ({
  product: {
    id: 1,
    createdAt: '2026-01-01T00:00:00Z',
    isCompletable: true,
    ...overrides,
  },
});

describe('useTradeHandlers', () => {
  const otherUserInfo = { nickname: '상대방', id: 42 };

  describe('hasTradeRequest', () => {
    it('product.createdAt이 있으면 hasTradeRequest가 true이다', () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomId: 1, roomData: makeRoomData(), otherUserInfo })
      );

      expect(result.current.hasTradeRequest).toBe(true);
    });

    it('product.createdAt이 null이면 hasTradeRequest가 false이다', () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomId: 1, roomData: makeRoomData({ createdAt: null }), otherUserInfo })
      );

      expect(result.current.hasTradeRequest).toBe(false);
    });

    it('product가 null이면 hasTradeRequest가 false이다', () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomId: 1, roomData: { product: null }, otherUserInfo })
      );

      expect(result.current.hasTradeRequest).toBe(false);
    });

    it('roomData가 null이면 hasTradeRequest가 false이다', () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomId: 1, roomData: null, otherUserInfo })
      );

      expect(result.current.hasTradeRequest).toBe(false);
    });
  });

  describe('shouldShowButtons', () => {
    it('hasTradeRequest=true, isCompletable=true이면 shouldShowButtons가 true이다', () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({
          roomId: 1,
          roomData: makeRoomData({ isCompletable: true }),
          otherUserInfo,
        })
      );

      expect(result.current.shouldShowButtons).toBe(true);
    });

    it('isCompletable=false이면 shouldShowButtons가 false이다', () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({
          roomId: 1,
          roomData: makeRoomData({ isCompletable: false }),
          otherUserInfo,
        })
      );

      expect(result.current.shouldShowButtons).toBe(false);
    });

    it('createdAt이 null이면 shouldShowButtons가 false이다', () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomId: 1, roomData: makeRoomData({ createdAt: null }), otherUserInfo })
      );

      expect(result.current.shouldShowButtons).toBe(false);
    });
  });

  describe('canWithdrawTradeRequest', () => {
    it('hasTradeRequest=true, isCompletable=false이면 canWithdrawTradeRequest가 true이다', () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({
          roomId: 1,
          roomData: makeRoomData({ isCompletable: false }),
          otherUserInfo,
        })
      );

      expect(result.current.canWithdrawTradeRequest).toBe(true);
    });

    it('isCompletable=true이면 canWithdrawTradeRequest가 false이다', () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({
          roomId: 1,
          roomData: makeRoomData({ isCompletable: true }),
          otherUserInfo,
        })
      );

      expect(result.current.canWithdrawTradeRequest).toBe(false);
    });

    it('createdAt이 null이면 canWithdrawTradeRequest가 false이다', () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({
          roomId: 1,
          roomData: makeRoomData({ createdAt: null, isCompletable: false }),
          otherUserInfo,
        })
      );

      expect(result.current.canWithdrawTradeRequest).toBe(false);
    });
  });

  describe('handleTradeAccept', () => {
    it('성공 시 requestTrade를 호출하고 성공 Toast를 표시한다', async () => {
      mockRequestTrade.mockResolvedValue({});

      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomId: 1, roomData: makeRoomData(), otherUserInfo })
      );

      await act(async () => {
        await result.current.handleTradeAccept();
      });

      expect(mockRequestTrade).toHaveBeenCalledWith({ productId: 1, otherMemberId: 42 });
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', text1: '거래가 수락되었습니다!' })
      );
    });

    it('성공 시 chatRoomData 캐시를 isCompleted=true, isCompletable=false로 즉시 업데이트한다', async () => {
      mockRequestTrade.mockResolvedValue({});

      const { result, queryClient } = renderHookWithProviders(() =>
        useTradeHandlers({ roomId: 1, roomData: makeRoomData(), otherUserInfo })
      );

      queryClient.setQueryData(['chatRoomData', 1], {
        product: { id: 1, isCompleted: false, isCompletable: true },
      });

      await act(async () => {
        await result.current.handleTradeAccept();
      });

      const cached = queryClient.getQueryData<{ product: Record<string, unknown> }>([
        'chatRoomData',
        1,
      ]);
      expect(cached?.product.isCompleted).toBe(true);
      expect(cached?.product.isCompletable).toBe(false);
    });

    it('실패 시 캐시를 변경하지 않는다', async () => {
      mockRequestTrade.mockRejectedValue(new Error('수락 실패'));

      const { result, queryClient } = renderHookWithProviders(() =>
        useTradeHandlers({ roomId: 1, roomData: makeRoomData(), otherUserInfo })
      );

      queryClient.setQueryData(['chatRoomData', 1], {
        product: { id: 1, isCompleted: false, isCompletable: true },
      });

      await act(async () => {
        await result.current.handleTradeAccept();
      });

      const cached = queryClient.getQueryData<{ product: Record<string, unknown> }>([
        'chatRoomData',
        1,
      ]);
      expect(cached?.product.isCompleted).toBe(false);
      expect(cached?.product.isCompletable).toBe(true);
    });

    it('실패 시 에러 Toast를 표시한다', async () => {
      mockRequestTrade.mockRejectedValue(new Error('수락 실패'));

      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomId: 1, roomData: makeRoomData(), otherUserInfo })
      );

      await act(async () => {
        await result.current.handleTradeAccept();
      });

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', text1: '거래 수락 실패', text2: '수락 실패' })
      );
    });

    it('otherUserInfo.id가 없으면 requestTrade를 호출하지 않는다', async () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({
          roomId: 1,
          roomData: makeRoomData(),
          otherUserInfo: { nickname: '상대방' },
        })
      );

      await act(async () => {
        await result.current.handleTradeAccept();
      });

      expect(mockRequestTrade).not.toHaveBeenCalled();
    });

    it('productId가 없으면 requestTrade를 호출하지 않는다', async () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomId: 1, roomData: { product: null }, otherUserInfo })
      );

      await act(async () => {
        await result.current.handleTradeAccept();
      });

      expect(mockRequestTrade).not.toHaveBeenCalled();
    });
  });

  describe('handleTradeRequestButtonPress', () => {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const recentCreatedAt = new Date(Date.now() - (ONE_DAY_MS - 60 * 60 * 1000)).toISOString();
    const staleCreatedAt = new Date(Date.now() - (ONE_DAY_MS + 60 * 60 * 1000)).toISOString();

    it('내가 보낸 대기중 요청이 없으면 API 호출 없이 true를 반환한다', async () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({
          roomId: 1,
          roomData: makeRoomData({ isCompletable: true }),
          otherUserInfo,
        })
      );

      await act(async () => {
        await expect(result.current.handleTradeRequestButtonPress()).resolves.toBe(true);
      });

      expect(mockWithdrawTrade).not.toHaveBeenCalled();
      expect(mockRequestTrade).not.toHaveBeenCalled();
    });

    it('대기중 요청을 보낸지 하루가 안 지났으면 안내 Toast만 띄우고 false를 반환한다', async () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({
          roomId: 1,
          roomData: makeRoomData({ isCompletable: false, createdAt: recentCreatedAt }),
          otherUserInfo,
        })
      );

      await act(async () => {
        await expect(result.current.handleTradeRequestButtonPress()).resolves.toBe(false);
      });

      expect(mockWithdrawTrade).not.toHaveBeenCalled();
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'info', text1: '내일 다시 보낼 수 있어요' })
      );
    });

    it('대기중 요청을 보낸지 하루가 지났으면 취소 안내 없이 내부적으로 withdrawTrade를 호출하고 true를 반환한다', async () => {
      mockWithdrawTrade.mockResolvedValue(undefined);

      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({
          roomId: 1,
          roomData: makeRoomData({ isCompletable: false, createdAt: staleCreatedAt }),
          otherUserInfo,
        })
      );

      await act(async () => {
        await expect(result.current.handleTradeRequestButtonPress()).resolves.toBe(true);
      });

      expect(mockWithdrawTrade).toHaveBeenCalledWith({ productId: 1, otherMemberId: 42 });
      expect(Toast.show).not.toHaveBeenCalled();
    });

    it('하루가 지나 재요청할 때 성공 시 chatRoomData 캐시를 createdAt=null, isCompletable=true로 즉시 업데이트한다', async () => {
      mockWithdrawTrade.mockResolvedValue(undefined);

      const { result, queryClient } = renderHookWithProviders(() =>
        useTradeHandlers({
          roomId: 1,
          roomData: makeRoomData({ isCompletable: false, createdAt: staleCreatedAt }),
          otherUserInfo,
        })
      );

      queryClient.setQueryData(['chatRoomData', 1], {
        product: { id: 1, createdAt: staleCreatedAt, isCompletable: false },
      });

      await act(async () => {
        await result.current.handleTradeRequestButtonPress();
      });

      const cached = queryClient.getQueryData<{ product: Record<string, unknown> }>([
        'chatRoomData',
        1,
      ]);
      expect(cached?.product.createdAt).toBeNull();
      expect(cached?.product.isCompletable).toBe(true);
    });

    it('withdrawTrade 실패 시 에러 Toast를 표시하고 false를 반환한다', async () => {
      mockWithdrawTrade.mockRejectedValue(new Error('취소 실패'));

      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({
          roomId: 1,
          roomData: makeRoomData({ isCompletable: false, createdAt: staleCreatedAt }),
          otherUserInfo,
        })
      );

      await act(async () => {
        await expect(result.current.handleTradeRequestButtonPress()).resolves.toBe(false);
      });

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', text1: '거래 요청 실패', text2: '취소 실패' })
      );
    });

    it('otherUserInfo.id가 없으면 withdrawTrade를 호출하지 않고 false를 반환한다', async () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({
          roomId: 1,
          roomData: makeRoomData({ isCompletable: false, createdAt: staleCreatedAt }),
          otherUserInfo: { nickname: '상대방' },
        })
      );

      await act(async () => {
        await expect(result.current.handleTradeRequestButtonPress()).resolves.toBe(false);
      });

      expect(mockWithdrawTrade).not.toHaveBeenCalled();
    });
  });

  describe('handleReservation', () => {
    it('성공 시 전달받은 좌표로 makeReservation을 호출하고 성공 Toast를 표시한다', async () => {
      mockMakeReservation.mockResolvedValue(undefined);

      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomId: 1, roomData: makeRoomData(), otherUserInfo })
      );

      await act(async () => {
        await result.current.handleReservation(reservationInput);
      });

      expect(mockMakeReservation).toHaveBeenCalledWith({
        productId: 1,
        roomId: 1,
        scheduledAt: reservationInput.scheduledAt,
        placeName: reservationInput.placeName,
        address: reservationInput.address,
        latitude: 35.15,
        longitude: 126.85,
      });
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', text1: '예약이 완료되었습니다!' })
      );
    });

    it('실패 시 에러 Toast를 표시한다', async () => {
      mockMakeReservation.mockRejectedValue(new Error('예약 실패'));

      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomId: 1, roomData: makeRoomData(), otherUserInfo })
      );

      await act(async () => {
        await result.current.handleReservation(reservationInput).catch(() => undefined);
      });

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', text1: '예약 실패' })
      );
    });

    it('실패 시 에러를 다시 throw한다', async () => {
      mockMakeReservation.mockRejectedValue(new Error('예약 실패'));

      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomId: 1, roomData: makeRoomData(), otherUserInfo })
      );

      await act(async () => {
        await expect(result.current.handleReservation(reservationInput)).rejects.toThrow(
          '예약 실패'
        );
      });
    });

    it('성공 시 캐시된 product에 예약 정보를 갱신한다', async () => {
      mockMakeReservation.mockResolvedValue(undefined);

      const { result, queryClient } = renderHookWithProviders(() =>
        useTradeHandlers({ roomId: 1, roomData: makeRoomData(), otherUserInfo })
      );

      queryClient.setQueryData(['chatRoomData', 1], {
        product: { id: 1, isReserved: false },
      });

      await act(async () => {
        await result.current.handleReservation(reservationInput);
      });

      const cached = queryClient.getQueryData<{ product: Record<string, unknown> }>([
        'chatRoomData',
        1,
      ]);
      expect(cached?.product.isReserved).toBe(true);
      expect(cached?.product.reservationScheduledAt).toBe(reservationInput.scheduledAt);
      expect(cached?.product.reservationPlaceName).toBe(reservationInput.placeName);
      expect(cached?.product.reservationAddress).toBe(reservationInput.address);
      expect(cached?.product.reservationLatitude).toBe(35.15);
      expect(cached?.product.reservationLongitude).toBe(126.85);
    });

    it('실패 시 캐시된 product.isReserved를 갱신하지 않는다', async () => {
      mockMakeReservation.mockRejectedValue(new Error('예약 실패'));

      const { result, queryClient } = renderHookWithProviders(() =>
        useTradeHandlers({ roomId: 1, roomData: makeRoomData(), otherUserInfo })
      );

      queryClient.setQueryData(['chatRoomData', 1], {
        product: { id: 1, isReserved: false },
      });

      await act(async () => {
        await result.current.handleReservation(reservationInput).catch(() => undefined);
      });

      const cached = queryClient.getQueryData<{ product: Record<string, unknown> }>([
        'chatRoomData',
        1,
      ]);
      expect(cached?.product.isReserved).toBe(false);
    });

    it('productId가 없으면 makeReservation을 호출하지 않는다', async () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomId: 1, roomData: { product: null }, otherUserInfo })
      );

      await act(async () => {
        await result.current.handleReservation(reservationInput);
      });

      expect(mockMakeReservation).not.toHaveBeenCalled();
    });
  });

  describe('handleCancelReservation', () => {
    it('성공 시 cancelReservation을 호출하고 성공 Toast를 표시한다', async () => {
      mockCancelReservation.mockResolvedValue({});

      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomId: 1, roomData: makeRoomData(), otherUserInfo })
      );

      await act(async () => {
        await result.current.handleCancelReservation();
      });

      expect(mockCancelReservation).toHaveBeenCalledWith({ productId: 1 });
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', text1: '예약이 취소되었습니다!' })
      );
    });

    it('실패 시 에러 Toast를 표시한다', async () => {
      mockCancelReservation.mockRejectedValue(new Error('취소 실패'));

      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomId: 1, roomData: makeRoomData(), otherUserInfo })
      );

      await act(async () => {
        await result.current.handleCancelReservation();
      });

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', text1: '예약 취소 실패', text2: '취소 실패' })
      );
    });

    it('성공 시 캐시된 예약 정보를 초기화한다', async () => {
      mockCancelReservation.mockResolvedValue({});

      const { result, queryClient } = renderHookWithProviders(() =>
        useTradeHandlers({ roomId: 1, roomData: makeRoomData(), otherUserInfo })
      );

      queryClient.setQueryData(['chatRoomData', 1], {
        product: {
          id: 1,
          isReserved: true,
          reservationScheduledAt: '2026-08-27T14:30:00',
          reservationPlaceName: '상무역 2번 출구',
          reservationAddress: '광주 서구 상무자유로',
          reservationLatitude: 35.15,
          reservationLongitude: 126.85,
        },
      });

      await act(async () => {
        await result.current.handleCancelReservation();
      });

      const cached = queryClient.getQueryData<{ product: Record<string, unknown> }>([
        'chatRoomData',
        1,
      ]);
      expect(cached?.product.isReserved).toBe(false);
      expect(cached?.product.reservationScheduledAt).toBeNull();
      expect(cached?.product.reservationPlaceName).toBeNull();
      expect(cached?.product.reservationAddress).toBeNull();
      expect(cached?.product.reservationLatitude).toBeNull();
      expect(cached?.product.reservationLongitude).toBeNull();
    });

    it('productId가 없으면 cancelReservation을 호출하지 않는다', async () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomId: 1, roomData: { product: null }, otherUserInfo })
      );

      await act(async () => {
        await result.current.handleCancelReservation();
      });

      expect(mockCancelReservation).not.toHaveBeenCalled();
    });

    it('non-Error 실패 시 알 수 없는 오류 메시지를 표시한다', async () => {
      mockCancelReservation.mockRejectedValue('string error');

      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomId: 1, roomData: makeRoomData(), otherUserInfo })
      );

      await act(async () => {
        await result.current.handleCancelReservation();
      });

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text2: '알 수 없는 오류가 발생했습니다.',
        })
      );
    });
  });

  describe('non-Error 거부 메시지', () => {
    it('handleTradeAccept non-Error 실패 시 알 수 없는 오류 메시지를 표시한다', async () => {
      mockRequestTrade.mockRejectedValue('string error');

      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomId: 1, roomData: makeRoomData(), otherUserInfo })
      );

      await act(async () => {
        await result.current.handleTradeAccept();
      });

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text2: '알 수 없는 오류가 발생했습니다.',
        })
      );
    });

    it('handleReservation non-Error 실패 시 알 수 없는 오류 메시지를 표시한다', async () => {
      mockMakeReservation.mockRejectedValue('string error');

      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomId: 1, roomData: makeRoomData(), otherUserInfo })
      );

      await act(async () => {
        await result.current.handleReservation(reservationInput).catch(() => undefined);
      });

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text2: '알 수 없는 오류가 발생했습니다.',
        })
      );
    });
  });
});
