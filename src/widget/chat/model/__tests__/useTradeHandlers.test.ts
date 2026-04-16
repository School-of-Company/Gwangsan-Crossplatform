import { act } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useTradeHandlers } from '../useTradeHandlers';
import { requestTrade } from '~/entity/post/api/requestTrade';
import { makeReservation } from '~/entity/post/api/makeReservation';
import { cancelReservation } from '~/entity/post/api/cancelReservation';
import Toast from 'react-native-toast-message';

jest.mock('~/entity/post/api/requestTrade', () => ({ requestTrade: jest.fn() }));
jest.mock('~/entity/post/api/makeReservation', () => ({ makeReservation: jest.fn() }));
jest.mock('~/entity/post/api/cancelReservation', () => ({ cancelReservation: jest.fn() }));
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockRequestTrade = requestTrade as jest.Mock;
const mockMakeReservation = makeReservation as jest.Mock;
const mockCancelReservation = cancelReservation as jest.Mock;

beforeEach(() => jest.clearAllMocks());

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
        useTradeHandlers({ roomData: makeRoomData(), otherUserInfo })
      );

      expect(result.current.hasTradeRequest).toBe(true);
    });

    it('product.createdAt이 null이면 hasTradeRequest가 false이다', () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomData: makeRoomData({ createdAt: null }), otherUserInfo })
      );

      expect(result.current.hasTradeRequest).toBe(false);
    });

    it('product가 null이면 hasTradeRequest가 false이다', () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomData: { product: null }, otherUserInfo })
      );

      expect(result.current.hasTradeRequest).toBe(false);
    });

    it('roomData가 null이면 hasTradeRequest가 false이다', () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomData: null, otherUserInfo })
      );

      expect(result.current.hasTradeRequest).toBe(false);
    });
  });

  describe('shouldShowButtons', () => {
    it('hasTradeRequest=true, isCompletable=true이면 shouldShowButtons가 true이다', () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomData: makeRoomData({ isCompletable: true }), otherUserInfo })
      );

      expect(result.current.shouldShowButtons).toBe(true);
    });

    it('isCompletable=false이면 shouldShowButtons가 false이다', () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomData: makeRoomData({ isCompletable: false }), otherUserInfo })
      );

      expect(result.current.shouldShowButtons).toBe(false);
    });

    it('createdAt이 null이면 shouldShowButtons가 false이다', () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomData: makeRoomData({ createdAt: null }), otherUserInfo })
      );

      expect(result.current.shouldShowButtons).toBe(false);
    });
  });

  describe('handleTradeAccept', () => {
    it('성공 시 requestTrade를 호출하고 성공 Toast를 표시한다', async () => {
      mockRequestTrade.mockResolvedValue({});

      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomData: makeRoomData(), otherUserInfo })
      );

      await act(async () => {
        await result.current.handleTradeAccept();
      });

      expect(mockRequestTrade).toHaveBeenCalledWith({ productId: 1, otherMemberId: 42 });
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', text1: '거래가 수락되었습니다!' })
      );
    });

    it('실패 시 에러 Toast를 표시한다', async () => {
      mockRequestTrade.mockRejectedValue(new Error('수락 실패'));

      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomData: makeRoomData(), otherUserInfo })
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
        useTradeHandlers({ roomData: makeRoomData(), otherUserInfo: { nickname: '상대방' } })
      );

      await act(async () => {
        await result.current.handleTradeAccept();
      });

      expect(mockRequestTrade).not.toHaveBeenCalled();
    });

    it('productId가 없으면 requestTrade를 호출하지 않는다', async () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomData: { product: null }, otherUserInfo })
      );

      await act(async () => {
        await result.current.handleTradeAccept();
      });

      expect(mockRequestTrade).not.toHaveBeenCalled();
    });
  });

  describe('handleReservation', () => {
    it('성공 시 makeReservation을 호출하고 성공 Toast를 표시한다', async () => {
      mockMakeReservation.mockResolvedValue({});

      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomData: makeRoomData(), otherUserInfo })
      );

      await act(async () => {
        await result.current.handleReservation();
      });

      expect(mockMakeReservation).toHaveBeenCalledWith({ productId: 1 });
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', text1: '예약이 완료되었습니다!' })
      );
    });

    it('실패 시 에러 Toast를 표시한다', async () => {
      mockMakeReservation.mockRejectedValue(new Error('예약 실패'));

      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomData: makeRoomData(), otherUserInfo })
      );

      await act(async () => {
        await result.current.handleReservation();
      });

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', text1: '예약 실패' })
      );
    });

    it('productId가 없으면 makeReservation을 호출하지 않는다', async () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomData: { product: null }, otherUserInfo })
      );

      await act(async () => {
        await result.current.handleReservation();
      });

      expect(mockMakeReservation).not.toHaveBeenCalled();
    });
  });

  describe('handleCancelReservation', () => {
    it('성공 시 cancelReservation을 호출하고 성공 Toast를 표시한다', async () => {
      mockCancelReservation.mockResolvedValue({});

      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomData: makeRoomData(), otherUserInfo })
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
        useTradeHandlers({ roomData: makeRoomData(), otherUserInfo })
      );

      await act(async () => {
        await result.current.handleCancelReservation();
      });

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', text1: '예약 취소 실패', text2: '취소 실패' })
      );
    });

    it('productId가 없으면 cancelReservation을 호출하지 않는다', async () => {
      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomData: { product: null }, otherUserInfo })
      );

      await act(async () => {
        await result.current.handleCancelReservation();
      });

      expect(mockCancelReservation).not.toHaveBeenCalled();
    });

    it('non-Error 실패 시 알 수 없는 오류 메시지를 표시한다', async () => {
      mockCancelReservation.mockRejectedValue('string error');

      const { result } = renderHookWithProviders(() =>
        useTradeHandlers({ roomData: makeRoomData(), otherUserInfo })
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
        useTradeHandlers({ roomData: makeRoomData(), otherUserInfo })
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
        useTradeHandlers({ roomData: makeRoomData(), otherUserInfo })
      );

      await act(async () => {
        await result.current.handleReservation();
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
