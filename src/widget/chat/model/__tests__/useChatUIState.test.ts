import { renderHookWithProviders } from '~/test-utils';
import { useChatUIState } from '../useChatUIState';

import { useChatRoomData } from '~/entity/chat/model/useChatRoomData';
import { useGetItem } from '~/entity/post/model/useGetItem';

jest.mock('~/entity/chat/model/useChatRoomData', () => ({
  useChatRoomData: jest.fn(),
}));

jest.mock('~/entity/post/model/useGetItem', () => ({
  useGetItem: jest.fn(),
}));

jest.mock('~/widget/write/model/mode', () => ({
  MODE: { GIVER: 'GIVER', RECEIVER: 'RECEIVER' },
}));

const mockUseChatRoomData = useChatRoomData as jest.Mock;
const mockUseGetItem = useGetItem as jest.Mock;

const setupMocks = (overrides: { roomData?: any; productDetail?: any } = {}) => {
  mockUseChatRoomData.mockReturnValue({ data: overrides.roomData ?? null });
  mockUseGetItem.mockReturnValue({ data: overrides.productDetail ?? null, isLoading: false });
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
  onOpenReservationModal: jest.fn(),
  onOpenMap: jest.fn(),
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
    it('productDetail.mode가 GIVER이면 isGiverMode가 true이다', () => {
      setupMocks({ productDetail: { mode: 'GIVER' } });

      const { result } = renderHookWithProviders(() => useChatUIState(defaultProps));

      expect(result.current.menuConfig.isGiverMode).toBe(true);
      expect(result.current.menuConfig.shouldShowMenuButton).toBe(true);
    });

    it('productDetail.mode가 RECEIVER이면 isGiverMode가 false이고 shouldShowMenuButton이 true이다', () => {
      setupMocks({ productDetail: { mode: 'RECEIVER' } });

      const { result } = renderHookWithProviders(() => useChatUIState(defaultProps));

      expect(result.current.menuConfig.isGiverMode).toBe(false);
      expect(result.current.menuConfig.shouldShowMenuButton).toBe(true);
    });

    it('productDetail이 없으면 shouldShowMenuButton이 false이다', () => {
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

    it('shouldShowButtons 값을 그대로 반영한다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatUIState({ ...defaultProps, shouldShowButtons: true })
      );

      expect(result.current.tradeEmbedConfig.showButtons).toBe(true);
    });

    it('shouldShowButtons=true이면 otherPartyNickname이 otherUserInfo.nickname이다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatUIState({ ...defaultProps, shouldShowButtons: true })
      );

      expect(result.current.tradeEmbedConfig.otherPartyNickname).toBe('상대방');
    });

    it('shouldShowButtons=false여도 otherPartyNickname이 otherUserInfo.nickname이다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatUIState({ ...defaultProps, shouldShowButtons: false })
      );

      expect(result.current.tradeEmbedConfig.otherPartyNickname).toBe('상대방');
    });

    it('shouldShowButtons=false이면 onOpenReservationModal이 undefined이다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatUIState({ ...defaultProps, shouldShowButtons: false })
      );

      expect(result.current.tradeEmbedConfig.onOpenReservationModal).toBeUndefined();
    });

    it('shouldShowButtons=true이면 onOpenReservationModal이 제공된다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatUIState({ ...defaultProps, shouldShowButtons: true })
      );

      expect(result.current.tradeEmbedConfig.onOpenReservationModal).toBeDefined();
    });

    it('예약 위치 좌표가 없으면 onOpenMap이 undefined이다', () => {
      setupMocks({ roomData: { product: { id: 1 } } });

      const { result } = renderHookWithProviders(() => useChatUIState(defaultProps));

      expect(result.current.tradeEmbedConfig.onOpenMap).toBeUndefined();
    });

    it('예약 위치 좌표가 있으면 onOpenMap이 제공된다', () => {
      setupMocks({
        roomData: { product: { id: 1, reservationLatitude: 35.14, reservationLongitude: 126.79 } },
      });

      const { result } = renderHookWithProviders(() => useChatUIState(defaultProps));

      expect(result.current.tradeEmbedConfig.onOpenMap).toBeDefined();
    });
  });

  describe('productInfoConfig', () => {
    it('roomData.product가 있으면 shouldShow가 true이다', () => {
      setupMocks({ roomData: { product: { id: 1, title: '상품' } } });

      const { result } = renderHookWithProviders(() => useChatUIState(defaultProps));

      expect(result.current.productInfoConfig.shouldShow).toBe(true);
    });

    it('roomData.product가 없으면 shouldShow가 false이다', () => {
      const { result } = renderHookWithProviders(() => useChatUIState(defaultProps));

      expect(result.current.productInfoConfig.shouldShow).toBe(false);
    });

    it('productDetail.title이 있으면 title로 사용한다', () => {
      setupMocks({
        roomData: { product: { id: 1, title: '채팅방 상품명' } },
        productDetail: { title: '상세 상품명', gwangsan: 3000 },
      });

      const { result } = renderHookWithProviders(() => useChatUIState(defaultProps));

      expect(result.current.productInfoConfig.title).toBe('상세 상품명');
    });

    it('productDetail이 없으면 roomData.product.title을 사용한다', () => {
      setupMocks({ roomData: { product: { id: 1, title: '채팅방 상품명' } } });

      const { result } = renderHookWithProviders(() => useChatUIState(defaultProps));

      expect(result.current.productInfoConfig.title).toBe('채팅방 상품명');
    });

    it('productDetail.gwangsan을 가격으로 노출한다', () => {
      setupMocks({
        roomData: { product: { id: 1, title: '상품' } },
        productDetail: { title: '상품', gwangsan: 5000 },
      });

      const { result } = renderHookWithProviders(() => useChatUIState(defaultProps));

      expect(result.current.productInfoConfig.gwangsan).toBe(5000);
    });

    it('productDetail의 첫 이미지를 imageUrl로 사용한다', () => {
      setupMocks({
        roomData: { product: { id: 1, title: '상품', images: [{ imageUrl: 'room.png' }] } },
        productDetail: { title: '상품', images: [{ imageUrl: 'detail.png' }] },
      });

      const { result } = renderHookWithProviders(() => useChatUIState(defaultProps));

      expect(result.current.productInfoConfig.imageUrl).toBe('detail.png');
    });

    it('productDetail 이미지가 없으면 roomData.product의 첫 이미지를 사용한다', () => {
      setupMocks({
        roomData: { product: { id: 1, title: '상품', images: [{ imageUrl: 'room.png' }] } },
      });

      const { result } = renderHookWithProviders(() => useChatUIState(defaultProps));

      expect(result.current.productInfoConfig.imageUrl).toBe('room.png');
    });
  });
});
