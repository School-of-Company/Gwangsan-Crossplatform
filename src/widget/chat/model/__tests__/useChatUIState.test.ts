import { renderHookWithProviders } from '~/test-utils';
import { useChatUIState } from '../useChatUIState';

import { useChatRoomData } from '~/entity/chat/model/useChatRoomData';
import { useGetMyInformation } from '~/entity/main/model/useGetMyInformation';

jest.mock('~/entity/chat/model/useChatRoomData', () => ({
  useChatRoomData: jest.fn(),
}));

jest.mock('~/entity/main/model/useGetMyInformation', () => ({
  useGetMyInformation: jest.fn(),
}));

const mockUseChatRoomData = useChatRoomData as jest.Mock;
const mockUseGetMyInformation = useGetMyInformation as jest.Mock;

const setupMocks = (overrides: { roomData?: any; myInfo?: any } = {}) => {
  mockUseChatRoomData.mockReturnValue({ data: overrides.roomData ?? null });
  mockUseGetMyInformation.mockReturnValue({ data: overrides.myInfo ?? { nickname: '내닉네임' } });
};

beforeEach(() => {
  jest.clearAllMocks();
  setupMocks();
});

const defaultProps = {
  roomId: 'room-1' as any,
  otherUserInfo: { nickname: '상대방', id: 42 },
  hasTradeRequest: false,
  shouldShowButtons: false,
  handleTradeAccept: jest.fn(),
  handleReservation: jest.fn(),
  handleCancelReservation: jest.fn(),
};

describe('useChatUIState', () => {
  describe('componentState', () => {
    it('headerTitle은 otherUserInfo.nickname이다', () => {
      const { result } = renderHookWithProviders(() => useChatUIState(defaultProps));

      expect(result.current.componentState.headerTitle).toBe('상대방');
    });
  });

  describe('tradeRequestInfo', () => {
    it('roomData에 product.id가 있으면 productId를 반환한다', () => {
      setupMocks({ roomData: { product: { id: 5 } } });

      const { result } = renderHookWithProviders(() => useChatUIState(defaultProps));

      expect(result.current.tradeRequestInfo.productId).toBe(5);
    });

    it('sellerId는 otherUserInfo.id이다', () => {
      const { result } = renderHookWithProviders(() => useChatUIState(defaultProps));

      expect(result.current.tradeRequestInfo.sellerId).toBe(42);
    });

    it('roomData가 없으면 productId가 undefined이다', () => {
      const { result } = renderHookWithProviders(() => useChatUIState(defaultProps));

      expect(result.current.tradeRequestInfo.productId).toBeUndefined();
    });
  });

  describe('menuConfig', () => {
    it('거래 요청이 없고 완료되지 않은 product가 있으면 shouldShowMenuButton이 true이다', () => {
      setupMocks({
        roomData: { product: { id: 1, createdAt: null, isCompleted: false } },
      });

      const { result } = renderHookWithProviders(() => useChatUIState(defaultProps));

      expect(result.current.menuConfig.shouldShowMenuButton).toBe(true);
    });

    it('거래 요청이 있으면(createdAt !== null) shouldShowMenuButton이 false이다', () => {
      setupMocks({
        roomData: { product: { id: 1, createdAt: '2026-01-01T00:00:00Z', isCompleted: false } },
      });

      const { result } = renderHookWithProviders(() => useChatUIState(defaultProps));

      expect(result.current.menuConfig.shouldShowMenuButton).toBe(false);
    });

    it('거래가 완료되면 shouldShowMenuButton이 false이다', () => {
      setupMocks({
        roomData: { product: { id: 1, createdAt: null, isCompleted: true } },
      });

      const { result } = renderHookWithProviders(() => useChatUIState(defaultProps));

      expect(result.current.menuConfig.shouldShowMenuButton).toBe(false);
    });

    it('product가 없으면 shouldShowMenuButton이 false이다', () => {
      const { result } = renderHookWithProviders(() => useChatUIState(defaultProps));

      expect(result.current.menuConfig.shouldShowMenuButton).toBe(false);
    });
  });

  describe('tradeEmbedConfig', () => {
    it('hasTradeRequest=true이면 shouldShow가 true이다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatUIState({ ...defaultProps, hasTradeRequest: true })
      );

      expect(result.current.tradeEmbedConfig.shouldShow).toBe(true);
    });

    it('hasTradeRequest=false이면 shouldShow가 false이다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatUIState({ ...defaultProps, hasTradeRequest: false })
      );

      expect(result.current.tradeEmbedConfig.shouldShow).toBe(false);
    });

    it('shouldShowButtons=false이면 핸들러들이 undefined이다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatUIState({ ...defaultProps, shouldShowButtons: false })
      );

      expect(result.current.tradeEmbedConfig.onTradeAccept).toBeUndefined();
      expect(result.current.tradeEmbedConfig.onReservation).toBeUndefined();
      expect(result.current.tradeEmbedConfig.onCancelReservation).toBeUndefined();
    });

    it('shouldShowButtons=true이면 핸들러들이 제공된다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatUIState({ ...defaultProps, shouldShowButtons: true })
      );

      expect(result.current.tradeEmbedConfig.onTradeAccept).toBeDefined();
      expect(result.current.tradeEmbedConfig.onReservation).toBeDefined();
      expect(result.current.tradeEmbedConfig.onCancelReservation).toBeDefined();
    });

    it('shouldShowButtons=true이면 requestorNickname이 otherUserInfo.nickname이다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatUIState({ ...defaultProps, shouldShowButtons: true })
      );

      expect(result.current.tradeEmbedConfig.requestorNickname).toBe('상대방');
    });

    it('shouldShowButtons=false이면 requestorNickname이 myInfo.nickname이다', () => {
      setupMocks({ myInfo: { nickname: '나의닉네임' } });

      const { result } = renderHookWithProviders(() =>
        useChatUIState({ ...defaultProps, shouldShowButtons: false })
      );

      expect(result.current.tradeEmbedConfig.requestorNickname).toBe('나의닉네임');
    });

    it('shouldShowButtons=false이고 myInfo가 없으면 requestorNickname이 "나"이다', () => {
      setupMocks({ myInfo: null });
      mockUseGetMyInformation.mockReturnValue({ data: null });

      const { result } = renderHookWithProviders(() =>
        useChatUIState({ ...defaultProps, shouldShowButtons: false })
      );

      expect(result.current.tradeEmbedConfig.requestorNickname).toBe('나');
    });
  });
});
