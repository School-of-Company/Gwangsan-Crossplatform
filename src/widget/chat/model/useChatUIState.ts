import { useMemo } from 'react';
import { useChatRoomData } from '~/entity/chat/model/useChatRoomData';
import { useGetItem } from '~/entity/post/model/useGetItem';
import { useGetMyInformation } from '~/entity/main/model/useGetMyInformation';
import { MODE } from '~/widget/write/model/mode';
import type { RoomId } from '~/shared/types/chatType';

interface UseChatUIStateParams {
  readonly roomId: RoomId;
  readonly otherUserInfo: { nickname: string; id?: number };
  readonly hasTradeRequest: boolean;
  readonly shouldShowButtons: boolean;
  readonly handleTradeAccept: () => Promise<void>;
  readonly handleReservation: () => Promise<void>;
  readonly handleCancelReservation: () => Promise<void>;
}

interface UseChatUIStateReturn {
  readonly tradeEmbedConfig: {
    readonly shouldShow: boolean;
    readonly product: any;
    readonly onTradeAccept?: () => Promise<void>;
    readonly onReservation?: () => void;
    readonly onCancelReservation?: () => void;
    readonly showButtons: boolean;
    readonly isLoading: boolean;
    readonly requestorNickname: string;
  };
  readonly menuConfig: {
    readonly shouldShowMenuButton: boolean;
    readonly isProductLoading: boolean;
    readonly isGiverMode: boolean;
  };
  readonly tradeRequestInfo: {
    readonly productId?: number;
    readonly sellerId?: number;
  };
  readonly componentState: {
    readonly hasMessages: boolean;
    readonly canSendMessage: boolean;
    readonly headerTitle: string;
  };
}

export const useChatUIState = ({
  roomId,
  otherUserInfo,
  hasTradeRequest,
  shouldShowButtons,
  handleTradeAccept,
  handleReservation,
  handleCancelReservation,
}: UseChatUIStateParams): UseChatUIStateReturn => {
  const { data: roomData } = useChatRoomData({ roomId });
  const { data: myInfo } = useGetMyInformation();

  const productId = roomData?.product?.id?.toString();
  const { data: productDetail, isLoading: isProductLoading } = useGetItem(productId);

  const isGiverMode = productDetail?.mode === MODE.GIVER;
  const shouldShowMenuButton = !isProductLoading && isGiverMode;

  const tradeEmbedConfig = useMemo(
    () => ({
      shouldShow: hasTradeRequest,
      product: roomData?.product,
      onTradeAccept: shouldShowButtons ? handleTradeAccept : undefined,
      onReservation: shouldShowButtons ? handleReservation : undefined,
      onCancelReservation: shouldShowButtons ? handleCancelReservation : undefined,
      showButtons: shouldShowButtons,
      isLoading: false,
      requestorNickname: shouldShowButtons ? otherUserInfo.nickname : myInfo?.nickname || '나',
    }),
    [
      hasTradeRequest,
      roomData?.product,
      shouldShowButtons,
      handleTradeAccept,
      handleReservation,
      handleCancelReservation,
      otherUserInfo.nickname,
      myInfo?.nickname,
    ]
  );

  const menuConfig = useMemo(
    () => ({
      shouldShowMenuButton,
      isProductLoading,
      isGiverMode,
    }),
    [shouldShowMenuButton, isProductLoading, isGiverMode]
  );

  const tradeRequestInfo = useMemo(
    () => ({
      productId: roomData?.product?.id,
      sellerId: otherUserInfo.id,
    }),
    [roomData?.product?.id, otherUserInfo.id]
  );

  const componentState = useMemo(
    () => ({
      hasMessages: false,
      canSendMessage: false,
      headerTitle: otherUserInfo.nickname,
    }),
    [otherUserInfo.nickname]
  );

  return {
    tradeEmbedConfig,
    menuConfig,
    tradeRequestInfo,
    componentState,
  };
};
