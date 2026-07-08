import { act, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { renderHookWithProviders } from '~/test-utils';
import Toast from 'react-native-toast-message';
import { useTradeRequest } from '../useTradeRequest';
import { requestTrade } from '../../api/requestTrade';
import { useChatEntry } from '~/shared/lib/useChatEntry';
import { logger } from '~/shared/lib/logger';

jest.mock('../../api/requestTrade', () => ({
  requestTrade: jest.fn(),
}));

jest.mock('~/shared/lib/useChatEntry', () => ({
  useChatEntry: jest.fn(),
}));

jest.mock('~/shared/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn() },
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockRequestTrade = requestTrade as jest.Mock;
const mockUseChatEntry = useChatEntry as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

describe('useTradeRequest', () => {
  const mockPush = jest.fn();
  const mockNavigateToChat = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush });
    mockUseChatEntry.mockReturnValue({ navigateToChat: mockNavigateToChat, isLoading: false });
  });

  describe('초기 상태', () => {
    it('isLoading이 false이다', () => {
      const { result } = renderHookWithProviders(() =>
        useTradeRequest({ productId: 1, sellerId: 2 })
      );

      expect(result.current.isLoading).toBe(false);
      expect(typeof result.current.handleTradeRequest).toBe('function');
    });
  });

  describe('거래 신청 성공', () => {
    it('requestTrade를 올바른 파라미터로 호출한다', async () => {
      mockRequestTrade.mockResolvedValue({ success: true, roomId: 10 });

      const { result } = renderHookWithProviders(() =>
        useTradeRequest({ productId: 1, sellerId: 2 })
      );

      await act(async () => {
        await result.current.handleTradeRequest();
      });

      expect(mockRequestTrade).toHaveBeenCalledWith({ productId: 1, otherMemberId: 2 });
    });

    it('성공 Toast를 표시한다', async () => {
      mockRequestTrade.mockResolvedValue({ success: true, roomId: 10 });

      const { result } = renderHookWithProviders(() =>
        useTradeRequest({ productId: 1, sellerId: 2 })
      );

      await act(async () => {
        await result.current.handleTradeRequest();
      });

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', text1: '거래 신청이 전송되었습니다' })
      );
    });

    it('roomId가 있으면 채팅방으로 바로 이동한다', async () => {
      mockRequestTrade.mockResolvedValue({ success: true, roomId: 10 });

      const { result } = renderHookWithProviders(() =>
        useTradeRequest({ productId: 1, sellerId: 2 })
      );

      await act(async () => {
        await result.current.handleTradeRequest();
      });

      expect(mockPush).toHaveBeenCalledWith('/chatting/10');
      expect(mockNavigateToChat).not.toHaveBeenCalled();
    });

    it('roomId가 없으면 navigateToChat으로 이동한다', async () => {
      mockRequestTrade.mockResolvedValue({ success: true, roomId: 0 });

      const { result } = renderHookWithProviders(() =>
        useTradeRequest({ productId: 1, sellerId: 2 })
      );

      await act(async () => {
        await result.current.handleTradeRequest();
      });

      expect(mockNavigateToChat).toHaveBeenCalledWith(1);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('요청 완료 후 isLoading이 false로 돌아온다', async () => {
      mockRequestTrade.mockResolvedValue({ success: true, roomId: 10 });

      const { result } = renderHookWithProviders(() =>
        useTradeRequest({ productId: 1, sellerId: 2 })
      );

      await act(async () => {
        await result.current.handleTradeRequest();
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('채팅 이동 실패', () => {
    it('navigateToChat 실패 시 logger.error를 호출한다', async () => {
      mockRequestTrade.mockResolvedValue({ success: true, roomId: 0 });
      const navError = new Error('이동 실패');
      mockNavigateToChat.mockRejectedValue(navError);

      const { result } = renderHookWithProviders(() =>
        useTradeRequest({ productId: 1, sellerId: 2 })
      );

      await act(async () => {
        await result.current.handleTradeRequest();
      });

      expect(logger.error).toHaveBeenCalledWith('Chat navigation failed', navError);
    });

    it('navigateToChat 실패 시 info Toast를 에러 메시지와 함께 표시한다', async () => {
      mockRequestTrade.mockResolvedValue({ success: true, roomId: 0 });
      mockNavigateToChat.mockRejectedValue(new Error('이동 실패'));

      const { result } = renderHookWithProviders(() =>
        useTradeRequest({ productId: 1, sellerId: 2 })
      );

      await act(async () => {
        await result.current.handleTradeRequest();
      });

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          text1: '채팅방 이동 중 오류가 발생했습니다',
          text2: '이동 실패',
        })
      );
    });

    it('navigateToChat이 Error가 아닌 값으로 실패하면 기본 메시지를 표시한다', async () => {
      mockRequestTrade.mockResolvedValue({ success: true, roomId: 0 });
      mockNavigateToChat.mockRejectedValue('문자열 에러');

      const { result } = renderHookWithProviders(() =>
        useTradeRequest({ productId: 1, sellerId: 2 })
      );

      await act(async () => {
        await result.current.handleTradeRequest();
      });

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          text2: '채팅하기 버튼을 눌러 이동해주세요.',
        })
      );
    });

    it('채팅 이동 실패해도 거래 신청 자체는 성공으로 처리되어 에러를 던지지 않는다', async () => {
      mockRequestTrade.mockResolvedValue({ success: true, roomId: 0 });
      mockNavigateToChat.mockRejectedValue(new Error('이동 실패'));

      const { result } = renderHookWithProviders(() =>
        useTradeRequest({ productId: 1, sellerId: 2 })
      );

      await expect(
        act(async () => {
          await result.current.handleTradeRequest();
        })
      ).resolves.not.toThrow();
    });
  });

  describe('거래 신청 실패', () => {
    it('requestTrade 실패 시 에러 Toast를 표시한다', async () => {
      mockRequestTrade.mockRejectedValue(new Error('거래 신청 실패했습니다'));

      const { result } = renderHookWithProviders(() =>
        useTradeRequest({ productId: 1, sellerId: 2 })
      );

      await act(async () => {
        try {
          await result.current.handleTradeRequest();
        } catch {
          // expected
        }
      });

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text1: '거래 신청 실패',
          text2: '거래 신청 실패했습니다',
        })
      );
    });

    it('requestTrade 실패 시 기본 메시지를 표시한다 (Error 인스턴스가 아닌 경우)', async () => {
      mockRequestTrade.mockRejectedValue('알 수 없는 에러');

      const { result } = renderHookWithProviders(() =>
        useTradeRequest({ productId: 1, sellerId: 2 })
      );

      await act(async () => {
        try {
          await result.current.handleTradeRequest();
        } catch {
          // expected
        }
      });

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', text2: '다시 시도해주세요.' })
      );
    });

    it('requestTrade 실패 시 에러를 다시 throw한다', async () => {
      mockRequestTrade.mockRejectedValue(new Error('실패'));

      const { result } = renderHookWithProviders(() =>
        useTradeRequest({ productId: 1, sellerId: 2 })
      );

      await act(async () => {
        await expect(result.current.handleTradeRequest()).rejects.toThrow('실패');
      });
    });

    it('요청 실패 후 isLoading이 false로 돌아온다', async () => {
      mockRequestTrade.mockRejectedValue(new Error('실패'));

      const { result } = renderHookWithProviders(() =>
        useTradeRequest({ productId: 1, sellerId: 2 })
      );

      await act(async () => {
        try {
          await result.current.handleTradeRequest();
        } catch {
          // expected
        }
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
    });
  });

  describe('로딩 상태', () => {
    it('요청 진행 중 isLoading이 true이다', async () => {
      let resolveRequest!: (value: { success: boolean; roomId: number }) => void;
      mockRequestTrade.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveRequest = resolve;
          })
      );

      const { result } = renderHookWithProviders(() =>
        useTradeRequest({ productId: 1, sellerId: 2 })
      );

      act(() => {
        result.current.handleTradeRequest();
      });

      await waitFor(() => expect(result.current.isLoading).toBe(true));

      await act(async () => {
        resolveRequest({ success: true, roomId: 10 });
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
    });
  });
});
